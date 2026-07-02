/** Standard Elo expected-score formula and rating delta, shared by game and puzzle ratings. */
const eloDelta = (rating, opponentRating, score, kFactor = 32) => {
	const expected = 1 / (1 + 10 ** ((opponentRating - rating) / 400));
	return Math.round(kFactor * (score - expected));
};

module.exports = { eloDelta };
