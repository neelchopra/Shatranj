const router = require("express").Router();
const GameHistory = require("../models/game-history.model");
const User = require("../models/user.model");
const auth = require("../middleware/auth");

/**
 * GET /games/history — games of the logged-in user, newest first.
 * result convention: player_id is white; 1 = white won, 0 = black won, 0.5 = draw.
 */
router.get("/history", auth, async (req, res) => {
	try {
		const games = await GameHistory.find({
			$or: [{ player_id: req.userId }, { opponent_id: req.userId }],
		})
			.sort({ createdAt: -1 })
			.limit(50);

		const ids = new Set();
		games.forEach((g) => {
			ids.add(g.player_id.toString());
			ids.add(g.opponent_id.toString());
		});
		const users = await User.find({ _id: { $in: [...ids] } }).select("username rating");
		const byId = Object.fromEntries(users.map((u) => [u._id.toString(), u]));

		res.json(
			games.map((g) => {
				const iAmWhite = g.player_id.equals(req.userId);
				const opponent = byId[(iAmWhite ? g.opponent_id : g.player_id).toString()];
				const outcome =
					g.result === 0.5 ? "draw" : (g.result === 1) === iAmWhite ? "win" : "loss";
				return {
					_id: g._id,
					color: iAmWhite ? "white" : "black",
					opponent: opponent
						? { username: opponent.username, rating: opponent.rating }
						: { username: "Deleted user", rating: null },
					outcome,
					variant: g.variant,
					pgn: g.pgn,
					playedAt: g.createdAt,
				};
			})
		);
	} catch (err) {
		console.error("History failed:", err);
		res.status(500).json({ message: "Could not load game history" });
	}
});

module.exports = router;
