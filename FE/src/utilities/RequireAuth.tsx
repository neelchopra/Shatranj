import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { motion } from "framer-motion";
import { useAppSelector } from "../app-state/hooks";
import GlassCard from "../ui/GlassCard";
import { fadeUp } from "../ui/motion";

const RequireAuth = ({ children }: { children: JSX.Element }) => {
	const { tokens } = useTheme();
	const user = useAppSelector((state) => state.userPreference.user);

	if (!user) {
		return (
			<motion.div variants={fadeUp} initial="initial" animate="animate">
				<Box sx={{ display: "flex", justifyContent: "center", paddingTop: "8vh" }}>
					<GlassCard sx={{ padding: "48px", maxWidth: 480, textAlign: "center" }}>
						<Box
							sx={{
								width: 64,
								height: 64,
								borderRadius: "50%",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								background: `rgba(${tokens.accentRgb},0.12)`,
								color: "primary.light",
								margin: "0 auto 20px auto",
							}}
						>
							<LockOutlinedIcon sx={{ fontSize: 30 }} />
						</Box>
						<Typography variant="h3" sx={{ marginBottom: "12px" }}>
							Login required
						</Typography>
						<Typography sx={{ color: "text.secondary", lineHeight: 1.7 }}>
							You need an account to use this page. Online games are rated and
							saved to your profile. Use the Login button in the top-right corner
							to sign in or create an account. No account is needed to play
							against the computer.
						</Typography>
					</GlassCard>
				</Box>
			</motion.div>
		);
	}

	return children;
};

export default RequireAuth;
