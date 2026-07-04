const router = require("express").Router();
const Puzzle = require("../models/puzzle.model");
const User = require("../models/user.model");
const auth = require("../middleware/auth");
const optionalAuth = require("../middleware/optionalAuth");
const { eloDelta } = require("../utils/elo");

const PUZZLE_K_FACTOR = 20;
const RATING_WINDOWS = [150, 300, 600, Infinity];
const GUEST_DEFAULT_RATING = 1200;

/**
 * GET /puzzles/next — one puzzle near the user's current puzzle rating.
 * Works for guests too (targets a default rating); only logged-in users
 * get puzzles centered on their real puzzle_rating.
 * Widens the rating window if the narrow bands don't have enough puzzles.
 */
router.get("/next", optionalAuth, async (req, res) => {
	try {
		let target = GUEST_DEFAULT_RATING;
		if (req.userId) {
			const user = await User.findById(req.userId).select("puzzle_rating");
			if (user) target = user.puzzle_rating;
		}

		for (const window of RATING_WINDOWS) {
			const match =
				window === Infinity
					? {}
					: { rating: { $gte: target - window, $lte: target + window } };
			const [puzzle] = await Puzzle.aggregate([{ $match: match }, { $sample: { size: 1 } }]);
			if (puzzle) return res.json(puzzle);
		}
		res.status(404).json({ message: "No puzzles available" });
	} catch (err) {
		res.status(500).json({ message: "Could not load a puzzle" });
	}
});

/**
 * POST /puzzles/:id/attempt
 * Body: { solved: boolean }
 */
router.post("/:id/attempt", auth, async (req, res) => {
	try {
		const { solved } = req.body;
		if (typeof solved !== "boolean") {
			return res.status(400).json({ message: "solved (boolean) is required" });
		}
		const [user, puzzle] = await Promise.all([
			User.findById(req.userId).select("puzzle_rating puzzle_streak best_streak"),
			Puzzle.findById(req.params.id).select("rating"),
		]);
		if (!puzzle) return res.status(404).json({ message: "Puzzle not found" });

		const delta = eloDelta(user.puzzle_rating, puzzle.rating, solved ? 1 : 0, PUZZLE_K_FACTOR);
		user.puzzle_rating += delta;
		user.puzzle_streak = solved ? user.puzzle_streak + 1 : 0;
		user.best_streak = Math.max(user.best_streak, user.puzzle_streak);
		await user.save();

		res.json({
			puzzle_rating: user.puzzle_rating,
			puzzle_streak: user.puzzle_streak,
			best_streak: user.best_streak,
			delta,
		});
	} catch (err) {
		res.status(500).json({ message: "Could not record attempt" });
	}
});

/**
 * GET /puzzles/stats
 */
router.get("/stats", auth, async (req, res) => {
	try {
		const user = await User.findById(req.userId).select("puzzle_rating puzzle_streak best_streak");
		res.json({
			puzzle_rating: user.puzzle_rating,
			puzzle_streak: user.puzzle_streak,
			best_streak: user.best_streak,
		});
	} catch (err) {
		res.status(500).json({ message: "Could not load puzzle stats" });
	}
});

module.exports = router;
