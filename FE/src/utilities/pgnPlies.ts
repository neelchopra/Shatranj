import { Chess } from "chess.js";

export type Ply = { san: string; before: string; after: string };

/** Loads a PGN (optionally with a [FEN] header for a non-standard start) into a step-through list. */
export const pgnToPlies = (pgn: string): Ply[] => {
	if (!pgn) return [];
	try {
		const chess = new Chess();
		chess.loadPgn(pgn);
		return chess.history({ verbose: true }).map((m) => ({ san: m.san, before: m.before, after: m.after }));
	} catch {
		return [];
	}
};
