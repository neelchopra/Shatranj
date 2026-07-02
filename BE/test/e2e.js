/**
 * End-to-end test for the Shatranj backend.
 * Runs the real server against an in-memory MongoDB, exercises REST auth,
 * matchmaking, move relay, game persistence, Elo, friend rooms, resign,
 * draw and disconnect flows with real socket.io clients.
 *
 * Run with: npm test (from the BE directory)
 */
const { spawn } = require("child_process");
const path = require("path");

const BE_DIR = path.join(__dirname, "..");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const axios = require("axios");
const { io } = require("socket.io-client");
const Puzzle = require("../models/puzzle.model");

const PORT = 8123;
const BASE = `http://127.0.0.1:${PORT}`;

let passed = 0;
let failed = 0;
const check = (name, cond, extra) => {
	if (cond) {
		passed++;
		console.log(`  PASS  ${name}`);
	} else {
		failed++;
		console.log(`  FAIL  ${name}${extra ? " — " + JSON.stringify(extra) : ""}`);
	}
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const waitFor = (socket, event, timeout = 5000) =>
	new Promise((resolve, reject) => {
		const t = setTimeout(() => reject(new Error(`timeout waiting for ${event}`)), timeout);
		socket.once(event, (data) => {
			clearTimeout(t);
			resolve(data);
		});
	});

async function main() {
	console.log("Starting in-memory MongoDB...");
	const mongod = await MongoMemoryServer.create();
	const uri = mongod.getUri("shatranj");
	console.log("Mongo up at", uri);

	console.log("Starting server...");
	const server = spawn("node", ["server.js"], {
		cwd: BE_DIR,
		env: {
			...process.env,
			MONGODB_URI: uri,
			JWT_SECRET: "e2e-test-secret",
			PORT: String(PORT),
			CLIENT_ORIGIN: "http://localhost:3000",
		},
		stdio: ["ignore", "pipe", "pipe"],
	});
	server.stdout.on("data", (d) => process.stdout.write("  [server] " + d));
	server.stderr.on("data", (d) => process.stdout.write("  [server-err] " + d));

	// Wait for health check
	let up = false;
	for (let i = 0; i < 40; i++) {
		try {
			await axios.get(`${BASE}/health`);
			up = true;
			break;
		} catch (e) {
			await sleep(250);
		}
	}
	check("server boots and /health responds", up);
	if (!up) return cleanup(server, mongod);

	// Seed a small, deterministic puzzle set (separate mongoose connection —
	// the server process has its own) spanning the rating bands the real
	// Lichess-derived dataset would.
	const testFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
	await mongoose.connect(uri);
	await Puzzle.insertMany(
		Array.from({ length: 10 }, (_, i) => ({
			puzzleId: `test-${i}`,
			fen: testFen,
			moves: ["e2e4", "e7e5"],
			rating: 600 + i * 200 + 50,
			themes: ["test"],
		}))
	);
	await mongoose.disconnect();

	// ---------- REST: auth ----------
	console.log("\n== REST auth ==");
	const reg = await axios.post(`${BASE}/users/register`, {
		username: "alice", email: "alice@test.com", password: "secret123",
	});
	check("register returns 201 + token + user", reg.status === 201 && !!reg.data.token && reg.data.user.username === "alice");
	check("register response has no password", reg.data.user.password === undefined);

	const dup = await axios.post(`${BASE}/users/register`, {
		username: "alice", email: "other@test.com", password: "secret123",
	}, { validateStatus: () => true });
	check("duplicate username -> 409 naming the field", dup.status === 409 && /username/.test(dup.data.message), dup.data);

	const missing = await axios.post(`${BASE}/users/register`, { username: "x" }, { validateStatus: () => true });
	check("missing fields -> 400", missing.status === 400);

	const bobReg = await axios.post(`${BASE}/users/register`, {
		username: "bob", email: "bob@test.com", password: "secret123",
	});
	check("second user registers", bobReg.status === 201);

	const badLogin = await axios.post(`${BASE}/users/login`, {
		username: "alice", password: "wrongpass",
	}, { validateStatus: () => true, timeout: 3000 });
	check("wrong password -> immediate 401 (no hang)", badLogin.status === 401);

	const ghost = await axios.post(`${BASE}/users/login`, {
		username: "nobody", password: "x",
	}, { validateStatus: () => true });
	check("unknown user -> 401", ghost.status === 401);

	const login = await axios.post(`${BASE}/users/login`, { username: "alice", password: "secret123" });
	check("login returns token + user sans password", !!login.data.token && login.data.user.password === undefined);
	const aliceToken = login.data.token;
	const bobToken = bobReg.data.token;
	const auth = (t) => ({ headers: { Authorization: `Bearer ${t}` } });

	const me = await axios.get(`${BASE}/users/me`, auth(aliceToken));
	check("GET /users/me returns profile", me.data.username === "alice" && me.data.rating === 400);

	const noAuth = await axios.get(`${BASE}/users/me`, { validateStatus: () => true });
	check("GET /users/me without token -> 401", noAuth.status === 401);

	const lb = await axios.get(`${BASE}/users/leaderboard`);
	check("leaderboard is public and lists both users", lb.status === 200 && lb.data.length === 2);

	const search = await axios.get(`${BASE}/users/search-users?q=bo`, auth(aliceToken));
	check("search finds bob", search.data.length === 1 && search.data[0].username === "bob");

	// ---------- REST: friends ----------
	console.log("\n== REST friend requests ==");
	const bobId = search.data[0]._id;
	const reqSend = await axios.post(`${BASE}/users/friend-requests`, { recipient_id: bobId }, auth(aliceToken));
	check("send friend request -> 201", reqSend.status === 201);
	const reqDup = await axios.post(`${BASE}/users/friend-requests`, { recipient_id: bobId }, { ...auth(aliceToken), validateStatus: () => true });
	check("duplicate request -> 409", reqDup.status === 409);

	const bobIncoming = await axios.get(`${BASE}/users/friend-requests`, auth(bobToken));
	check("bob sees alice's incoming request", bobIncoming.data.incoming.length === 1 && bobIncoming.data.incoming[0].user.username === "alice");
	const aliceOutgoing = await axios.get(`${BASE}/users/friend-requests`, auth(aliceToken));
	check("alice sees her outgoing request to bob", aliceOutgoing.data.outgoing.length === 1 && aliceOutgoing.data.outgoing[0].user.username === "bob");

	const requestId = bobIncoming.data.incoming[0].requestId;
	const wrongAccept = await axios.post(`${BASE}/users/friend-requests/${requestId}/accept`, {}, { ...auth(aliceToken), validateStatus: () => true });
	check("only the recipient can accept -> 404", wrongAccept.status === 404);
	const accept = await axios.post(`${BASE}/users/friend-requests/${requestId}/accept`, {}, auth(bobToken));
	check("bob accepts the request", accept.status === 200);

	const aliceFriendsPre = await axios.get(`${BASE}/users/friends`, auth(aliceToken));
	check("friendship is symmetric and includes presence", aliceFriendsPre.data.length === 1 && aliceFriendsPre.data[0].username === "bob" && aliceFriendsPre.data[0].online === false);

	const carolReg = await axios.post(`${BASE}/users/register`, { username: "carol", email: "carol@test.com", password: "secret123" });
	const carolToken = carolReg.data.token;
	const carolId = carolReg.data.user._id;
	const declineReq = await axios.post(`${BASE}/users/friend-requests`, { recipient_id: carolId }, auth(aliceToken));
	check("alice can send a second, independent request (to carol)", declineReq.status === 201);
	const carolIncoming = await axios.get(`${BASE}/users/friend-requests`, auth(carolToken));
	const carolReqId = carolIncoming.data.incoming[0].requestId;
	const decline = await axios.post(`${BASE}/users/friend-requests/${carolReqId}/decline`, {}, auth(carolToken));
	check("carol declines alice's request", decline.status === 200);
	const aliceOutgoing2 = await axios.get(`${BASE}/users/friend-requests`, auth(aliceToken));
	check("declined request no longer pending for alice", aliceOutgoing2.data.outgoing.length === 0);

	// ---------- Sockets: auth ----------
	console.log("\n== Socket auth ==");
	const badSock = io(BASE, { auth: { token: "garbage" }, transports: ["websocket"], reconnection: false });
	const authErr = await waitFor(badSock, "connect_error").catch(() => null);
	check("socket with bad token is rejected", !!authErr);
	badSock.close();

	const alice = io(BASE, { auth: { token: aliceToken }, transports: ["websocket"], reconnection: false });
	const bob = io(BASE, { auth: { token: bobToken }, transports: ["websocket"], reconnection: false });
	await Promise.all([waitFor(alice, "connect"), waitFor(bob, "connect")]);
	check("both sockets connect with valid tokens", alice.connected && bob.connected);

	// ---------- Friend requests: live notification + presence ----------
	console.log("\n== Friend request notifications ==");
	const notified = waitFor(bob, "friend_request_received");
	const daveReg = await axios.post(`${BASE}/users/register`, { username: "dave", email: "dave@test.com", password: "secret123" });
	// bob already has an accepted friendship with alice; use dave to test a fresh live-notify request to bob
	const daveToBob = await axios.post(`${BASE}/users/friend-requests`, { recipient_id: bobId }, auth(daveReg.data.token));
	check("dave's request to bob succeeds", daveToBob.status === 201);
	const notifyPayload = await notified;
	check("bob gets a live friend_request_received notification", notifyPayload.from.username === "dave", notifyPayload);

	const aliceFriendsLive = await axios.get(`${BASE}/users/friends`, auth(aliceToken));
	check("presence flips to online once connected", aliceFriendsLive.data[0].online === true, aliceFriendsLive.data);

	// bob + carol accepted friendship, but carol never opens a socket (stays offline)
	const bobToCarol = await axios.post(`${BASE}/users/friend-requests`, { recipient_id: carolId }, auth(bobToken));
	check("bob requests carol", bobToCarol.status === 201);
	const carolIncoming2 = await axios.get(`${BASE}/users/friend-requests`, auth(carolToken));
	await axios.post(`${BASE}/users/friend-requests/${carolIncoming2.data.incoming[0].requestId}/accept`, {}, auth(carolToken));

	// ---------- Matchmaking ----------
	console.log("\n== Matchmaking ==");
	const aliceStart = waitFor(alice, "game_start");
	const bobStart = waitFor(bob, "game_start");
	alice.emit("find_match", { time: 5 });
	bob.emit("find_match", { time: 5 });
	const [aGame, bGame] = await Promise.all([aliceStart, bobStart]);
	check("both matched into the same room", aGame.room === bGame.room, { a: aGame.room, b: bGame.room });
	check("opposite colors assigned", aGame.color !== bGame.color && ["white", "black"].includes(aGame.color));
	check("opponent info correct", aGame.opponent.username === "bob" && bGame.opponent.username === "alice");

	const room1 = aGame.room;
	const whiteSock = aGame.color === "white" ? alice : bob;
	const blackSock = aGame.color === "white" ? bob : alice;

	// ---------- Move relay ----------
	const relayed = waitFor(blackSock, "receive_move");
	whiteSock.emit("send_move", { room: room1, move: { from: "e2", to: "e4", san: "e4" } });
	const mv = await relayed;
	check("move relayed to opponent", mv.san === "e4");
	const relayed2 = waitFor(whiteSock, "receive_move");
	blackSock.emit("send_move", { room: room1, move: { from: "e7", to: "e5", san: "e5" } });
	await relayed2;

	// ---------- Game over + Elo ----------
	console.log("\n== Game over + Elo ==");
	const aRatings = waitFor(alice, "ratings_updated");
	const bRatings = waitFor(bob, "ratings_updated");
	whiteSock.emit("game_over", { room: room1, result: 1, pgn: "1. e4 e5" });
	const [ra] = await Promise.all([aRatings, bRatings]);
	check("ratings_updated emitted to both", !!ra.white && !!ra.black);
	check("Elo symmetric (+16/-16 at equal ratings)", ra.white.delta === 16 && ra.black.delta === -16, ra);

	// Duplicate game_over must not double-persist
	blackSock.emit("game_over", { room: room1, result: 1, pgn: "1. e4 e5" });
	await sleep(500);

	const whiteToken = aGame.color === "white" ? aliceToken : bobToken;
	const hist = await axios.get(`${BASE}/games/history`, auth(whiteToken));
	check("exactly one game persisted (idempotent)", hist.data.length === 1, hist.data);
	check("winner sees outcome=win, color=white", hist.data[0].outcome === "win" && hist.data[0].color === "white", hist.data[0]);

	const lb2 = await axios.get(`${BASE}/users/leaderboard`);
	const byName = (data, name) => data.find((u) => u.username === name);
	const ratings = [byName(lb2.data, "alice").rating, byName(lb2.data, "bob").rating].sort((x, y) => y - x);
	check("leaderboard shows 416 / 384 after one game", ratings[0] === 416 && ratings[1] === 384, ratings);
	check(
		"number_of_matches incremented",
		byName(lb2.data, "alice").number_of_matches === 1 && byName(lb2.data, "bob").number_of_matches === 1
	);

	// ---------- Friend room ----------
	console.log("\n== Friend rooms ==");
	alice.emit("create_room", { time: 10 });
	const created = await waitFor(alice, "room_created");
	check("room code issued", typeof created.room === "string" && created.room.length === 6, created);

	const badJoin = io(BASE, { auth: { token: aliceToken }, transports: ["websocket"], reconnection: false });
	await waitFor(badJoin, "connect");
	badJoin.emit("join_room", { room: "NOPE99" });
	const joinErr = await waitFor(badJoin, "room_error");
	check("joining a nonexistent room errors", /not found/i.test(joinErr.message));
	badJoin.emit("join_room", { room: created.room });
	const selfJoin = await waitFor(badJoin, "room_error");
	check("cannot join your own room", /own room/i.test(selfJoin.message));
	badJoin.close();

	const aStart2 = waitFor(alice, "game_start");
	const bStart2 = waitFor(bob, "game_start");
	bob.emit("join_room", { room: created.room.toLowerCase() }); // case-insensitive
	const [ag2, bg2] = await Promise.all([aStart2, bStart2]);
	check("friend room starts game (case-insensitive code)", ag2.room === created.room && bg2.room === created.room);
	check("friend game uses host's time control", ag2.time === 10);

	// ---------- Resign ----------
	console.log("\n== Resign ==");
	const room2 = ag2.room;
	const white2 = ag2.color === "white" ? alice : bob;
	const aEnd = waitFor(alice, "game_ended");
	const bEnd = waitFor(bob, "game_ended");
	white2.emit("resign", { room: room2, pgn: "" });
	const [endA] = await Promise.all([aEnd, bEnd]);
	check("resign ends game for both, white loses", endA.reason === "resign" && endA.result === 0, endA);
	await sleep(500);

	// Fresh-ratings check: game 2 was 416 vs 384 — deltas must differ from ±16
	const lb3 = await axios.get(`${BASE}/users/leaderboard`);
	const total = byName(lb3.data, "alice").rating + byName(lb3.data, "bob").rating;
	check("ratings conserved after second game", total === 800, lb3.data.map((u) => [u.username, u.rating]));

	// ---------- Challenge a friend ----------
	console.log("\n== Challenge a friend ==");
	const notAFriendErr = waitFor(alice, "room_error");
	alice.emit("challenge_friend", { friendUserId: carolId, time: 5 });
	check("challenging a non-friend is rejected", /only challenge friends/i.test((await notAFriendErr).message));

	const offlineFriendErr = waitFor(bob, "room_error");
	bob.emit("challenge_friend", { friendUserId: carolId, time: 5 });
	check("challenging an offline friend is rejected", /offline/i.test((await offlineFriendErr).message));

	const challengeReceived = waitFor(bob, "challenge_received");
	alice.emit("challenge_friend", { friendUserId: bobId, time: 10 });
	const challenge = await challengeReceived;
	check("challenged friend receives the invite", challenge.from.username === "alice" && challenge.time === 10, challenge);

	const aChallengeStart = waitFor(alice, "game_start");
	const bChallengeStart = waitFor(bob, "game_start");
	bob.emit("join_room", { room: challenge.room });
	const [acs, bcs] = await Promise.all([aChallengeStart, bChallengeStart]);
	check("accepting a challenge starts the game for both", acs.room === bcs.room && acs.time === 10, { acs, bcs });

	const declineChallenge = waitFor(bob, "challenge_received");
	alice.emit("challenge_friend", { friendUserId: bobId, time: 5 });
	const challenge2 = await declineChallenge;
	const challengerNotified = waitFor(alice, "challenge_declined");
	bob.emit("challenge_declined", { room: challenge2.room });
	await challengerNotified;
	check("declining a challenge notifies the challenger", true);

	// ---------- Rematch ----------
	console.log("\n== Rematch ==");
	// Finish the game the accepted challenge started, then offer a rematch on it.
	const challengeWhite = acs.color === "white" ? alice : bob;
	const cgRatings = Promise.all([waitFor(alice, "ratings_updated"), waitFor(bob, "ratings_updated")]);
	challengeWhite.emit("game_over", { room: acs.room, result: 1, pgn: "1. e4" });
	await cgRatings;

	const waitingAck = waitFor(alice, "rematch_waiting");
	alice.emit("request_rematch", { room: acs.room });
	await waitingAck;
	check("first rematch request puts requester in a waiting state", true);

	const offeredAck = waitFor(bob, "rematch_offered");
	await offeredAck;
	check("the other player is notified a rematch was offered", true);

	const aRematchStart = waitFor(alice, "game_start");
	const bRematchStart = waitFor(bob, "game_start");
	bob.emit("request_rematch", { room: acs.room });
	const [aRematch, bRematch] = await Promise.all([aRematchStart, bRematchStart]);
	check(
		"both requesting starts a fresh game with a new room code",
		aRematch.room === bRematch.room && aRematch.room !== acs.room,
		{ old: acs.room, fresh: aRematch.room }
	);

	// ---------- Draw flow ----------
	console.log("\n== Draw flow ==");
	const aStart3 = waitFor(alice, "game_start");
	const bStart3 = waitFor(bob, "game_start");
	alice.emit("find_match", { time: 5 });
	bob.emit("find_match", { time: 5 });
	const [ag3] = await Promise.all([aStart3, bStart3]);
	const offered = waitFor(bob, "draw_offered");
	alice.emit("offer_draw", { room: ag3.room });
	await offered;
	check("draw offer relayed", true);
	const declined = waitFor(alice, "draw_declined");
	bob.emit("draw_response", { room: ag3.room, accepted: false, pgn: "" });
	await declined;
	check("draw decline relayed", true);
	const aEnd3 = waitFor(alice, "game_ended");
	alice.emit("offer_draw", { room: ag3.room });
	bob.emit("draw_response", { room: ag3.room, accepted: true, pgn: "" });
	const end3 = await aEnd3;
	check("accepted draw ends game with result 0.5", end3.result === 0.5 && end3.reason === "draw_agreed", end3);
	await sleep(500);

	// ---------- Disconnect mid-game ----------
	console.log("\n== Disconnect handling ==");
	const aStart4 = waitFor(alice, "game_start");
	const bStart4 = waitFor(bob, "game_start");
	alice.emit("find_match", { time: 5 });
	bob.emit("find_match", { time: 5 });
	const [ag4, bg4] = await Promise.all([aStart4, bStart4]);
	const w4 = ag4.color === "white" ? alice : bob;
	const b4 = ag4.color === "white" ? bob : alice;
	// two half-moves so it's not an abort
	w4.emit("send_move", { room: ag4.room, move: { from: "e2", to: "e4", san: "e4" } });
	b4.emit("send_move", { room: ag4.room, move: { from: "e7", to: "e5", san: "e5" } });
	await sleep(300);
	const survivorSock = ag4.color === "white" ? bob : alice; // black survives
	const endEvt = waitFor(survivorSock, "game_ended");
	w4.close(); // white leaves
	const end4 = await endEvt;
	check("opponent_left awards win to the survivor", end4.reason === "opponent_left" && end4.result === 0, end4);
	await sleep(500);

	const histAfter = await axios.get(`${BASE}/games/history`, auth(aliceToken));
	check("five games persisted total", histAfter.data.length === 5, histAfter.data.length);

	// ---------- Abort on instant disconnect ----------
	// Fresh sockets: the disconnect test above closed one of the originals.
	console.log("\n== Abort (disconnect before 2 moves) ==");
	const alice2 = io(BASE, { auth: { token: aliceToken }, transports: ["websocket"], reconnection: false });
	const bob2 = io(BASE, { auth: { token: bobToken }, transports: ["websocket"], reconnection: false });
	await Promise.all([waitFor(alice2, "connect"), waitFor(bob2, "connect")]);
	const a2s = waitFor(alice2, "game_start");
	const bs5 = waitFor(bob2, "game_start");
	alice2.emit("find_match", { time: 5 });
	bob2.emit("find_match", { time: 5 });
	await Promise.all([a2s, bs5]);
	const abortEvt = waitFor(bob2, "game_ended");
	alice2.close();
	const abort = await abortEvt;
	check("early disconnect aborts without rating change", abort.reason === "abort" && abort.result === null, abort);
	await sleep(500);
	const histFinal = await axios.get(`${BASE}/games/history`, auth(bobToken));
	check("aborted game not persisted", histFinal.data.length === 5, histFinal.data.length);

	// ---------- Puzzles ----------
	console.log("\n== Puzzles ==");
	const noAuthPuzzle = await axios.get(`${BASE}/puzzles/next`, { validateStatus: () => true });
	check("puzzles require auth -> 401", noAuthPuzzle.status === 401);

	const initialStats = await axios.get(`${BASE}/puzzles/stats`, auth(carolToken));
	check("fresh user starts at puzzle_rating 1200", initialStats.data.puzzle_rating === 1200, initialStats.data);

	const puzzle1 = await axios.get(`${BASE}/puzzles/next`, auth(carolToken));
	check(
		"GET /puzzles/next returns a puzzle near the user's rating",
		puzzle1.status === 200 && puzzle1.data.fen && Array.isArray(puzzle1.data.moves) && Math.abs(puzzle1.data.rating - 1200) <= 700,
		puzzle1.data
	);

	const badAttempt = await axios.post(
		`${BASE}/puzzles/${puzzle1.data._id}/attempt`,
		{ solved: "yes" },
		{ ...auth(carolToken), validateStatus: () => true }
	);
	check("non-boolean solved -> 400", badAttempt.status === 400);

	const missingAttempt = await axios.post(
		`${BASE}/puzzles/000000000000000000000000/attempt`,
		{ solved: true },
		{ ...auth(carolToken), validateStatus: () => true }
	);
	check("attempting an unknown puzzle -> 404", missingAttempt.status === 404);

	const solveAttempt = await axios.post(`${BASE}/puzzles/${puzzle1.data._id}/attempt`, { solved: true }, auth(carolToken));
	check(
		"solving updates rating and streak",
		solveAttempt.data.puzzle_streak === 1 && typeof solveAttempt.data.delta === "number",
		solveAttempt.data
	);

	const puzzle2 = await axios.get(`${BASE}/puzzles/next`, auth(carolToken));
	const failAttempt = await axios.post(`${BASE}/puzzles/${puzzle2.data._id}/attempt`, { solved: false }, auth(carolToken));
	check("failing resets the streak to 0", failAttempt.data.puzzle_streak === 0, failAttempt.data);

	const finalStats = await axios.get(`${BASE}/puzzles/stats`, auth(carolToken));
	check(
		"stats reflect the best streak reached and match the last attempt's rating",
		finalStats.data.best_streak >= 1 && finalStats.data.puzzle_rating === failAttempt.data.puzzle_rating,
		finalStats.data
	);

	alice.close();
	bob.close();
	bob2.close();

	console.log(`\n========== ${passed} passed, ${failed} failed ==========`);
	await cleanup(server, mongod);
	process.exit(failed ? 1 : 0);
}

async function cleanup(server, mongod) {
	server.kill();
	await mongod.stop();
}

main().catch(async (err) => {
	console.error("E2E crashed:", err.message);
	console.log(`\n========== ${passed} passed, ${failed} failed (crashed) ==========`);
	process.exit(1);
});
