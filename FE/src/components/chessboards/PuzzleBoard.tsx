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

export type PuzzleMistake = {
	/** 1-based ply number within the solution, counting only the solver's own moves. */
	moveNumber: number;
	expectedSan: string;
	playedSan: string | null; // null when the attempted move wasn't even legal
};

export type PuzzleOutcome = {
	solved: boolean;
	/** Full correct line in SAN, including the auto-played opponent moves. */
	solutionSan: string[];
	/** The same line as a loadable PGN (carries a [FEN] header for puzzles that don't start from move 1). */
	solutionPgn: string;
	mistake?: PuzzleMistake;
};

type Props = {
	puzzle: PuzzleData;
	boardWidth: number;
	onResult: (outcome: PuzzleOutcome) => void;
};

const uci = (move: { from: string; to: string; promotion?: string }) =>
	`${move.from}${move.to}${move.promotion || ""}`;

const uciToMoveInput = (u: string) => ({
	from: u.slice(0, 2),
	to: u.slice(2, 4),
	promotion: u.slice(4, 5) || "q",
});

/** Replays a full move list from a starting FEN and returns their SAN, plus a loadable PGN. */
const replayLine = (fen: string, moves: string[]): { sans: string[]; pgn: string } => {
	const chess = new Chess(fen);
	const sans: string[] = [];
	for (const m of moves) {
		const move = chess.move(uciToMoveInput(m));
		if (!move) break;
		sans.push(move.san);
	}
	return { sans, pgn: chess.pgn() };
};

const sanLine = (fen: string, moves: string[]): string[] => replayLine(fen, moves).sans;

/**
 * Solution-driven board: no server relay, no engine opponent. The puzzle's
 * `moves` array alternates [opponent-setup, solver, opponent, solver, ...] —
 * the opponent's plies are auto-played, the solver's must be typed in and
 * are checked against the exact expected UCI move.
 */
const PuzzleBoard = ({ puzzle, boardWidth, onResult }: Props) => {
	const chessRef = useRef<Chess | null>(null);
	const moveIndexRef = useRef(0);
	const solverMoveCountRef = useRef(0);
	const concludedRef = useRef(false);
	const solutionSanRef = useRef<string[]>([]);
	const solutionPgnRef = useRef("");
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
		solverMoveCountRef.current = 0;
		concludedRef.current = false;
		const replay = replayLine(puzzle.fen, puzzle.moves);
		solutionSanRef.current = replay.sans;
		solutionPgnRef.current = replay.pgn;
		setPosition(chess.fen());
		setOptionSquares({});
		setStatus("setup");

		// moves[0] is the opponent's setup move; the solver plays the opposite color.
		setOrientation(chess.turn() === "w" ? "black" : "white");

		const timer = setTimeout(() => {
			const setupMove = puzzle.moves[0];
			if (setupMove) {
				chess.move(uciToMoveInput(setupMove));
				moveIndexRef.current = 1;
				setPosition(chess.fen());
				playMoveSound();
			}
			setStatus("playing");
		}, 600);
		return () => clearTimeout(timer);
	}, [puzzle]);

	const conclude = (solved: boolean, mistake?: PuzzleMistake) => {
		if (concludedRef.current) return;
		concludedRef.current = true;
		setStatus("done");
		playGameEndSound(solved ? "win" : "loss");
		onResult({ solved, solutionSan: solutionSanRef.current, solutionPgn: solutionPgnRef.current, mistake });
	};

	const playAutoReply = () => {
		const chess = chessRef.current!;
		const next = puzzle.moves[moveIndexRef.current];
		if (!next) return conclude(true);
		setTimeout(() => {
			const move = chess.move(uciToMoveInput(next));
			moveIndexRef.current += 1;
			setPosition(chess.fen());
			if (move?.captured) playCaptureSound();
			else playMoveSound();
			if (moveIndexRef.current >= puzzle.moves.length) conclude(true);
		}, 500);
	};

	const attemptMove = (from: string, to: string, promotion?: string): boolean => {
		if (status !== "playing" || from === to) return false;
		const chess = chessRef.current!;
		const expected = puzzle.moves[moveIndexRef.current];
		const attempted = uci({ from, to, promotion });
		solverMoveCountRef.current += 1;

		// Accept either the exact promotion or a bare match (queen is implied when unspecified).
		if (expected !== attempted && expected !== `${from}${to}`) {
			shakeBoard();
			const expectedSan = sanLine(chess.fen(), [expected])[0] || expected;
			let playedSan: string | null = null;
			try {
				playedSan = new Chess(chess.fen()).move({ from, to, promotion: promotion || "q" }).san;
			} catch {
				playedSan = null;
			}
			conclude(false, { moveNumber: solverMoveCountRef.current, expectedSan, playedSan });
			return false;
		}
		let move;
		try {
			move = chess.move({ from, to, promotion: promotion || "q" });
		} catch {
			shakeBoard();
			const expectedSan = sanLine(chess.fen(), [expected])[0] || expected;
			conclude(false, { moveNumber: solverMoveCountRef.current, expectedSan, playedSan: null });
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

	const selectSquare = (chess: Chess, square: Square) => {
		sourceSquareRef.current = square;
		const moves = chess.moves({ square, verbose: true });
		if (moves.length === 0) {
			setOptionSquares({});
			return;
		}
		let newSquares = {};
		moves.forEach((move) => {
			newSquares = {
				...newSquares,
				[move.to]: { background: chess.get(move.to) ? tokens.board.hintCapture : tokens.board.hintMove },
			};
		});
		setOptionSquares(newSquares);
	};

	const handleClick = (square: Square) => {
		const chess = chessRef.current!;
		if (status !== "playing") return false;

		const selected = sourceSquareRef.current;
		if (selected) {
			if (selected === square) {
				// Clicking the already-selected piece again just deselects it.
				sourceSquareRef.current = "";
				setOptionSquares({});
				return false;
			}
			const legalTargets = chess.moves({ square: selected as Square, verbose: true }).map((m) => m.to);
			if (legalTargets.includes(square)) {
				sourceSquareRef.current = "";
				setOptionSquares({});
				return attemptMove(selected, square);
			}
			// Not a legal destination for the selected piece — this isn't a
			// move attempt at all, just a re-selection. Fall through below.
			sourceSquareRef.current = "";
		}

		selectSquare(chess, square);
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
