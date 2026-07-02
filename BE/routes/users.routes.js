const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Friends = require("../models/friends.model");
const auth = require("../middleware/auth");
const { notifyUser, isUserOnline } = require("../socket-handlers");

const signToken = (userId) =>
	jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

const publicUser = (user) => {
	const { password, __v, ...rest } = user.toObject();
	return rest;
};

/**
 * POST /users/register
 * Body: { username, email, password }
 * Returns: { token, user }
 */
router.post("/register", async (req, res) => {
	try {
		const { username, email, password } = req.body;
		if (!username || !email || !password) {
			return res.status(400).json({ message: "Username, email and password are required" });
		}
		if (password.length < 6) {
			return res.status(400).json({ message: "Password must be at least 6 characters" });
		}
		const hashed = await bcrypt.hash(password, 10);
		const user = await new User({ username, email, password: hashed }).save();
		res.status(201).json({ token: signToken(user._id), user: publicUser(user) });
	} catch (err) {
		if (err.code === 11000) {
			const field = Object.keys(err.keyPattern || {})[0] || "account";
			return res.status(409).json({ message: `That ${field} is already taken` });
		}
		console.error("Register failed:", err);
		res.status(500).json({ message: "Registration failed, please try again" });
	}
});

/**
 * POST /users/login
 * Body: { username, password }
 * Returns: { token, user }
 */
router.post("/login", async (req, res) => {
	try {
		const { username, password } = req.body;
		if (!username || !password) {
			return res.status(400).json({ message: "Username and password are required" });
		}
		const user = await User.findOne({ username });
		if (!user || !(await bcrypt.compare(password, user.password))) {
			return res.status(401).json({ message: "Invalid username or password" });
		}
		res.status(200).json({ token: signToken(user._id), user: publicUser(user) });
	} catch (err) {
		console.error("Login failed:", err);
		res.status(500).json({ message: "Login failed, please try again" });
	}
});

/**
 * GET /users/me — current user profile
 */
router.get("/me", auth, async (req, res) => {
	try {
		const user = await User.findById(req.userId).select("-password -__v");
		if (!user) return res.status(404).json({ message: "User not found" });
		res.json(user);
	} catch (err) {
		res.status(500).json({ message: "Could not load profile" });
	}
});

/**
 * GET /users/leaderboard — top players by rating (public)
 */
router.get("/leaderboard", async (req, res) => {
	try {
		const users = await User.find()
			.sort({ rating: -1 })
			.limit(20)
			.select("username rating number_of_matches");
		res.json(users);
	} catch (err) {
		res.status(500).json({ message: "Could not load leaderboard" });
	}
});

/**
 * GET /users/search-users?q=<name>
 */
router.get("/search-users", auth, async (req, res) => {
	try {
		const q = (req.query.q || "").trim();
		if (!q) return res.json([]);
		const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		const users = await User.find({ username: { $regex: escaped, $options: "i" } })
			.limit(20)
			.select("username rating number_of_matches");
		res.json(users);
	} catch (err) {
		res.status(500).json({ message: "Search failed" });
	}
});

/**
 * GET /users/friends — accepted friends of the logged-in user, with live presence
 */
router.get("/friends", auth, async (req, res) => {
	try {
		const io = req.app.get("io");
		const links = await Friends.find({
			status: "accepted",
			$or: [{ player_id: req.userId }, { friend_id: req.userId }],
		});
		const friendIds = links.map((link) =>
			link.player_id.equals(req.userId) ? link.friend_id : link.player_id
		);
		const friends = await User.find({ _id: { $in: friendIds } }).select(
			"username rating number_of_matches"
		);
		res.json(
			friends.map((friend) => ({
				...friend.toObject(),
				online: isUserOnline(io, friend._id.toString()),
			}))
		);
	} catch (err) {
		res.status(500).json({ message: "Could not load friends" });
	}
});

/**
 * GET /users/friend-requests — pending requests involving the logged-in user
 */
router.get("/friend-requests", auth, async (req, res) => {
	try {
		const [incomingLinks, outgoingLinks] = await Promise.all([
			Friends.find({ status: "pending", friend_id: req.userId }),
			Friends.find({ status: "pending", player_id: req.userId }),
		]);
		const otherIds = [
			...incomingLinks.map((l) => l.player_id),
			...outgoingLinks.map((l) => l.friend_id),
		];
		const users = await User.find({ _id: { $in: otherIds } }).select("username rating");
		const byId = Object.fromEntries(users.map((u) => [u._id.toString(), u]));

		res.json({
			incoming: incomingLinks.map((l) => ({
				requestId: l._id,
				user: byId[l.player_id.toString()],
			})),
			outgoing: outgoingLinks.map((l) => ({
				requestId: l._id,
				user: byId[l.friend_id.toString()],
			})),
		});
	} catch (err) {
		res.status(500).json({ message: "Could not load friend requests" });
	}
});

/**
 * POST /users/friend-requests
 * Body: { recipient_id }
 */
router.post("/friend-requests", auth, async (req, res) => {
	try {
		const { recipient_id } = req.body;
		if (!recipient_id) return res.status(400).json({ message: "recipient_id is required" });
		if (recipient_id === req.userId) {
			return res.status(400).json({ message: "You cannot add yourself as a friend" });
		}
		const exists = await Friends.findOne({
			$or: [
				{ player_id: req.userId, friend_id: recipient_id },
				{ player_id: recipient_id, friend_id: req.userId },
			],
		});
		if (exists) {
			return res.status(409).json({
				message: exists.status === "accepted" ? "Already friends" : "Request already pending",
			});
		}
		await new Friends({ player_id: req.userId, friend_id: recipient_id }).save();

		const io = req.app.get("io");
		const requester = await User.findById(req.userId).select("username");
		notifyUser(io, recipient_id, "friend_request_received", {
			from: { id: req.userId, username: requester.username },
		});
		res.status(201).json({ message: "Friend request sent" });
	} catch (err) {
		res.status(500).json({ message: "Could not send friend request" });
	}
});

/**
 * POST /users/friend-requests/:id/accept
 */
router.post("/friend-requests/:id/accept", auth, async (req, res) => {
	try {
		const request = await Friends.findOne({
			_id: req.params.id,
			friend_id: req.userId,
			status: "pending",
		});
		if (!request) return res.status(404).json({ message: "Request not found" });
		request.status = "accepted";
		await request.save();

		const io = req.app.get("io");
		const accepter = await User.findById(req.userId).select("username");
		notifyUser(io, request.player_id.toString(), "friend_request_accepted", {
			by: { id: req.userId, username: accepter.username },
		});
		res.json({ message: "Friend request accepted" });
	} catch (err) {
		res.status(500).json({ message: "Could not accept friend request" });
	}
});

/**
 * POST /users/friend-requests/:id/decline — recipient declines
 */
router.post("/friend-requests/:id/decline", auth, async (req, res) => {
	try {
		const request = await Friends.findOneAndDelete({
			_id: req.params.id,
			friend_id: req.userId,
			status: "pending",
		});
		if (!request) return res.status(404).json({ message: "Request not found" });
		res.json({ message: "Friend request declined" });
	} catch (err) {
		res.status(500).json({ message: "Could not decline friend request" });
	}
});

/**
 * DELETE /users/friend-requests/:id — requester cancels their own outgoing request
 */
router.delete("/friend-requests/:id", auth, async (req, res) => {
	try {
		const request = await Friends.findOneAndDelete({
			_id: req.params.id,
			player_id: req.userId,
			status: "pending",
		});
		if (!request) return res.status(404).json({ message: "Request not found" });
		res.json({ message: "Friend request cancelled" });
	} catch (err) {
		res.status(500).json({ message: "Could not cancel friend request" });
	}
});

module.exports = router;
