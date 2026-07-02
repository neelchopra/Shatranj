import { createTheme } from "@mui/material";

/**
 * Shatranj design system — dark glass + emerald glow.
 * Glass/glow tokens are exported for use in styled() blocks and sx props.
 */
export const tokens = {
	glass: {
		background: "rgba(255,255,255,0.04)",
		border: "1px solid rgba(255,255,255,0.08)",
		blur: "blur(16px)",
	},
	glassStrong: {
		background: "rgba(18,21,28,0.75)",
		border: "1px solid rgba(255,255,255,0.10)",
		blur: "blur(24px)",
	},
	glowAccent: "0 0 0 1px rgba(16,185,129,0.35), 0 0 24px rgba(16,185,129,0.25)",
	glowSoft: "0 8px 32px rgba(0,0,0,0.45)",
	radius: { sm: 8, md: 14, lg: 20 },
	fontDisplay: "'Space Grotesk', 'Inter', sans-serif",
	fontBody: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
	board: {
		light: "#CBD5E8",
		dark: "#5B6B8C",
		hintMove: "radial-gradient(closest-side, rgba(16,185,129,0.65) 30%, transparent 40%)",
		hintCapture: "radial-gradient(closest-side, rgba(16,185,129,0.65) 80%, transparent 40%)",
	},
};

const theme = createTheme({
	palette: {
		mode: "dark",
		background: {
			default: "#0B0D12",
			paper: "#12151C",
		},
		primary: {
			main: "#10B981",
			light: "#34D399",
			dark: "#059669",
			contrastText: "#052E1F",
		},
		secondary: {
			main: "#94A3B8",
			light: "#CBD5E1",
			dark: "#64748B",
			contrastText: "#0B0D12",
		},
		success: { main: "#34D399" },
		error: { main: "#F87171" },
		warning: { main: "#FBBF24" },
		text: {
			primary: "#F1F5F9",
			secondary: "#94A3B8",
		},
		divider: "rgba(148,163,184,0.12)",
	},
	shape: { borderRadius: 12 },
	typography: {
		fontFamily: tokens.fontBody,
		h1: {
			fontFamily: tokens.fontDisplay,
			fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
			fontWeight: 700,
			letterSpacing: "-0.02em",
			lineHeight: 1.1,
		},
		h2: {
			fontFamily: tokens.fontDisplay,
			fontSize: "1.75rem",
			fontWeight: 700,
			letterSpacing: "-0.01em",
		},
		h3: {
			fontFamily: tokens.fontDisplay,
			fontSize: "1.25rem",
			fontWeight: 600,
		},
		h4: {
			fontFamily: tokens.fontDisplay,
			fontSize: "1.1rem",
			fontWeight: 600,
		},
		h5: { fontFamily: tokens.fontDisplay, fontSize: "1rem", fontWeight: 600 },
		h6: { fontFamily: tokens.fontDisplay, fontSize: "0.9rem", fontWeight: 600 },
		subtitle1: { fontSize: "1rem", fontWeight: 500, color: "#94A3B8" },
		subtitle2: { fontSize: "0.875rem", fontWeight: 600 },
		body1: { fontSize: "1rem" },
		body2: { fontSize: "0.875rem" },
		button: { textTransform: "none", fontWeight: 600 },
	},
	components: {
		MuiCssBaseline: {
			styleOverrides: {
				body: {
					background:
						"radial-gradient(ellipse 80% 50% at 20% -10%, rgba(16,185,129,0.13), transparent), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(59,130,246,0.07), transparent), #0B0D12",
					backgroundAttachment: "fixed",
					minHeight: "100vh",
				},
				"::selection": {
					background: "rgba(16,185,129,0.3)",
				},
				a: {
					color: "inherit",
					textDecoration: "none",
				},
				"*::-webkit-scrollbar": { width: "8px", height: "8px" },
				"*::-webkit-scrollbar-track": { background: "transparent" },
				"*::-webkit-scrollbar-thumb": {
					background: "rgba(148,163,184,0.25)",
					borderRadius: "100px",
				},
				"*::-webkit-scrollbar-thumb:hover": {
					background: "rgba(16,185,129,0.5)",
				},
			},
		},
		MuiButton: {
			styleOverrides: {
				root: {
					borderRadius: 10,
					fontWeight: 600,
					transition: "box-shadow .2s ease, transform .15s ease, background-color .2s ease",
				},
				containedPrimary: {
					"&:hover": {
						boxShadow: tokens.glowAccent,
						transform: "translateY(-1px)",
					},
				},
				outlined: {
					borderColor: "rgba(255,255,255,0.16)",
					"&:hover": {
						borderColor: "rgba(16,185,129,0.5)",
						backgroundColor: "rgba(16,185,129,0.06)",
					},
				},
			},
		},
		MuiPaper: {
			styleOverrides: {
				root: {
					backgroundImage: "none",
				},
			},
		},
		MuiDialog: {
			styleOverrides: {
				paper: {
					background: tokens.glassStrong.background,
					backdropFilter: tokens.glassStrong.blur,
					border: tokens.glassStrong.border,
					borderRadius: tokens.radius.lg,
					boxShadow: tokens.glowSoft,
				},
			},
		},
		MuiBackdrop: {
			styleOverrides: {
				root: {
					backgroundColor: "rgba(5,7,10,0.7)",
					backdropFilter: "blur(4px)",
				},
				invisible: {
					backgroundColor: "transparent",
					backdropFilter: "none",
				},
			},
		},
		MuiFilledInput: {
			styleOverrides: {
				root: {
					borderRadius: 10,
					backgroundColor: "rgba(255,255,255,0.05)",
					border: "1px solid rgba(255,255,255,0.08)",
					transition: "box-shadow .2s ease, border-color .2s ease",
					"&:hover": { backgroundColor: "rgba(255,255,255,0.07)" },
					"&.Mui-focused": {
						backgroundColor: "rgba(255,255,255,0.06)",
						boxShadow: "0 0 0 2px rgba(16,185,129,0.4)",
					},
					"&::before, &::after": { display: "none" },
				},
			},
		},
		MuiSnackbarContent: {
			styleOverrides: {
				root: {
					background: tokens.glassStrong.background,
					backdropFilter: tokens.glassStrong.blur,
					border: tokens.glassStrong.border,
					color: "#F1F5F9",
					borderRadius: tokens.radius.md,
				},
			},
		},
		MuiAvatar: {
			styleOverrides: {
				root: {
					border: "1px solid rgba(255,255,255,0.12)",
				},
			},
		},
		MuiTableCell: {
			styleOverrides: {
				root: {
					borderBottom: "1px solid rgba(148,163,184,0.12)",
				},
			},
		},
	},
});

export default theme;
