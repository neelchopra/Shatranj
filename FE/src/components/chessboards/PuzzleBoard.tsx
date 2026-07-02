import React, { useEffect, useRef, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Square, Piece } from "react-chessboard/dist/chessboard/types";
import { motion, useAnimationControls } from "framer-motion";
import { Chess } from "chess.js";
import { tokens } from "../../theme";
import { playCaptureSound, playGameEndSound, playIllegalSound, playMoveSound } from "../../utilities/sounds";

export type PuzzleData = {
	_id: string;
	fen: string;
	moves: string[];
	rating: number;
};

type Props = {
	puzzle: PuzzleData;
	boardWidth: number;
	onResult: (solved: boolean) => void;
};

const uci = (move: { from: string; to: string; promotion?: string }) =>
	`${move.from}${move.to}${move.promotion || ""}`;

/**
 * Solution-driven board: no server relay, no engine opponent. The puzzle's
 * `moves` array alternates [opponent-setup, solver, opponent, solver, ...] —
 * the opponent's plies are auto-played, the solver's must be typed in and
 * are checked against the exact expected UCI move.
 */
const PuzzleBoard = ({ puzzle, boardWidth, onResult }: Props) => {
	const chessRef = useRef<Chess | null>(null);
	const moveIndexRef = useRef(0);
	const concludedRef = useRef(false);
	const shakeControls = useAnimationControls();

	const [position, setPosition] = useState(puzzle.fen);
	const [orientation, setOrientation] = useState<"white" | "black">("white");
	const [optionSquares, setOptionSquares] = useState({});
	const [status, setStatus] = useState<"setup" | "playing" | "done">("setup");
	const sourceSquareRef = useRef<string>("");

	const shakeBoard = () => {
		playIllegalSound();
		shakeControls.start({ x: [0, -8, 8, -8, 0], transition: { duration: 0.3 } });
	};

	// (Re)initialize whenever a new puzzle arrives.
	useEffect(() => {
		const chess = new Chess(puzzle.fen);
		chessRef.current = chess;
		moveIndexRef.current = 0;
		concludedRef.current = false;
		setPosition(chess.fen());
		setOptionSquares({});
		setStatus("setup");

		// moves[0] is the opponent's setup move; the solver plays the opposite color.
		setOrientation(chess.turn() === "w" ? "black" : "white");

		const timer = setTimeout(() => {
			const setupMove = puzzle.moves[0];
			if (setupMove) {
				chess.move({ from: setupMove.slice(0, 2), to: setupMove.slice(2, 4), promotion: setupMove.slice(4, 5) || "q" });
				moveIndexRef.current = 1;
				setPosition(chess.fen());
				playMoveSound();
			}
			setStatus("playing");
		}, 600);
		return () => clearTimeout(timer);
	}, [puzzle]);

	const conclude = (solved: boolean) => {
		if (concludedRef.current) return;
		concludedRef.current = true;
		setStatus("done");
		playGameEndSound(solved ? "win" : "loss");
		onResult(solved);
	};

	const playAutoReply = () => {
		const chess = chessRef.current!;
		const next = puzzle.moves[moveIndexRef.current];
		if (!next) return conclude(true);
		setTimeout(() => {
			const move = chess.move({ from: next.slice(0, 2), to: next.slice(2, 4), promotion: next.slice(4, 5) || "q" });
			moveIndexRef.current += 1;
			setPosition(chess.fen());
			if (move?.captured) playCaptureSound();
			else playMoveSound();
			if (moveIndexRef.current >= puzzle.moves.length) conclude(true);
		}, 500);
	};

	const attemptMove = (from: string, to: string, promotion?: string): boolean => {
		if (status !== "playing") return false;
		const chess = chessRef.current!;
		const expected = puzzle.moves[moveIndexRef.current];
		const attempted = uci({ from, to, promotion });
		// Accept either the exact promotion or a bare match (queen is implied when unspecified).
		if (expected !== attempted && expected !== `${from}${to}`) {
			shakeBoard();
			conclude(false);
			return false;
		}
		let move;
		try {
			move = chess.move({ from, to, promotion: promotion || "q" });
		} catch {
			shakeBoard();
			conclude(false);
			return false;
		}
		moveIndexRef.current += 1;
		setPosition(chess.fen());
		if (move.captured) playCaptureSound();
		else playMoveSound();

		if (moveIndexRef.current >= puzzle.moves.length) {
			conclude(true);
		} else {
			playAutoReply();
		}
		return true;
	};

	const handleDrop = (source: Square, target: Square, piece: Piece) => {
		setOptionSquares({});
		return attemptMove(source, target, piece[1]?.toLowerCase());
	};

	const handleClick = (square: Square) => {
		const chess = chessRef.current!;
		if (status !== "playing") return false;
		if (sourceSquareRef.current) {
			const ok = attemptMove(sourceSquareRef.current, square);
			sourceSquareRef.current = "";
			setOptionSquares({});
			if (ok) return true;
		}
		sourceSquareRef.current = square;
		const moves = chess.moves({ square, verbose: true });
		if (moves.length === 0) {
			setOptionSquares({});
			return false;
		}
		let newSquares = {};
		moves.forEach((move) => {
			newSquares = {
				...newSquares,
				[move.to]: { background: chess.get(move.to) ? tokens.board.hintCapture : tokens.board.hintMove },
			};
		});
		setOptionSquares(newSquares);
		return false;
	};

	return (
		<motion.div animate={shakeControls}>
			<Chessboard
				position={position}
				onPieceDrop={handleDrop}
				onSquareClick={handleClick}
				boardWidth={boardWidth}
				boardOrientation={orientation}
				customDarkSquareStyle={{ backgroundColor: tokens.board.dark }}
				customLightSquareStyle={{ backgroundColor: tokens.board.light }}
				customSquareStyles={{ ...optionSquares }}
				animationDuration={150}
				arePremovesAllowed={false}
			/>
		</motion.div>
	);
};

export default PuzzleBoard;
