import React, { useEffect, useRef, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Square, Piece } from "react-chessboard/dist/chessboard/types";
import { motion, useAnimationControls } from "framer-motion";
import { useAppDispatch, useAppSelector } from "../../app-state/hooks";
import { setGameState } from "../../app-state/features/gameSlice";
import { Chess } from "chess.js";
import { socket } from "../../socket";
import { evaluateGame } from "../../utilities/chessResult";
import { playIllegalSound, soundForMove } from "../../utilities/sounds";
import { tokens } from "../../theme";

type Props = {
	color: string; // 'white' | 'black' — this client's side, assigned by the server
	room: string;
	boardWidth: number;
};

const StandardOnlineBoard = (props: Props) => {
	const dispatch = useAppDispatch();
	const position = useAppSelector((state) => state.game.gameState.position);
	const [optionSquares, setOptionSquares] = useState({});

	const chessRef = useRef<Chess | null>(null);
	if (!chessRef.current) chessRef.current = new Chess();
	const sourceSquareRef = useRef<string>("");
	const shakeControls = useAnimationControls();

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

	useEffect(() => {
		const onReceiveMove = (move: any) => {
			try {
				chessRef.current!.move(move);
				soundForMove(chessRef.current!.inCheck(), move);
				publishPosition();
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

	const playMove = (moveInput: { from: string; to: string; promotion?: string }) => {
		const chess = chessRef.current!;
		const move = chess.move(moveInput); // throws on illegal moves
		soundForMove(chess.inCheck(), move);
		publishPosition();
		socket.emit("send_move", { move, room: props.room });
		return move;
	};

	const handleDrop = (source: Square, target: Square, piece: Piece) => {
		setOptionSquares({});
		if (!myTurn() || chessRef.current!.isGameOver()) {
			shakeBoard();
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
		if (!myTurn() || chess.isGameOver()) {
			setOptionSquares({});
			return false;
		}
		try {
			playMove({ from: sourceSquareRef.current, to: square, promotion: "q" });
			setOptionSquares({});
			return true;
		} catch (e) {
			// Not a legal move from the stored source — treat as selecting a piece.
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
	};

	return (
		<motion.div animate={shakeControls}>
			<Chessboard
				position={position}
				onPieceDrop={handleDrop}
				boardWidth={props.boardWidth}
				onSquareClick={handleClick}
				customDarkSquareStyle={{ backgroundColor: tokens.board.dark }}
				customLightSquareStyle={{ backgroundColor: tokens.board.light }}
				customSquareStyles={{ ...optionSquares }}
				animationDuration={100}
				arePremovesAllowed={false}
				boardOrientation={props.color as "white" | "black"}
			/>
		</motion.div>
	);
};
export default StandardOnlineBoard;
