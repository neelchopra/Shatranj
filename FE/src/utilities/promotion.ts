import { Chess } from "chess.js";

export type PromotionPiece = "q" | "r" | "b" | "n";

/** True when moving the piece on `from` to `to` would be a pawn promotion. */
export const isPromotionMove = (chess: Chess, from: string, to: string): boolean => {
	const piece = chess.get(from as any);
	if (!piece || piece.type !== "p") return false;
	return (piece.color === "w" && to[1] === "8") || (piece.color === "b" && to[1] === "1");
};
