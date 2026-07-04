import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Chip, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { NavLink } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { fadeUp, staggerContainer } from "../ui/motion";
import useBoardWidth from "../hooks/useBoardWidth";

// The Italian Game — the hero board plays this out on a loop instead of
// sitting still, so the first thing a visitor sees is chess actually being
// played rather than a static screenshot.
const OPENING_SAN = ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "Nf6"];

/** Every position along OPENING_SAN (index 0 = starting position), paired with its move label. */
const useOpeningPositions = () =>
	useMemo(() => {
		const chess = new Chess();
		const positions = [chess.fen()];
		const labels = ["Starting position"];
		OPENING_SAN.forEach((san, i) => {
			chess.move(san);
			positions.push(chess.fen());
			const moveNumber = Math.floor(i / 2) + 1;
			labels.push(i % 2 === 0 ? `${moveNumber}. ${san}` : `${moveNumber}...${san}`);
		});
		return { positions, labels };
	}, []);

const useOpeningPlayback = (stepMs = 850, holdMs = 2600) => {
	const { positions, labels } = useOpeningPositions();
	const reduceMotion = useReducedMotion();
	const [step, setStep] = useState(0);

	useEffect(() => {
		if (reduceMotion) return; // static final position — no looping content change
		const advance = () => {
			setStep((s) => {
				const next = s + 1;
				return next >= positions.length ? 0 : next;
			});
		};
		const delay = step === positions.length - 1 ? holdMs : stepMs;
		const timer = setTimeout(advance, delay);
		return () => clearTimeout(timer);
	}, [step, positions.length, reduceMotion, stepMs, holdMs]);

	const activeStep = reduceMotion ? positions.length - 1 : step;
	return { position: positions[activeStep], label: labels[activeStep] };
};

const Home = () => {
	const { tokens, palette } = useTheme();
	const { position: heroPosition, label: heroLabel } = useOpeningPlayback();
	const boardContainerRef = useRef<HTMLDivElement>(null);
	const boardWidth = useBoardWidth(boardContainerRef);

	return (
		<Box
			sx={{
				display: "grid",
				gridTemplateColumns: { xs: "1fr", md: "1.1fr 0.9fr" },
				alignItems: "center",
				gap: { xs: 6, md: 8 },
				paddingTop: { xs: 2, md: 8 },
			}}
		>
			<motion.div variants={staggerContainer} initial="initial" animate="animate">
				<motion.div variants={fadeUp}>
					<Chip
						label="Rated games · Live clocks · Stockfish practice"
						sx={{
							marginBottom: "24px",
							background: `rgba(${tokens.accentRgb},0.08)`,
							border: `1px solid rgba(${tokens.accentRgb},0.25)`,
							color: "primary.light",
							fontWeight: 600,
						}}
					/>
				</motion.div>
				<motion.div variants={fadeUp}>
					<Typography variant="h1" sx={{ marginBottom: "20px" }}>
						Your{" "}
						<Box
							component="span"
							sx={{
								background: `linear-gradient(90deg, ${palette.primary.light}, ${palette.primary.main})`,
								backgroundClip: "text",
								WebkitBackgroundClip: "text",
								WebkitTextFillColor: "transparent",
							}}
						>
							move
						</Box>
						.
					</Typography>
				</motion.div>
				<motion.div variants={fadeUp}>
					<Typography
						sx={{
							fontSize: "1.15rem",
							color: "text.secondary",
							marginBottom: "36px",
							maxWidth: 520,
							lineHeight: 1.7,
						}}
					>
						Challenge a random opponent, invite a friend with a room code, or
						sharpen your openings against Stockfish. Rated games, live clocks,
						and puzzles pulled from 18,000 real positions.
					</Typography>
				</motion.div>
				<motion.div variants={fadeUp}>
					<Box sx={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
						<NavLink to="/play/online" style={{ textDecoration: "none" }}>
							<Button
								variant="contained"
								size="large"
								sx={{ padding: "12px 32px", fontSize: "1.05rem" }}
							>
								Play Online
							</Button>
						</NavLink>
						<NavLink to="/play/computer" style={{ textDecoration: "none" }}>
							<Button
								variant="outlined"
								size="large"
								sx={{ padding: "12px 32px", fontSize: "1.05rem" }}
							>
								Play the Computer
							</Button>
						</NavLink>
					</Box>
				</motion.div>
			</motion.div>

			<Box ref={boardContainerRef} sx={{ justifySelf: "center", width: "100%", maxWidth: 380 }}>
				<motion.div
					initial={{ opacity: 0, y: 24, rotate: 2 }}
					animate={{ opacity: 1, y: 0, rotate: 2 }}
					transition={{ duration: 0.6 }}
					style={{
						borderRadius: 16,
						overflow: "hidden",
						border: tokens.glass.border,
						boxShadow: tokens.glowSoft,
						pointerEvents: "none",
						display: "inline-block",
					}}
				>
					{boardWidth > 0 && (
						<Chessboard
							boardWidth={boardWidth}
							position={heroPosition}
							arePiecesDraggable={false}
							animationDuration={400}
							customDarkSquareStyle={{ backgroundColor: tokens.board.dark }}
							customLightSquareStyle={{ backgroundColor: tokens.board.light }}
						/>
					)}
				</motion.div>
				<Typography
					sx={{
						fontFamily: tokens.fontMono,
						fontSize: "0.8rem",
						color: "text.secondary",
						textAlign: "center",
						marginTop: "14px",
						letterSpacing: "0.02em",
					}}
				>
					{heroLabel} <Box component="span" sx={{ color: alpha(palette.text.secondary, 0.6) }}>· the Italian Game</Box>
				</Typography>
			</Box>
		</Box>
	);
};

export default Home;
