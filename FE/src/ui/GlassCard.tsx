import { Box, styled } from "@mui/material";

/**
 * Frosted-glass panel. Set `hover` for interactive cards (lift + border glow).
 */
const GlassCard = styled(Box, {
	shouldForwardProp: (prop) => prop !== "hover",
})<{ hover?: boolean }>(({ theme, hover }) => ({
	background: theme.tokens.glass.background,
	border: theme.tokens.glass.border,
	backdropFilter: theme.tokens.glass.blur,
	WebkitBackdropFilter: theme.tokens.glass.blur,
	borderRadius: theme.tokens.radius.lg,
	transition: "transform .25s ease, border-color .25s ease, box-shadow .25s ease",
	...(hover && {
		cursor: "pointer",
		"&:hover": {
			transform: "translateY(-6px)",
			borderColor: `rgba(${theme.tokens.accentRgb},0.45)`,
			boxShadow: theme.tokens.glowAccent,
		},
	}),
}));

export default GlassCard;
