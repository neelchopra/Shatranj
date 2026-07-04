import { clampRating, limitsForRating, MIN_BOT_RATING, MAX_BOT_RATING } from "./botStrength";

describe("clampRating", () => {
	it("clamps below the floor", () => expect(clampRating(100)).toBe(MIN_BOT_RATING));
	it("clamps above the ceiling", () => expect(clampRating(9000)).toBe(MAX_BOT_RATING));
	it("rounds and passes through in-range values", () => expect(clampRating(1500.4)).toBe(1500));
});

describe("limitsForRating", () => {
	it("uses minimum strength at the floor", () => {
		expect(limitsForRating(400)).toEqual({ skillLevel: 0, depth: 1, movetimeMs: 300 });
	});
	it("uses maximum strength at the ceiling", () => {
		expect(limitsForRating(2800)).toEqual({ skillLevel: 20, depth: 13, movetimeMs: 1000 });
	});
	it("is monotonically non-decreasing in every limit", () => {
		let prev = limitsForRating(MIN_BOT_RATING);
		for (let r = MIN_BOT_RATING + 50; r <= MAX_BOT_RATING; r += 50) {
			const cur = limitsForRating(r);
			expect(cur.skillLevel).toBeGreaterThanOrEqual(prev.skillLevel);
			expect(cur.depth).toBeGreaterThanOrEqual(prev.depth);
			expect(cur.movetimeMs).toBeGreaterThanOrEqual(prev.movetimeMs);
			prev = cur;
		}
	});
	it("keeps Easy preset genuinely weak", () => {
		const easy = limitsForRating(800);
		expect(easy.skillLevel).toBeLessThanOrEqual(4);
		expect(easy.depth).toBeLessThanOrEqual(2);
	});
});
