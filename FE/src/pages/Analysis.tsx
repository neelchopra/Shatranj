import React, { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Box, IconButton, Typography, useTheme } from "@mui/material";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { motion } from "framer-motion";
import Engine from "../Engine";
import GlassCard from "../ui/GlassCard";
import useBoardWidth from "../hooks/useBoardWidth";
import { fadeUp } from "../ui/motion";
import { pgnToPlies } from "../utilities/pgnPlies";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const ANALYSIS_DEPTH = 14;

const uciToSan = (fen: string, uci: string) => {
	try {
		const chess = new Chess(fen);
		const move = chess.move({
			from: uci.slice(0, 2),
			to: uci.slice(2, 4),
			promotion: uci.slice(4, 5) || "q",
		});
		return move?.san || uci;
	} catch {
		return uci;
	}
};

const Analysis = () => {
	const { tokens, palette } = useTheme();
	const location = useLocation();
	const navState = location.state as { pgn?: string; orientation?: "white" | "black" } | null;
	const pgn = navState?.pgn;

	const plies = useMemo(() => pgnToPlies(pgn || ""), [pgn]);

	const [index, setIndex] = useState(0); // 0 = starting position, N = after ply N
	const [evalCp, setEvalCp] = useState<number | null>(null);
	const [mateIn, setMateIn] = useState<number | null>(null);
	const [bestMoveSan, setBestMoveSan] = useState("");
	const [orientation, setOrientation] = useState<"white" | "black">(navState?.orientation ?? "white");

	const engineRef = useRef<Engine | null>(null);
	const boardContainerRef = useRef<HTMLDivElement>(null);
	const boardWidth = useBoardWidth(boardContainerRef);

	const position = index === 0 ? (plies[0]?.before ?? START_FEN) : plies[index - 1].after;

	// The engine's onMessage callback is registered exactly once (Engine.onMessage
	// stacks listeners on every call, so it must not be re-registered per move).
	// That means it closes over whatever `position` was at mount time forever —
	// so it needs to read the *current* position through a ref, not the closure,
	// or the white/black sign-flip below ends up using stale side-to-move data
	// and the eval appears to randomly invert on alternating moves.
	const positionRef = useRef(position);
	positionRef.current = position;

	useEffect(() => {
		const engine = new Engine();
		engineRef.current = engine;
		engine.onMessage(({ positionEvaluation, possibleMate, bestMove }) => {
			const currentPosition = positionRef.current;
			const currentSideToMove = currentPosition.split(" ")[1]; // 'w' | 'b'
			if (positionEvaluation !== undefined) {
				const cp = Number(positionEvaluation);
				setEvalCp(currentSideToMove === "w" ? cp : -cp);
				setMateIn(null);
			}
			if (possibleMate !== undefined) {
				const mate = Number(possibleMate);
				setMateIn(currentSideToMove === "w" ? mate : -mate);
			}
			if (bestMove) {
				setBestMoveSan(uciToSan(currentPosition, bestMove));
			}
		});
		return () => {
			engine.terminate();
			engineRef.current = null;
		};
	}, []);

	useEffect(() => {
		setEvalCp(null);
		setMateIn(null);
		setBestMoveSan("");
		engineRef.current?.stop();
		engineRef.current?.evaluatePosition(position, ANALYSIS_DEPTH);
	}, [position]);

	if (!pgn || plies.length === 0) return <Navigate to="/play" replace />;

	// Clamp the eval bar to a readable range; a mate score pins it to the extreme.
	const barFraction =
		mateIn !== null
			? mateIn > 0 ? 1 : 0
			: evalCp === null
				? 0.5
				: 0.5 + Math.max(-0.5, Math.min(0.5, evalCp / 1000));

	const evalLabel =
		mateIn !== null ? `M${Math.abs(mateIn)}` : evalCp === null ? "…" : (evalCp / 100).toFixed(2);

	return (
		<motion.div variants={fadeUp} initial="initial" animate="animate">
			<Typography variant="h2" sx={{ marginBottom: "24px" }}>
				Game analysis
			</Typography>
			<Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0,1fr) 340px" }, gap: 3, alignItems: "start" }}>
				<Box sx={{ display: "flex", gap: 2, minWidth: 0 }}>
					<Box
						sx={{
							width: 28,
							borderRadius: "8px",
							overflow: "hidden",
							background: tokens.inputBackground,
							display: "flex",
							flexDirection: "column-reverse",
							border: tokens.glass.border,
						}}
					>
						<motion.div
							animate={{ height: `${barFraction * 100}%` }}
							transition={{ duration: 0.3 }}
							style={{ background: palette.text.primary, width: "100%" }}
						/>
					</Box>
					<Box ref={boardContainerRef} sx={{ flexGrow: 1, minWidth: 0, display: "flex", justifyContent: "center" }}>
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
								<Chessboard
									position={position}
									arePiecesDraggable={false}
									boardWidth={boardWidth}
									boardOrientation={orientation}
									customDarkSquareStyle={{ backgroundColor: tokens.board.dark }}
									customLightSquareStyle={{ backgroundColor: tokens.board.light }}
								/>
							</Box>
						)}
					</Box>
				</Box>

				<GlassCard sx={{ padding: "24px" }}>
					<Typography sx={{ color: "text.secondary", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
						Evaluation
					</Typography>
					<Typography sx={{ fontFamily: tokens.fontMono, fontSize: "2rem", fontWeight: 700, marginBottom: "16px" }}>
						{evalLabel}
					</Typography>
					<Typography sx={{ color: "text.secondary", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
						Engine suggests
					</Typography>
					<Typography sx={{ fontFamily: tokens.fontMono, fontSize: "1.3rem", fontWeight: 700, marginBottom: "24px" }}>
						{bestMoveSan || "…"}
					</Typography>

					<Box sx={{ display: "flex", justifyContent: "center", gap: "8px" }}>
						<IconButton onClick={() => setIndex(0)} disabled={index === 0}>
							<SkipPreviousIcon />
						</IconButton>
						<IconButton onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
							<NavigateBeforeIcon />
						</IconButton>
						<IconButton onClick={() => setIndex((i) => Math.min(plies.length, i + 1))} disabled={index === plies.length}>
							<NavigateNextIcon />
						</IconButton>
						<IconButton onClick={() => setIndex(plies.length)} disabled={index === plies.length}>
							<SkipNextIcon />
						</IconButton>
						<IconButton
							onClick={() => setOrientation((o) => (o === "white" ? "black" : "white"))}
							aria-label="Flip board"
						>
							<SwapVertIcon />
						</IconButton>
					</Box>
					<Typography sx={{ fontFamily: tokens.fontMono, textAlign: "center", color: "text.secondary", marginTop: "12px", fontSize: "0.9rem" }}>
						{index === 0 ? "Starting position" : `${index}. ${plies[index - 1].san}`}
					</Typography>
				</GlassCard>
			</Box>
		</motion.div>
	);
};

export default Analysis;
