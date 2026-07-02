const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Friends = require("../models/friends.model");
const auth = require("../middleware/auth");

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
 * GET /users/friends — friends of the logged-in user
 */
router.get("/friends", auth, async (req, res) => {
	try {
		const links = await Friends.find({
			$or: [{ player_id: req.userId }, { friend_id: req.userId }],
		});
		const friendIds = links.map((link) =>
			link.player_id.equals(req.userId) ? link.friend_id : link.player_id
		);
		const friends = await User.find({ _id: { $in: friendIds } }).select(
			"username rating number_of_matches"
		);
		res.json(friends);
	} catch (err) {
		res.status(500).json({ message: "Could not load friends" });
	}
});

/**
 * POST /users/add-friend
 * Body: { friend_id }
 */
router.post("/add-friend", auth, async (req, res) => {
	try {
		const { friend_id } = req.body;
		if (!friend_id) return res.status(400).json({ message: "friend_id is required" });
		if (friend_id === req.userId) {
			return res.status(400).json({ message: "You cannot add yourself as a friend" });
		}
		const exists = await Friends.findOne({
			$or: [
				{ player_id: req.userId, friend_id },
				{ player_id: friend_id, friend_id: req.userId },
			],
		});
		if (exists) return res.status(409).json({ message: "Already friends" });
		await new Friends({ player_id: req.userId, friend_id }).save();
		res.status(201).json({ message: "Friend added" });
	} catch (err) {
		res.status(500).json({ message: "Could not add friend" });
	}
});

module.exports = router;
