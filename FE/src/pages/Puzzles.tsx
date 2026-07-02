import React, { useCallback, useEffect, useRef, useState } from "react";
import { Box, Button, Chip, Typography } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import { motion } from "framer-motion";
import { api } from "../api";
import GlassCard from "../ui/GlassCard";
import AnimatedNumber from "../ui/AnimatedNumber";
import useBoardWidth from "../hooks/useBoardWidth";
import PuzzleBoard, { PuzzleData } from "../components/chessboards/PuzzleBoard";
import { fadeUp, staggerContainer } from "../ui/motion";
import { tokens } from "../theme";
import { useAppDispatch } from "../app-state/hooks";
import { updatePuzzleStats } from "../app-state/features/userPreferenceSlice";

type AttemptResult = {
	puzzle_rating: number;
	puzzle_streak: number;
	best_streak: number;
	delta: number;
};

const Puzzles = () => {
	const dispatch = useAppDispatch();
	const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);
	const [outcome, setOutcome] = useState<"solved" | "failed" | null>(null);
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

	const handleResult = (solved: boolean) => {
		if (!puzzle) return;
		setOutcome(solved ? "solved" : "failed");
		api
			.post(`/puzzles/${puzzle._id}/attempt`, { solved })
			.then((res) => {
				setAttempt(res.data);
				dispatch(updatePuzzleStats(res.data));
			})
			.catch(() => setError("Could not record that attempt."));
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
								border: "1px solid rgba(255,255,255,0.08)",
								boxShadow: tokens.glowSoft,
								display: "inline-block",
							}}
						>
							<PuzzleBoard key={puzzle._id} puzzle={puzzle} boardWidth={boardWidth} onResult={handleResult} />
						</Box>
					)}
				</Box>

				<GlassCard sx={{ padding: "28px", minWidth: 260, maxWidth: 320 }}>
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
									color: outcome === "solved" ? "success.main" : "error.main",
								}}
							>
								{outcome === "solved" ? <CheckCircleOutlineIcon /> : <HighlightOffIcon />}
								<Typography sx={{ fontWeight: 700 }}>
									{outcome === "solved" ? "Solved!" : "Not quite"}
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

					<Button variant="contained" fullWidth onClick={loadPuzzle} disabled={!outcome}>
						Next puzzle
					</Button>
				</GlassCard>
			</Box>
		</motion.div>
	);
};

export default Puzzles;
