import { Box, styled } from "@mui/material";
import { tokens } from "../theme";

/**
 * Frosted-glass panel. Set `hover` for interactive cards (lift + border glow).
 */
const GlassCard = styled(Box, {
	shouldForwardProp: (prop) => prop !== "hover",
})<{ hover?: boolean }>(({ hover }) => ({
	background: tokens.glass.background,
	border: tokens.glass.border,
	backdropFilter: tokens.glass.blur,
	WebkitBackdropFilter: tokens.glass.blur,
	borderRadius: tokens.radius.lg,
	transition: "transform .25s ease, border-color .25s ease, box-shadow .25s ease",
	...(hover && {
		cursor: "pointer",
		"&:hover": {
			transform: "translateY(-6px)",
			borderColor: "rgba(16,185,129,0.45)",
			boxShadow: tokens.glowAccent,
		},
	}),
}));

export default GlassCard;
