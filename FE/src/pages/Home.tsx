import React from "react";
import { Box, Button, Chip, Typography } from "@mui/material";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { Chessboard } from "react-chessboard";
import { fadeUp, staggerContainer } from "../ui/motion";
import { tokens } from "../theme";

const Home = () => {
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
							background: "rgba(16,185,129,0.08)",
							border: "1px solid rgba(16,185,129,0.25)",
							color: "primary.light",
							fontWeight: 600,
						}}
					/>
				</motion.div>
				<motion.div variants={fadeUp}>
					<Typography variant="h1" sx={{ marginBottom: "20px" }}>
						Play chess,{" "}
						<Box
							component="span"
							sx={{
								background: "linear-gradient(90deg, #34D399, #10B981)",
								backgroundClip: "text",
								WebkitBackgroundClip: "text",
								WebkitTextFillColor: "transparent",
							}}
						>
							beautifully
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
						sharpen your game against Stockfish. Rated games, live clocks, and a
						global leaderboard.
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

			<Box sx={{ display: { xs: "none", md: "block" }, justifySelf: "center" }}>
				<motion.div
					initial={{ opacity: 0, y: 24, rotate: 2 }}
					animate={{ opacity: 1, y: [0, -8, 0], rotate: 2 }}
					transition={{
						opacity: { duration: 0.6 },
						y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
					}}
					style={{
						borderRadius: 16,
						overflow: "hidden",
						border: "1px solid rgba(255,255,255,0.1)",
						boxShadow: tokens.glowSoft,
						pointerEvents: "none",
					}}
				>
					<Chessboard
						boardWidth={380}
						position="r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3"
						arePiecesDraggable={false}
						customDarkSquareStyle={{ backgroundColor: tokens.board.dark }}
						customLightSquareStyle={{ backgroundColor: tokens.board.light }}
					/>
				</motion.div>
			</Box>
		</Box>
	);
};

export default Home;
