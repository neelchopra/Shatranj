import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { NavLink } from "react-router-dom";

const Home = () => {
	return (
		<Box sx={{ padding: "80px 60px", maxWidth: "900px" }}>
			<Typography variant="h2" sx={{ fontWeight: 700, marginBottom: "16px" }}>
				Shatranj
			</Typography>
			<Typography sx={{ fontSize: "22px", opacity: 0.85, marginBottom: "40px" }}>
				Play chess online — challenge a random opponent, invite a friend with a
				room code, or sharpen your game against Stockfish. Rated games, live
				clocks, and a global leaderboard.
			</Typography>
			<Box sx={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
				<NavLink to="/play/online" style={{ textDecoration: "none" }}>
					<Button color="secondary" variant="contained" sx={{ fontSize: "18px", padding: "12px 32px" }}>
						Play Online
					</Button>
				</NavLink>
				<NavLink to="/play/computer" style={{ textDecoration: "none" }}>
					<Button color="secondary" variant="outlined" sx={{ fontSize: "18px", padding: "12px 32px" }}>
						Play the Computer
					</Button>
				</NavLink>
			</Box>
		</Box>
	);
};

export default Home;
