import React, { useEffect, useRef, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Square, Piece } from "react-chessboard/dist/chessboard/types";
import { useAppDispatch, useAppSelector } from "../../app-state/hooks";
import { setGameState } from "../../app-state/features/gameSlice";
import { Chess } from "chess.js";
import { socket } from "../../socket";
import { evaluateGame } from "../../utilities/chessResult";

const boardWidth = (window.innerHeight * 80 * 75) / 10000;

type Props = {
	color: string; // 'white' | 'black' — this client's side, assigned by the server
	room: string;
};

const StandardOnlineBoard = (props: Props) => {
	const dispatch = useAppDispatch();
	const position = useAppSelector((state) => state.game.gameState.position);
	const [optionSquares, setOptionSquares] = useState({});

	const chessRef = useRef<Chess | null>(null);
	if (!chessRef.current) chessRef.current = new Chess();
	const sourceSquareRef = useRef<string>("");

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
		publishPosition();
		socket.emit("send_move", { move, room: props.room });
		return move;
	};

	const handleDrop = (source: Square, target: Square, piece: Piece) => {
		setOptionSquares({});
		if (!myTurn() || chessRef.current!.isGameOver()) return false;
		try {
			playMove({
				from: source,
				to: target,
				promotion: piece[1]?.toLowerCase() ?? "q",
			});
			return true;
		} catch (e) {
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
					background: chess.get(key)
						? "radial-gradient(closest-side, #97aef3 80%, transparent 40%)"
						: "radial-gradient(closest-side, #97aef3 30%, transparent 40%)",
				},
			};
		});
		setOptionSquares(newSquares);
	};

	return (
		<Chessboard
			position={position}
			onPieceDrop={handleDrop}
			boardWidth={boardWidth}
			onSquareClick={handleClick}
			customDarkSquareStyle={{ backgroundColor: "#B7C0D8" }}
			customLightSquareStyle={{ backgroundColor: "#E8EDF9" }}
			customSquareStyles={{ ...optionSquares }}
			animationDuration={100}
			arePremovesAllowed={false}
			boardOrientation={props.color as "white" | "black"}
		/>
	);
};
export default StandardOnlineBoard;
