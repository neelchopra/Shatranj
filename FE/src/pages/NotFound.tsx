import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { NavLink } from "react-router-dom";
import GlassCard from "../ui/GlassCard";

const NotFound = () => (
	<Box sx={{ display: "flex", justifyContent: "center", paddingTop: "10vh" }}>
		<GlassCard sx={{ padding: "48px", textAlign: "center", maxWidth: 440 }}>
			<Typography variant="h1" sx={{ marginBottom: "8px" }}>
				404
			</Typography>
			<Typography sx={{ color: "text.secondary", marginBottom: "24px" }}>
				This square is off the board.
			</Typography>
			<NavLink to="/" style={{ textDecoration: "none" }}>
				<Button variant="contained">Back home</Button>
			</NavLink>
		</GlassCard>
	</Box>
);

export default NotFound;
