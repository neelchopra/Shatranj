import { Chess } from "chess.js";

/**
 * Read the game-over state off a chess.js instance.
 * result: 'white' | 'black' | 'draw' | '' (still in progress)
 */
export const evaluateGame = (chess: Chess) => {
	if (!chess.isGameOver()) {
		return { isGameOver: false, result: "" };
	}
	if (chess.isCheckmate()) {
		return { isGameOver: true, result: chess.turn() === "b" ? "white" : "black" };
	}
	return { isGameOver: true, result: "draw" };
};

/** Map a board result string to the server's white-perspective score. */
export const resultToScore = (result: string): number | null => {
	if (result === "white") return 1;
	if (result === "black") return 0;
	if (result === "draw") return 0.5;
	return null;
};

/** Map a server white-perspective score back to a board result string. */
export const scoreToResult = (score: number | null): string => {
	if (score === 1) return "white";
	if (score === 0) return "black";
	if (score === 0.5) return "draw";
	return "abort";
};
