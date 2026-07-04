export type EngineLimits = {
	skillLevel: number; // Stockfish "Skill Level" UCI option, 0-20
	depth: number;
	movetimeMs: number;
};

export const MIN_BOT_RATING = 400;
export const MAX_BOT_RATING = 2800;

export const clampRating = (rating: number) =>
	Math.min(MAX_BOT_RATING, Math.max(MIN_BOT_RATING, Math.round(rating)));

/**
 * Full-strength browser Stockfish plays far above any casual rating even at
 * depth 2, so strength is throttled on three axes at once: Skill Level
 * (adds eval noise / intentional mistakes), search depth, and movetime.
 */
export const limitsForRating = (rating: number): EngineLimits => {
	const r = clampRating(rating);
	const skillLevel = Math.round(((r - MIN_BOT_RATING) / (MAX_BOT_RATING - MIN_BOT_RATING)) * 20);
	const depth = r < 800 ? 1 : r < 1200 ? 2 : r < 1600 ? 4 : r < 2000 ? 6 : r < 2400 ? 9 : 13;
	const movetimeMs = r < 1200 ? 300 : r < 2000 ? 600 : 1000;
	return { skillLevel, depth, movetimeMs };
};
