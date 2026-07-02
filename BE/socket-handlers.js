const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("./models/user.model");
const Friends = require("./models/friends.model");
const GameHistory = require("./models/game-history.model");
const { eloDelta } = require("./utils/elo");

const userRoom = (userId) => `user:${userId}`;

/** Push an event to every socket a specific user has open, regardless of tab count. */
const notifyUser = (io, userId, event, payload) => {
	io.to(userRoom(userId)).emit(event, payload);
};

/** Whether a user currently has at least one live socket connected. */
const isUserOnline = (io, userId) => {
	const room = io.sockets.adapter.rooms.get(userRoom(userId));
	return !!room && room.size > 0;
};

/** One live Socket instance for a user, if any (arbitrary pick among their tabs). */
const getSocketForUser = (io, userId) => {
	const room = io.sockets.adapter.rooms.get(userRoom(userId));
	if (!room || room.size === 0) return null;
	const socketId = room.values().next().value;
	return io.sockets.sockets.get(socketId) || null;
};

/**
 * In-memory state. Resets on server restart — acceptable for this scope
 * (live games are lost on redeploy; finished games are already in Mongo).
 */
const queues = new Map(); // time control -> [socket]
const rooms = new Map(); // room code -> { players: {white, black}, time, sans: [], finished, started }
const socketRoom = new Map(); // socket.id -> room code

const makeRoomCode = () => crypto.randomBytes(3).toString("hex").toUpperCase();

const playerInfo = (socket) => ({
	id: socket.data.user.id,
	username: socket.data.user.username,
	rating: socket.data.user.rating,
});

const removeFromQueues = (socket) => {
	for (const [time, sockets] of queues) {
		queues.set(
			time,
			sockets.filter((s) => s.id !== socket.id)
		);
	}
};

const buildPgn = (sans) =>
	sans
		.map((san, i) => (i % 2 === 0 ? `${i / 2 + 1}. ${san}` : san))
		.join(" ");

/**
 * Persist the game and update both ratings. Idempotent per room.
 * result convention: white's score — 1 win, 0 loss, 0.5 draw.
 */
async function finishGame(io, roomCode, result, pgn) {
	const room = rooms.get(roomCode);
	if (!room || room.finished) return;
	room.finished = true;

	const { white, black } = room.players;

	try {
		// Fetch fresh ratings — the ones cached at connect go stale after a game.
		const [whiteUser, blackUser] = await Promise.all([
			User.findById(white.id).select("rating"),
			User.findById(black.id).select("rating"),
		]);
		const whiteRating = whiteUser ? whiteUser.rating : white.rating;
		const blackRating = blackUser ? blackUser.rating : black.rating;
		const whiteDelta = eloDelta(whiteRating, blackRating, result);
		const blackDelta = eloDelta(blackRating, whiteRating, 1 - result);

		await GameHistory.create({
			player_id: white.id,
			opponent_id: black.id,
			result,
			pgn: pgn || buildPgn(room.sans) || "1. -",
			variant: "standard",
		});
		await User.updateOne(
			{ _id: white.id },
			{ $inc: { rating: whiteDelta, number_of_matches: 1 } }
		);
		await User.updateOne(
			{ _id: black.id },
			{ $inc: { rating: blackDelta, number_of_matches: 1 } }
		);
		io.to(roomCode).emit("ratings_updated", {
			white: { username: white.username, rating: whiteRating + whiteDelta, delta: whiteDelta },
			black: { username: black.username, rating: blackRating + blackDelta, delta: blackDelta },
		});
	} catch (err) {
		console.error(`Failed to persist game ${roomCode}:`, err);
	} finally {
		// Give late events a moment, then drop the room from memory.
		setTimeout(() => rooms.delete(roomCode), 60_000);
	}
}

function startGame(io, roomCode, socketA, socketB, time) {
	// Random color assignment — the server decides, clients never pick.
	const [whiteSocket, blackSocket] =
		Math.random() < 0.5 ? [socketA, socketB] : [socketB, socketA];

	rooms.set(roomCode, {
		players: { white: playerInfo(whiteSocket), black: playerInfo(blackSocket) },
		time,
		sans: [],
		finished: false,
	});
	whiteSocket.join(roomCode);
	blackSocket.join(roomCode);
	socketRoom.set(whiteSocket.id, roomCode);
	socketRoom.set(blackSocket.id, roomCode);

	whiteSocket.emit("game_start", {
		room: roomCode,
		color: "white",
		time,
		opponent: playerInfo(blackSocket),
	});
	blackSocket.emit("game_start", {
		room: roomCode,
		color: "black",
		time,
		opponent: playerInfo(whiteSocket),
	});
}

function attachSocket(io) {
	io.use(async (socket, next) => {
		try {
			const token = socket.handshake.auth && socket.handshake.auth.token;
			if (!token) return next(new Error("Authentication required"));
			const payload = jwt.verify(token, process.env.JWT_SECRET);
			const user = await User.findById(payload.id).select("username rating");
			if (!user) return next(new Error("User not found"));
			socket.data.user = { id: user._id.toString(), username: user.username, rating: user.rating };
			next();
		} catch (err) {
			next(new Error("Authentication failed"));
		}
	});

	io.on("connection", (socket) => {
		console.log(`${socket.data.user.username} connected`);
		socket.join(userRoom(socket.data.user.id));

		socket.on("challenge_friend", async ({ friendUserId, time }) => {
			try {
				const friendship = await Friends.findOne({
					status: "accepted",
					$or: [
						{ player_id: socket.data.user.id, friend_id: friendUserId },
						{ player_id: friendUserId, friend_id: socket.data.user.id },
					],
				});
				if (!friendship) {
					return socket.emit("room_error", { message: "You can only challenge friends" });
				}
				if (!isUserOnline(io, friendUserId)) {
					return socket.emit("room_error", { message: "That friend is offline right now" });
				}
				const code = makeRoomCode();
				rooms.set(code, { host: socket, time, pending: true });
				notifyUser(io, friendUserId, "challenge_received", {
					from: { id: socket.data.user.id, username: socket.data.user.username, rating: socket.data.user.rating },
					time,
					room: code,
				});
				socket.emit("challenge_sent", { room: code, to: friendUserId });
			} catch (err) {
				socket.emit("room_error", { message: "Could not send challenge" });
			}
		});

		socket.on("challenge_declined", ({ room }) => {
			const pending = rooms.get(room);
			if (!pending || !pending.pending) return;
			rooms.delete(room);
			notifyUser(io, pending.host.data.user.id, "challenge_declined", { room });
		});

		socket.on("find_match", ({ time }) => {
			removeFromQueues(socket);
			const queue = queues.get(time) || [];
			// Don't pair a user with themselves (e.g. two tabs).
			const opponent = queue.find(
				(s) => s.connected && s.data.user.id !== socket.data.user.id
			);
			if (opponent) {
				queues.set(time, queue.filter((s) => s.id !== opponent.id));
				startGame(io, makeRoomCode(), socket, opponent, time);
			} else {
				queues.set(time, [...queue.filter((s) => s.connected), socket]);
			}
		});

		socket.on("cancel_find", () => removeFromQueues(socket));

		socket.on("create_room", ({ time }) => {
			const code = makeRoomCode();
			rooms.set(code, { host: socket, time, pending: true });
			socket.emit("room_created", { room: code });
		});

		socket.on("join_room", ({ room }) => {
			const code = (room || "").toUpperCase().trim();
			const pending = rooms.get(code);
			if (!pending || !pending.pending || !pending.host.connected) {
				return socket.emit("room_error", { message: "Room not found" });
			}
			if (pending.host.data.user.id === socket.data.user.id) {
				return socket.emit("room_error", { message: "You cannot join your own room" });
			}
			startGame(io, code, pending.host, socket, pending.time);
		});

		socket.on("send_move", ({ room, move }) => {
			const state = rooms.get(room);
			if (state && state.sans && move && move.san) state.sans.push(move.san);
			socket.to(room).emit("receive_move", move);
		});

		// Board-detected endings: checkmate, stalemate, draw, flag fall.
		// result is from white's perspective: 1 / 0 / 0.5.
		socket.on("game_over", ({ room, result, pgn }) => {
			finishGame(io, room, result, pgn);
		});

		socket.on("request_rematch", ({ room }) => {
			const state = rooms.get(room);
			if (!state || !state.finished || !state.players) {
				return socket.emit("room_error", { message: "That game session has expired" });
			}
			if (!state.rematchRequested) state.rematchRequested = new Set();
			state.rematchRequested.add(socket.data.user.id);

			const { white, black } = state.players;
			const otherId = socket.data.user.id === white.id ? black.id : white.id;

			if (state.rematchRequested.has(white.id) && state.rematchRequested.has(black.id)) {
				const whiteSocket = getSocketForUser(io, white.id);
				const blackSocket = getSocketForUser(io, black.id);
				if (whiteSocket && blackSocket) {
					startGame(io, makeRoomCode(), whiteSocket, blackSocket, state.time);
				}
			} else {
				socket.emit("rematch_waiting");
				notifyUser(io, otherId, "rematch_offered", {});
			}
		});

		socket.on("resign", ({ room, pgn }) => {
			const state = rooms.get(room);
			if (!state || state.finished || !state.players) return;
			const resignerIsWhite = state.players.white.id === socket.data.user.id;
			const result = resignerIsWhite ? 0 : 1;
			io.to(room).emit("game_ended", { result, reason: "resign" });
			finishGame(io, room, result, pgn);
		});

		socket.on("offer_draw", ({ room }) => {
			socket.to(room).emit("draw_offered");
		});

		socket.on("draw_response", ({ room, accepted, pgn }) => {
			if (accepted) {
				io.to(room).emit("game_ended", { result: 0.5, reason: "draw_agreed" });
				finishGame(io, room, 0.5, pgn);
			} else {
				socket.to(room).emit("draw_declined");
			}
		});

		socket.on("disconnect", () => {
			removeFromQueues(socket);
			for (const [code, state] of rooms) {
				if (state.pending && state.host.id === socket.id) rooms.delete(code);
			}
			const roomCode = socketRoom.get(socket.id);
			socketRoom.delete(socket.id);
			if (!roomCode) return;
			const state = rooms.get(roomCode);
			if (!state || state.finished || !state.players) return;

			const leaverIsWhite = state.players.white.id === socket.data.user.id;
			if ((state.sans || []).length < 2) {
				// Barely started — abort without rating changes.
				state.finished = true;
				io.to(roomCode).emit("game_ended", { result: null, reason: "abort" });
			} else {
				const result = leaverIsWhite ? 0 : 1;
				io.to(roomCode).emit("game_ended", { result, reason: "opponent_left" });
				finishGame(io, roomCode, result);
			}
		});
	});
}

module.exports = attachSocket;
module.exports.notifyUser = notifyUser;
module.exports.isUserOnline = isUserOnline;
