import React, { useEffect, useRef, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Square, Piece } from "react-chessboard/dist/chessboard/types";
import { motion, useAnimationControls } from "framer-motion";
import { useTheme } from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../app-state/hooks";
import { setGameState } from "../../app-state/features/gameSlice";
import { Chess } from "chess.js";
import { socket } from "../../socket";
import { evaluateGame } from "../../utilities/chessResult";
import { playIllegalSound, soundForMove } from "../../utilities/sounds";
import { isPromotionMove, PromotionPiece } from "../../utilities/promotion";
import PromotionPicker from "./PromotionPicker";

type Props = {
	color: string; // 'white' | 'black' — this client's side, assigned by the server
	room: string;
	boardWidth: number;
	/** When set, shows this position read-only instead of the live game (viewing a past move from the move list). */
	reviewPosition?: string;
};

type Premove = { from: string; to: string; promotion?: string };

const StandardOnlineBoard = (props: Props) => {
	const { tokens } = useTheme();
	const dispatch = useAppDispatch();
	const position = useAppSelector((state) => state.game.gameState.position);
	const [optionSquares, setOptionSquares] = useState({});
	const [pendingPromotion, setPendingPromotion] = useState<{ from: string; to: string } | null>(null);
	const [premove, setPremove] = useState<Premove | null>(null);
	const isReviewing = !!props.reviewPosition;
	const myColor = props.color[0] as "w" | "b";

	const chessRef = useRef<Chess | null>(null);
	if (!chessRef.current) chessRef.current = new Chess();
	const sourceSquareRef = useRef<string>("");
	const shakeControls = useAnimationControls();
	const premoveRef = useRef(premove);
	premoveRef.current = premove;

	const shakeBoard = () => {
		playIllegalSound();
		shakeControls.start({ x: [0, -8, 8, -8, 0], transition: { duration: 0.3 } });
	};

	const myTurn = () => chessRef.current!.turn() === props.color[0];

	const publishPosition = () => {
		const chess = chessRef.current!;
		const { isGameOver, result } = evaluateGame(chess);
		dispatch(
			setGameState({
				position: chess.fen(),
				pgn: chess.pgn(),
				isGameOver,
				result,
			})
		);
	};

	const playMove = (moveInput: { from: string; to: string; promotion?: string }) => {
		const chess = chessRef.current!;
		const move = chess.move(moveInput); // throws on illegal moves
		soundForMove(chess.inCheck(), move);
		publishPosition();
		socket.emit("send_move", { move, room: props.room });
		return move;
	};

	// Only checked for legality once it's actually our turn — if the
	// opponent's move invalidated it, it's dropped quietly rather than
	// forced through.
	const tryPremove = () => {
		const pm = premoveRef.current;
		if (!pm) return;
		setPremove(null);
		try {
			playMove(pm);
		} catch {
			// No longer legal — discard quietly.
		}
	};

	useEffect(() => {
		const onReceiveMove = (move: any) => {
			try {
				chessRef.current!.move(move);
				soundForMove(chessRef.current!.inCheck(), move);
				publishPosition();
				tryPremove();
			} catch (error) {
				console.error("Received an invalid move:", move);
			}
		};
		socket.on("receive_move", onReceiveMove);
		return () => {
			socket.off("receive_move", onReceiveMove);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleDrop = (source: Square, target: Square, piece: Piece) => {
		setOptionSquares({});
		if (isReviewing) return false;
		if (chessRef.current!.isGameOver()) { shakeBoard(); return false; }
		if (!myTurn()) {
			if (piece[0] !== myColor) { shakeBoard(); return false; }
			setPremove({ from: source, to: target, promotion: piece[1]?.toLowerCase() });
			return false;
		}
		try {
			playMove({
				from: source,
				to: target,
				promotion: piece[1]?.toLowerCase() ?? "q",
			});
			return true;
		} catch (e) {
			shakeBoard();
			return false;
		}
	};

	const handleClick = (square: Square) => {
		const chess = chessRef.current!;
		if (isReviewing || chess.isGameOver()) { setOptionSquares({}); return false; }

		if (!myTurn()) {
			if (premove && (square === premove.from || square === premove.to)) {
				setPremove(null);
				setOptionSquares({});
				sourceSquareRef.current = "";
				return false;
			}
			const from = sourceSquareRef.current;
			if (from) {
				sourceSquareRef.current = "";
				setOptionSquares({});
				if (from !== square) setPremove({ from, to: square, promotion: "q" });
				return false;
			}
			const piece = chess.get(square as Square);
			if (piece?.color === myColor) {
				sourceSquareRef.current = square;
				setOptionSquares({ [square]: { background: `rgba(${tokens.accentRgb},0.3)` } });
			}
			return false;
		}

		const from = sourceSquareRef.current;
		if (from) {
			const legal = chess.moves({ square: from as Square, verbose: true });
			if (legal.some((m) => m.to === square) && isPromotionMove(chess, from, square)) {
				sourceSquareRef.current = "";
				setOptionSquares({});
				setPendingPromotion({ from, to: square });
				return false;
			}
			try {
				playMove({ from, to: square, promotion: "q" });
				sourceSquareRef.current = "";
				setOptionSquares({});
				return true;
			} catch (e) {
				// Not a legal move from the stored source — treat as selecting a piece.
			}
		}
		sourceSquareRef.current = square;
		const moves = chess.moves({ square: square, verbose: true });
		if (moves.length === 0) {
			setOptionSquares({});
			return false;
		}
		let newSquares = {};
		moves.forEach((move) => {
			const key = move.to;
			newSquares = {
				...newSquares,
				[key]: {
					background: chess.get(key) ? tokens.board.hintCapture : tokens.board.hintMove,
				},
			};
		});
		setOptionSquares(newSquares);
		return false;
	};

	const confirmPromotion = (piece: PromotionPiece) => {
		if (!pendingPromotion) return;
		try {
			playMove({ from: pendingPromotion.from, to: pendingPromotion.to, promotion: piece });
		} catch (e) {
			shakeBoard();
		}
		setPendingPromotion(null);
	};

	const premoveSquares = premove
		? {
			[premove.from]: { background: `rgba(${tokens.accentRgb},0.35)` },
			[premove.to]: { background: `rgba(${tokens.accentRgb},0.35)` },
		}
		: {};

	return (
		<motion.div animate={shakeControls}>
			<Chessboard
				position={props.reviewPosition ?? position}
				onPieceDrop={handleDrop}
				boardWidth={props.boardWidth}
				arePiecesDraggable={!isReviewing}
				onSquareClick={handleClick}
				customDarkSquareStyle={{ backgroundColor: tokens.board.dark }}
				customLightSquareStyle={{ backgroundColor: tokens.board.light }}
				customSquareStyles={{ ...optionSquares, ...premoveSquares }}
				animationDuration={100}
				arePremovesAllowed={true}
				boardOrientation={props.color as "white" | "black"}
			/>
			<PromotionPicker
				open={!!pendingPromotion}
				color={myColor}
				onSelect={confirmPromotion}
				onCancel={() => setPendingPromotion(null)}
			/>
		</motion.div>
	);
};
export default StandardOnlineBoard;
