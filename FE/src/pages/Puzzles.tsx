import React, { useCallback, useEffect, useRef, useState } from "react";
import { Box, Button, Chip, Typography } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import GlassCard from "../ui/GlassCard";
import AnimatedNumber from "../ui/AnimatedNumber";
import useBoardWidth from "../hooks/useBoardWidth";
import PuzzleBoard, { PuzzleData, PuzzleOutcome } from "../components/chessboards/PuzzleBoard";
import ReviewBoard from "../components/chessboards/ReviewBoard";
import { fadeUp, staggerContainer } from "../ui/motion";
import { tokens } from "../theme";
import { useAppDispatch, useAppSelector } from "../app-state/hooks";
import { updatePuzzleStats } from "../app-state/features/userPreferenceSlice";
import { pgnToPlies } from "../utilities/pgnPlies";

type AttemptResult = {
	puzzle_rating: number;
	puzzle_streak: number;
	best_streak: number;
	delta: number;
};

/** Pairs SAN plies into "1. e4 e5" style movetext for display. */
const formatSanLine = (sans: string[]) => {
	const parts: string[] = [];
	for (let i = 0; i < sans.length; i += 2) {
		const moveNumber = Math.floor(i / 2) + 1;
		parts.push(`${moveNumber}. ${sans[i]}${sans[i + 1] ? " " + sans[i + 1] : ""}`);
	}
	return parts.join("  ");
};

const Puzzles = () => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const user = useAppSelector((state) => state.userPreference.user);
	const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);
	const [outcome, setOutcome] = useState<PuzzleOutcome | null>(null);
	const [attempt, setAttempt] = useState<AttemptResult | null>(null);
	const [error, setError] = useState("");
	const boardContainerRef = useRef<HTMLDivElement>(null);
	const boardWidth = useBoardWidth(boardContainerRef);

	const loadPuzzle = useCallback(() => {
		setOutcome(null);
		setAttempt(null);
		setError("");
		api
			.get("/puzzles/next")
			.then((res) => setPuzzle(res.data))
			.catch(() => setError("Could not load a puzzle right now."));
	}, []);

	useEffect(() => { loadPuzzle(); }, [loadPuzzle]);

	const handleResult = (result: PuzzleOutcome) => {
		if (!puzzle) return;
		setOutcome(result);
		if (!user) return; // guests get solved/failed feedback but no persisted rating
		api
			.post(`/puzzles/${puzzle._id}/attempt`, { solved: result.solved })
			.then((res) => {
				setAttempt(res.data);
				dispatch(updatePuzzleStats(res.data));
			})
			.catch(() => setError("Could not record that attempt."));
	};

	const reviewOnAnalysisBoard = () => {
		if (!outcome) return;
		navigate("/analysis", { state: { pgn: outcome.solutionPgn } });
	};

	return (
		<motion.div variants={staggerContainer} initial="initial" animate="animate">
			<motion.div variants={fadeUp}>
				<Typography variant="h2" sx={{ marginBottom: "24px" }}>
					Puzzles
				</Typography>
			</motion.div>

			{error && (
				<motion.div variants={fadeUp}>
					<Typography sx={{ color: "error.main", marginBottom: "16px" }}>{error}</Typography>
				</motion.div>
			)}

			<Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", alignItems: "flex-start" }}>
				<Box ref={boardContainerRef} sx={{ flexGrow: 1, minWidth: 280 }}>
					{puzzle && boardWidth > 0 && (
						<Box
							sx={{
								borderRadius: "12px",
								overflow: "hidden",
								touchAction: "manipulation",
								border: "1px solid rgba(255,255,255,0.08)",
								boxShadow: tokens.glowSoft,
								display: "inline-block",
								padding: outcome ? "12px" : 0,
							}}
						>
							{outcome ? (
								<ReviewBoard
									plies={pgnToPlies(outcome.solutionPgn)}
									boardWidth={boardWidth}
									orientation={puzzle.fen.split(" ")[1] === "w" ? "black" : "white"}
								/>
							) : (
								<PuzzleBoard key={puzzle._id} puzzle={puzzle} boardWidth={boardWidth} onResult={handleResult} />
							)}
						</Box>
					)}
				</Box>

				<GlassCard sx={{ padding: "28px", minWidth: 260, maxWidth: 360 }}>
					{puzzle && (
						<Chip
							label={`Puzzle rating ${puzzle.rating}`}
							sx={{ marginBottom: "20px", background: "rgba(255,255,255,0.06)", color: "text.secondary" }}
						/>
					)}

					{outcome && (
						<motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									gap: "10px",
									marginBottom: "16px",
									color: outcome.solved ? "success.main" : "error.main",
								}}
							>
								{outcome.solved ? <CheckCircleOutlineIcon /> : <HighlightOffIcon />}
								<Typography sx={{ fontWeight: 700 }}>
									{outcome.solved ? "Solved!" : "Not quite"}
								</Typography>
							</Box>
						</motion.div>
					)}

					{attempt && (
						<Box sx={{ marginBottom: "20px" }}>
							<Typography sx={{ color: "text.secondary", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
								Puzzle rating
							</Typography>
							<Typography sx={{ fontFamily: tokens.fontDisplay, fontSize: "1.8rem", fontWeight: 700 }}>
								<AnimatedNumber value={attempt.puzzle_rating} />{" "}
								<Box component="span" sx={{ fontSize: "1rem", color: attempt.delta >= 0 ? "success.main" : "error.main" }}>
									({attempt.delta >= 0 ? "+" : ""}{attempt.delta})
								</Box>
							</Typography>
							<Typography sx={{ color: "text.secondary", marginTop: "8px" }}>
								Streak: {attempt.puzzle_streak} (best {attempt.best_streak})
							</Typography>
						</Box>
					)}

					{outcome && !user && (
						<Typography sx={{ color: "text.secondary", fontSize: "0.85rem", marginBottom: "20px" }}>
							Log in to save your puzzle rating and streak.
						</Typography>
					)}

					{outcome?.mistake && (
						<Box sx={{ marginBottom: "16px", padding: "12px 14px", borderRadius: "10px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)" }}>
							<Typography sx={{ fontSize: "0.9rem" }}>
								You played{" "}
								<Box component="span" sx={{ fontWeight: 700, color: "error.main" }}>
									{outcome.mistake.playedSan || "an illegal move"}
								</Box>{" "}
								— the winning move was{" "}
								<Box component="span" sx={{ fontWeight: 700, color: "success.main" }}>
									{outcome.mistake.expectedSan}
								</Box>
								.
							</Typography>
						</Box>
					)}

					{outcome && (
						<Box sx={{ marginBottom: "20px" }}>
							<Typography sx={{ color: "text.secondary", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
								Full solution
							</Typography>
							<Typography sx={{ fontFamily: "monospace", fontSize: "0.9rem", color: "text.secondary", lineHeight: 1.7 }}>
								{formatSanLine(outcome.solutionSan)}
							</Typography>
						</Box>
					)}

					{outcome && (
						<Button variant="outlined" fullWidth onClick={reviewOnAnalysisBoard} sx={{ marginBottom: "12px" }}>
							Play it out on the analysis board
						</Button>
					)}

					<Button variant="contained" fullWidth onClick={loadPuzzle} disabled={!outcome}>
						Next puzzle
					</Button>
				</GlassCard>
			</Box>
		</motion.div>
	);
};

export default Puzzles;
