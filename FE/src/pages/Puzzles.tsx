import React, { useCallback, useEffect, useRef, useState } from "react";
import { Box, Button, Chip, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import GlassCard from "../ui/GlassCard";
import AnimatedNumber from "../ui/AnimatedNumber";
import useBoardWidth from "../hooks/useBoardWidth";
import PuzzleBoard, { PuzzleData, PuzzleOutcome } from "../components/chessboards/PuzzleBoard";
import ReviewBoard, { ReviewControls } from "../components/chessboards/ReviewBoard";
import { fadeUp, staggerContainer } from "../ui/motion";
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
	const { tokens, palette } = useTheme();
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const user = useAppSelector((state) => state.userPreference.user);
	const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);
	const [outcome, setOutcome] = useState<PuzzleOutcome | null>(null);
	const [attempt, setAttempt] = useState<AttemptResult | null>(null);
	const [error, setError] = useState("");
	const [showSolution, setShowSolution] = useState(false);
	const [foundAfterFail, setFoundAfterFail] = useState(false);
	const boardContainerRef = useRef<HTMLDivElement>(null);
	const boardWidth = useBoardWidth(boardContainerRef);
	const puzzleRequestRef = useRef(0);

	const loadPuzzle = useCallback(() => {
		const requestId = ++puzzleRequestRef.current;
		setError("");
		api
			.get("/puzzles/next")
			.then((res) => {
				if (puzzleRequestRef.current !== requestId) return;
				// Deferred until the new puzzle actually arrives — clearing this
				// upfront let the board area briefly flip back to a fresh
				// PuzzleBoard showing the *old*, already-solved puzzle (a visible
				// flicker) while the fetch for the next one was still in flight.
				setPuzzle(res.data);
				setOutcome(null);
				setAttempt(null);
				setShowSolution(false);
				setFoundAfterFail(false);
			})
			.catch(() => {
				if (puzzleRequestRef.current === requestId) setError("Could not load a puzzle right now.");
			});
	}, []);

	useEffect(() => { loadPuzzle(); }, [loadPuzzle]);

	const solverColor: "white" | "black" =
		puzzle && puzzle.fen.split(" ")[1] === "w" ? "black" : "white";
	const showReview = !!outcome && (outcome.solved || showSolution);

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
		navigate("/analysis", { state: { pgn: outcome.solutionPgn, orientation: solverColor } });
	};

	return (
		<>
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
				<Box ref={boardContainerRef} sx={{ flexGrow: 1, minWidth: 280, display: "flex", justifyContent: "center" }}>
					{puzzle && boardWidth > 0 && (
						<Box
							sx={{
								borderRadius: "12px",
								overflow: "hidden",
								touchAction: "manipulation",
								border: tokens.glass.border,
								boxShadow: tokens.glowSoft,
								display: "inline-block",
								padding: "12px",
							}}
						>
							{showReview ? (
								<ReviewBoard
									plies={pgnToPlies(outcome!.solutionPgn)}
									boardWidth={boardWidth}
									orientation={solverColor}
								/>
							) : (
								<>
									<PuzzleBoard
										key={puzzle._id}
										puzzle={puzzle}
										boardWidth={boardWidth}
										onResult={handleResult}
										onLineComplete={() => setFoundAfterFail(true)}
									/>
									<ReviewControls
										index={0}
										total={0}
										label=""
										onFirst={() => {}}
										onPrev={() => {}}
										onNext={() => {}}
										onLast={() => {}}
										placeholder
									/>
								</>
							)}
						</Box>
					)}
				</Box>

				<GlassCard sx={{ padding: "28px", minWidth: 260, maxWidth: 360 }}>
					{puzzle && (
						<Box sx={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
							<Chip
								label={`Puzzle rating ${puzzle.rating}`}
								sx={{ background: tokens.inputBackground, color: "text.secondary" }}
							/>
							{!outcome && (
								<Chip
									icon={
										<Box
											component="span"
											sx={{
												width: 12,
												height: 12,
												borderRadius: "50%",
												marginLeft: "8px",
												background: solverColor === "white" ? "#F1F5F9" : "#0B0E14",
												border: "1px solid rgba(255,255,255,0.4)",
											}}
										/>
									}
									label={solverColor === "white" ? "White to move" : "Black to move"}
									sx={{ background: tokens.inputBackground, color: "text.primary", fontWeight: 600 }}
								/>
							)}
						</Box>
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
									{outcome.solved
										? "Solved!"
										: foundAfterFail
											? "You found it — already counted as a miss"
											: "Not quite — keep trying, or view the solution"}
								</Typography>
							</Box>
						</motion.div>
					)}

					{attempt && (
						<Box sx={{ marginBottom: "20px" }}>
							<Typography sx={{ color: "text.secondary", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
								Puzzle rating
							</Typography>
							<Typography sx={{ fontFamily: tokens.fontMono, fontSize: "1.8rem", fontWeight: 600 }}>
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

					{outcome?.mistake && (showReview || foundAfterFail) && (
						<Box sx={{ marginBottom: "16px", padding: "12px 14px", borderRadius: "10px", background: alpha(palette.error.main, 0.08), border: `1px solid ${alpha(palette.error.main, 0.25)}` }}>
							<Typography sx={{ fontSize: "0.9rem" }}>
								You played{" "}
								<Box component="span" sx={{ fontFamily: tokens.fontMono, fontWeight: 700, color: "error.main" }}>
									{outcome.mistake.playedSan || "an illegal move"}
								</Box>{" "}
								— the winning move was{" "}
								<Box component="span" sx={{ fontFamily: tokens.fontMono, fontWeight: 700, color: "success.main" }}>
									{outcome.mistake.expectedSan}
								</Box>
								.
							</Typography>
						</Box>
					)}

					{outcome && (showReview || foundAfterFail) && (
						<Box sx={{ marginBottom: "20px" }}>
							<Typography sx={{ color: "text.secondary", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
								Full solution
							</Typography>
							<Typography sx={{ fontFamily: tokens.fontMono, fontSize: "0.9rem", color: "text.secondary", lineHeight: 1.7 }}>
								{formatSanLine(outcome.solutionSan)}
							</Typography>
						</Box>
					)}

					{/* On mobile these live in the fixed bottom bar instead, so
					    reaching "Next puzzle" never requires scrolling past
					    the stats/solution content above. */}
					<Box sx={{ display: { xs: "none", lg: "block" } }}>
						{outcome && !showReview && (
							<Button variant="outlined" fullWidth onClick={() => setShowSolution(true)} sx={{ marginBottom: "12px" }}>
								View solution
							</Button>
						)}
						{showReview && (
							<Button variant="outlined" fullWidth onClick={reviewOnAnalysisBoard} sx={{ marginBottom: "12px" }}>
								Play it out on the analysis board
							</Button>
						)}
						<Button variant="contained" fullWidth onClick={loadPuzzle} disabled={!outcome}>
							Next puzzle
						</Button>
					</Box>
				</GlassCard>
			</Box>

			{/* Reserves space so the fixed mobile action bar below never
			    overlaps the last bit of sidebar content. */}
			{puzzle && <Box sx={{ height: { xs: "84px", lg: 0 } }} />}
		</motion.div>

		{puzzle && (
			<Box
				sx={{
					display: { xs: "flex", lg: "none" },
					position: "fixed",
					left: 0,
					right: 0,
					bottom: 0,
					zIndex: (t) => t.zIndex.appBar,
					gap: "10px",
					padding: "12px 16px calc(12px + env(safe-area-inset-bottom))",
					background: tokens.glassStrong.background,
					backdropFilter: tokens.glassStrong.blur,
					WebkitBackdropFilter: tokens.glassStrong.blur,
					borderTop: tokens.glassStrong.border,
				}}
			>
				{outcome && !showReview && (
					<Button variant="outlined" fullWidth onClick={() => setShowSolution(true)}>
						Solution
					</Button>
				)}
				{showReview && (
					<Button variant="outlined" fullWidth onClick={reviewOnAnalysisBoard}>
						Analyze
					</Button>
				)}
				<Button variant="contained" fullWidth onClick={loadPuzzle} disabled={!outcome}>
					Next puzzle
				</Button>
			</Box>
		)}
		</>
	);
};

export default Puzzles;
