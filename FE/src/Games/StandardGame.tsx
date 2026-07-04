import React, { useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import StandardOnlineBoard from "../components/chessboards/StandardOnlineBoard";
import ReviewBoard from "../components/chessboards/ReviewBoard";
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogTitle,
	Snackbar,
	useTheme,
} from "@mui/material";
import Timer from "../utilities/Timer";
import GameControls from "../utilities/GameControls";
import { useAppDispatch, useAppSelector } from "../app-state/hooks";
import ResultModal, { RatingUpdate } from "../utilities/ResultModal";
import { socket } from "../socket";
import { initGame, setWinner } from "../app-state/features/gameSlice";
import { updateRating } from "../app-state/features/userPreferenceSlice";
import { resultToScore, scoreToResult } from "../utilities/chessResult";
import useBoardWidth from "../hooks/useBoardWidth";
import { pgnToPlies } from "../utilities/pgnPlies";

type GameNavState = {
	room: string;
	color: string;
	time: number;
	opponent: { username: string; rating: number };
};

const StandardGame = () => {
	const { tokens } = useTheme();
	const location = useLocation();
	const dispatch = useAppDispatch();
	const state = location.state as GameNavState | null;

	const user = useAppSelector((s) => s.userPreference.user);
	const isGameOver = useAppSelector((s) => s.game.gameState.isGameOver);
	const gameEnded = useAppSelector((s) => s.game.gameState.gameEnded);
	const result = useAppSelector((s) => s.game.gameState.result);
	const pgn = useAppSelector((s) => s.game.gameState.pgn);

	const [drawOffered, setDrawOffered] = useState(false);
	const [notice, setNotice] = useState("");
	const [ratingUpdate, setRatingUpdate] = useState<RatingUpdate>(null);
	const reportedRef = useRef(false);

	const boardContainerRef = useRef<HTMLDivElement>(null);
	const boardWidth = useBoardWidth(boardContainerRef);

	// Stable clock expiry timestamps — created once per game mount.
	const [expiry] = useState(() => {
		const minutes = state?.time ?? 5;
		const mine = new Date();
		mine.setSeconds(mine.getSeconds() + minutes * 60);
		const theirs = new Date();
		theirs.setSeconds(theirs.getSeconds() + minutes * 60);
		return { mine, theirs };
	});

	const opponentColor = state?.color === "white" ? "black" : "white";

	useEffect(() => {
		if (!state) return;
		dispatch(
			initGame({
				opponent: {
					name: state.opponent.username,
					rating: state.opponent.rating,
					color: opponentColor,
				},
				room: state.room,
			})
		);
	}, [dispatch, state, opponentColor]);

	useEffect(() => {
		if (!state) return;
		const onGameEnded = (data: { result: number | null; reason: string }) => {
			reportedRef.current = true; // server already knows — don't re-report
			dispatch(setWinner(scoreToResult(data.result)));
			if (data.reason === "opponent_left") setNotice("Your opponent left the game");
			if (data.reason === "draw_agreed") setNotice("Draw agreed");
		};
		const onDrawOffered = () => setDrawOffered(true);
		const onDrawDeclined = () => setNotice("Draw offer declined");
		const onRatingsUpdated = (data: {
			white: { username: string; rating: number; delta: number };
			black: { username: string; rating: number; delta: number };
		}) => {
			const me = data.white.username === user?.username ? data.white : data.black;
			dispatch(updateRating(me.rating));
			setRatingUpdate({ rating: me.rating, delta: me.delta });
		};

		socket.on("game_ended", onGameEnded);
		socket.on("draw_offered", onDrawOffered);
		socket.on("draw_declined", onDrawDeclined);
		socket.on("ratings_updated", onRatingsUpdated);
		return () => {
			socket.off("game_ended", onGameEnded);
			socket.off("draw_offered", onDrawOffered);
			socket.off("draw_declined", onDrawDeclined);
			socket.off("ratings_updated", onRatingsUpdated);
		};
	}, [dispatch, state, user?.username]);

	// Report board-detected endings (checkmate, draw, flag) to the server once.
	useEffect(() => {
		if (!state || !isGameOver || reportedRef.current) return;
		const score = resultToScore(result);
		if (score === null) return;
		reportedRef.current = true;
		socket.emit("game_over", { room: state.room, result: score, pgn });
	}, [isGameOver, result, pgn, state]);

	if (!state) return <Navigate to="/play/online" replace />;

	const respondToDraw = (accepted: boolean) => {
		setDrawOffered(false);
		socket.emit("draw_response", { room: state.room, accepted, pgn });
	};

	return (
		<Box
			sx={{
				display: "grid",
				gridTemplateColumns: { xs: "1fr", lg: "minmax(0,1fr) 340px" },
				gap: 3,
				alignItems: "start",
			}}
		>
			<Box>
				<Timer
					avatar=""
					name={state.opponent.username}
					rating={state.opponent.rating}
					expiryTimestamp={expiry.theirs}
					player={opponentColor}
				/>

				<Box ref={boardContainerRef} sx={{ display: "flex", justifyContent: "center" }}>
					{boardWidth > 0 && (
						<Box
							sx={{
								borderRadius: "12px",
								overflow: "hidden",
								touchAction: "manipulation",
								border: tokens.glass.border,
								boxShadow: tokens.glowSoft,
							}}
						>
							{gameEnded ? (
								<ReviewBoard
									plies={pgnToPlies(pgn)}
									boardWidth={boardWidth}
									orientation={state.color as "white" | "black"}
								/>
							) : (
								<StandardOnlineBoard color={state.color} room={state.room} boardWidth={boardWidth} />
							)}
						</Box>
					)}
				</Box>

				<Timer
					avatar=""
					name={user?.username || "You"}
					rating={user?.rating || 400}
					expiryTimestamp={expiry.mine}
					player={state.color}
				/>
			</Box>
			<GameControls room={state.room} isOnline={true} />

			<ResultModal ratingUpdate={ratingUpdate} myColor={state.color} room={state.room} />

			<Dialog open={drawOffered}>
				<DialogTitle>{state.opponent.username} offers a draw</DialogTitle>
				<DialogActions>
					<Button onClick={() => respondToDraw(true)} variant="contained">
						Accept
					</Button>
					<Button onClick={() => respondToDraw(false)}>
						Decline
					</Button>
				</DialogActions>
			</Dialog>
			<Snackbar
				open={!!notice}
				autoHideDuration={5000}
				onClose={() => setNotice("")}
				message={notice}
			/>
		</Box>
	);
};

export default StandardGame;
