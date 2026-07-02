import React from "react";
import { Box, Typography } from "@mui/material";
import { useAppSelector } from "../app-state/hooks";

const RequireAuth = ({ children }: { children: JSX.Element }) => {
	const user = useAppSelector((state) => state.userPreference.user);

	if (!user) {
		return (
			<Box sx={{ padding: "60px 40px", maxWidth: "600px" }}>
				<Typography variant="h4" sx={{ marginBottom: "16px" }}>
					Login required
				</Typography>
				<Typography sx={{ fontSize: "18px", opacity: 0.8 }}>
					You need an account to use this page — online games are rated and saved
					to your profile. Use the Login button in the top-right corner to sign
					in or create an account. No account is needed to play against the
					computer.
				</Typography>
			</Box>
		);
	}

	return children;
};

export default RequireAuth;
