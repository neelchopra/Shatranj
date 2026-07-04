import { createTheme } from "@mui/material";
import type { Theme, ThemeOptions } from "@mui/material/styles";

export type ThemeName = "emerald" | "rosewood" | "marble" | "slate";

export type Tokens = {
	glass: { background: string; border: string; blur: string };
	glassStrong: { background: string; border: string; blur: string };
	glowAccent: string;
	glowSoft: string;
	radius: { sm: number; md: number; lg: number };
	fontDisplay: string;
	fontBody: string;
	/** Notation & data readouts (SAN, PGN, ratings) — a distinct "instrument" face, never used for prose. */
	fontMono: string;
	/** Bare "r,g,b" triplet for the current theme's accent — for one-off rgba() usage outside the palette. */
	accentRgb: string;
	board: { light: string; dark: string; hintMove: string; hintCapture: string };
	inputBackground: string;
	inputBackgroundHover: string;
	inputBorder: string;
};

declare module "@mui/material/styles" {
	interface Theme {
		tokens: Tokens;
		name: ThemeName;
	}
	interface ThemeOptions {
		tokens?: Tokens;
		name?: ThemeName;
	}
}

const fontDisplay = "'Space Grotesk', 'Inter', sans-serif";
const fontBody = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const fontMono = "'IBM Plex Mono', 'Space Grotesk', monospace";
const radius = { sm: 8, md: 14, lg: 20 };

type ThemeDef = {
	label: string;
	/** Small preview dots for the theme switcher: [background, accent, board dark, board light]. */
	swatch: [string, string, string, string];
	palette: ThemeOptions["palette"];
	accentRgb: string;
	board: { light: string; dark: string; hintRgb: string };
	glass: { background: string; border: string };
	glassStrong: { background: string; border: string };
	glowSoft: string;
	bodyBackground: string;
	selectionBg: string;
	scrollbarThumb: string;
	scrollbarThumbHover: string;
	inputBackground: string;
	inputBackgroundHover: string;
	inputBorder: string;
	backdrop: string;
};

const THEME_DEFS: Record<ThemeName, ThemeDef> = {
	// Dark glass + emerald glow, with a pine/parchment board tuned as a dark
	// cousin of the accent — the board and the UI read as one designed object
	// instead of a generic neutral board skin bolted onto a SaaS theme.
	emerald: {
		label: "Emerald",
		swatch: ["#0B0D12", "#10B981", "#2F5239", "#E9E4D2"],
		accentRgb: "16,185,129",
		palette: {
			mode: "dark",
			background: { default: "#0B0D12", paper: "#12151C" },
			primary: { main: "#10B981", light: "#34D399", dark: "#059669", contrastText: "#052E1F" },
			secondary: { main: "#94A3B8", light: "#CBD5E1", dark: "#64748B", contrastText: "#0B0D12" },
			success: { main: "#34D399" },
			error: { main: "#F87171" },
			warning: { main: "#FBBF24" },
			text: { primary: "#F1F5F9", secondary: "#94A3B8" },
			divider: "rgba(148,163,184,0.12)",
		},
		// Dark square lightened a step from the first pass — it was reading
		// closer to black than green at a glance.
		board: { light: "#E9E4D2", dark: "#2F5239", hintRgb: "230,168,68" },
		glass: { background: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.08)" },
		glassStrong: { background: "rgba(18,21,28,0.75)", border: "rgba(255,255,255,0.10)" },
		glowSoft: "0 8px 32px rgba(0,0,0,0.45)",
		bodyBackground:
			"radial-gradient(ellipse 80% 50% at 20% -10%, rgba(16,185,129,0.13), transparent), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(59,130,246,0.07), transparent), #0B0D12",
		selectionBg: "rgba(16,185,129,0.3)",
		scrollbarThumb: "rgba(148,163,184,0.25)",
		scrollbarThumbHover: "rgba(16,185,129,0.5)",
		inputBackground: "rgba(255,255,255,0.05)",
		inputBackgroundHover: "rgba(255,255,255,0.07)",
		inputBorder: "rgba(255,255,255,0.08)",
		backdrop: "rgba(5,7,10,0.7)",
	},
	// Warm copper on near-black, with a walnut/boxwood board — a classic
	// wooden tournament-set feel rather than another green-on-black app.
	rosewood: {
		label: "Rosewood",
		swatch: ["#150F0C", "#E08A3C", "#4A2E1E", "#E8D9B8"],
		accentRgb: "224,138,60",
		palette: {
			mode: "dark",
			background: { default: "#150F0C", paper: "#1D1512" },
			primary: { main: "#E08A3C", light: "#F0A868", dark: "#B4691F", contrastText: "#2B1400" },
			secondary: { main: "#A6968A", light: "#CBBFB4", dark: "#7A6C61", contrastText: "#150F0C" },
			success: { main: "#3FBFA0" },
			error: { main: "#F2735C" },
			warning: { main: "#F0C05A" },
			text: { primary: "#F5EFE6", secondary: "#B9A99A" },
			divider: "rgba(224,138,60,0.14)",
		},
		board: { light: "#E8D9B8", dark: "#4A2E1E", hintRgb: "63,191,160" },
		glass: { background: "rgba(255,255,255,0.045)", border: "rgba(255,255,255,0.09)" },
		glassStrong: { background: "rgba(29,21,18,0.78)", border: "rgba(255,255,255,0.10)" },
		glowSoft: "0 8px 32px rgba(0,0,0,0.5)",
		bodyBackground:
			"radial-gradient(ellipse 80% 50% at 15% -10%, rgba(224,138,60,0.14), transparent), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(63,191,160,0.08), transparent), #150F0C",
		selectionBg: "rgba(224,138,60,0.3)",
		scrollbarThumb: "rgba(185,169,154,0.25)",
		scrollbarThumbHover: "rgba(224,138,60,0.5)",
		inputBackground: "rgba(255,255,255,0.05)",
		inputBackgroundHover: "rgba(255,255,255,0.07)",
		inputBorder: "rgba(255,255,255,0.08)",
		backdrop: "rgba(9,6,4,0.7)",
	},
	// The only light theme — warm stone and marble, deep teal accent. Useful
	// for bright rooms/daytime and gives the app a genuine second mode
	// instead of just a recolored dark shell.
	marble: {
		label: "Marble Hall",
		swatch: ["#F3F1EC", "#1F6F5C", "#6B7280", "#EDEAE2"],
		accentRgb: "31,111,92",
		palette: {
			mode: "light",
			background: { default: "#F3F1EC", paper: "#FFFFFF" },
			primary: { main: "#1F6F5C", light: "#2E8C74", dark: "#14504A", contrastText: "#FFFFFF" },
			secondary: { main: "#8A8377", light: "#ABA599", dark: "#6B655B", contrastText: "#FFFFFF" },
			success: { main: "#1F6F5C" },
			error: { main: "#C1443A" },
			warning: { main: "#B4841F" },
			text: { primary: "#1B1F1D", secondary: "#5B5650" },
			divider: "rgba(27,31,29,0.10)",
		},
		board: { light: "#EDEAE2", dark: "#6B7280", hintRgb: "200,155,60" },
		glass: { background: "rgba(27,31,29,0.035)", border: "rgba(27,31,29,0.09)" },
		glassStrong: { background: "rgba(255,255,255,0.82)", border: "rgba(27,31,29,0.08)" },
		glowSoft: "0 8px 32px rgba(27,31,29,0.12)",
		bodyBackground:
			"radial-gradient(ellipse 80% 50% at 20% -10%, rgba(31,111,92,0.08), transparent), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(180,132,31,0.06), transparent), #F3F1EC",
		selectionBg: "rgba(31,111,92,0.18)",
		scrollbarThumb: "rgba(27,31,29,0.18)",
		scrollbarThumbHover: "rgba(31,111,92,0.4)",
		inputBackground: "rgba(27,31,29,0.035)",
		inputBackgroundHover: "rgba(27,31,29,0.055)",
		inputBorder: "rgba(27,31,29,0.10)",
		backdrop: "rgba(27,31,29,0.35)",
	},
	// The original neutral slate/periwinkle board, given an accent that
	// actually belongs to it — a clear azure instead of the mismatched
	// emerald the site used to pair it with.
	slate: {
		label: "Slate",
		swatch: ["#0A0F1A", "#4C7CF0", "#5B6B8C", "#CBD5E8"],
		accentRgb: "76,124,240",
		palette: {
			mode: "dark",
			background: { default: "#0A0F1A", paper: "#111827" },
			primary: { main: "#4C7CF0", light: "#7CA0FF", dark: "#2F5BC7", contrastText: "#06122E" },
			secondary: { main: "#94A3B8", light: "#CBD5E1", dark: "#64748B", contrastText: "#0A0F1A" },
			success: { main: "#34D399" },
			error: { main: "#F87171" },
			warning: { main: "#FBBF24" },
			text: { primary: "#EAF0FB", secondary: "#94A3B8" },
			divider: "rgba(148,163,184,0.14)",
		},
		board: { light: "#CBD5E8", dark: "#5B6B8C", hintRgb: "230,168,68" },
		glass: { background: "rgba(255,255,255,0.045)", border: "rgba(255,255,255,0.09)" },
		glassStrong: { background: "rgba(15,20,32,0.75)", border: "rgba(255,255,255,0.10)" },
		glowSoft: "0 8px 32px rgba(0,0,0,0.45)",
		bodyBackground:
			"radial-gradient(ellipse 80% 50% at 20% -10%, rgba(76,124,240,0.15), transparent), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(148,163,184,0.07), transparent), #0A0F1A",
		selectionBg: "rgba(76,124,240,0.3)",
		scrollbarThumb: "rgba(148,163,184,0.25)",
		scrollbarThumbHover: "rgba(76,124,240,0.5)",
		inputBackground: "rgba(255,255,255,0.05)",
		inputBackgroundHover: "rgba(255,255,255,0.07)",
		inputBorder: "rgba(255,255,255,0.08)",
		backdrop: "rgba(4,7,14,0.7)",
	},
};

export const THEME_LIST: { name: ThemeName; label: string; swatch: [string, string, string, string] }[] = (
	Object.keys(THEME_DEFS) as ThemeName[]
).map((name) => ({ name, label: THEME_DEFS[name].label, swatch: THEME_DEFS[name].swatch }));

export const buildTheme = (name: ThemeName): Theme => {
	const def = THEME_DEFS[name];
	const glowAccent = `0 0 0 1px rgba(${def.accentRgb},0.35), 0 0 24px rgba(${def.accentRgb},0.25)`;

	const tokens: Tokens = {
		glass: { background: def.glass.background, border: `1px solid ${def.glass.border}`, blur: "blur(16px)" },
		glassStrong: {
			background: def.glassStrong.background,
			border: `1px solid ${def.glassStrong.border}`,
			blur: "blur(24px)",
		},
		glowAccent,
		glowSoft: def.glowSoft,
		radius,
		fontDisplay,
		fontBody,
		fontMono,
		accentRgb: def.accentRgb,
		board: {
			light: def.board.light,
			dark: def.board.dark,
			hintMove: `radial-gradient(closest-side, rgba(${def.board.hintRgb},0.7) 30%, transparent 40%)`,
			hintCapture: `radial-gradient(closest-side, rgba(${def.board.hintRgb},0.7) 80%, transparent 40%)`,
		},
		inputBackground: def.inputBackground,
		inputBackgroundHover: def.inputBackgroundHover,
		inputBorder: def.inputBorder,
	};

	return createTheme({
		name,
		tokens,
		palette: def.palette,
		shape: { borderRadius: 12 },
		typography: {
			fontFamily: fontBody,
			h1: {
				fontFamily: fontDisplay,
				fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
				fontWeight: 700,
				letterSpacing: "-0.02em",
				lineHeight: 1.1,
			},
			h2: { fontFamily: fontDisplay, fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.01em" },
			h3: { fontFamily: fontDisplay, fontSize: "1.25rem", fontWeight: 600 },
			h4: { fontFamily: fontDisplay, fontSize: "1.1rem", fontWeight: 600 },
			h5: { fontFamily: fontDisplay, fontSize: "1rem", fontWeight: 600 },
			h6: { fontFamily: fontDisplay, fontSize: "0.9rem", fontWeight: 600 },
			subtitle1: { fontSize: "1rem", fontWeight: 500, color: def.palette?.text?.secondary as string },
			subtitle2: { fontSize: "0.875rem", fontWeight: 600 },
			body1: { fontSize: "1rem" },
			body2: { fontSize: "0.875rem" },
			button: { textTransform: "none", fontWeight: 600 },
		},
		components: {
			MuiCssBaseline: {
				styleOverrides: {
					// A single overflowing element (e.g. a cramped toolbar) can otherwise
					// widen the whole page on mobile and make it feel scroll-locked.
					html: { overflowX: "hidden" },
					body: {
						background: def.bodyBackground,
						backgroundAttachment: "fixed",
						minHeight: "100vh",
						overflowX: "hidden",
					},
					"::selection": { background: def.selectionBg },
					a: { color: "inherit", textDecoration: "none" },
					"*::-webkit-scrollbar": { width: "8px", height: "8px" },
					"*::-webkit-scrollbar-track": { background: "transparent" },
					"*::-webkit-scrollbar-thumb": { background: def.scrollbarThumb, borderRadius: "100px" },
					"*::-webkit-scrollbar-thumb:hover": { background: def.scrollbarThumbHover },
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
						"&:hover": { boxShadow: glowAccent, transform: "translateY(-1px)" },
					},
					outlined: {
						borderColor: def.inputBorder,
						"&:hover": {
							borderColor: `rgba(${def.accentRgb},0.5)`,
							backgroundColor: `rgba(${def.accentRgb},0.06)`,
						},
					},
				},
			},
			MuiPaper: {
				styleOverrides: { root: { backgroundImage: "none" } },
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
					root: { backgroundColor: def.backdrop, backdropFilter: "blur(4px)" },
					invisible: { backgroundColor: "transparent", backdropFilter: "none" },
				},
			},
			MuiFilledInput: {
				styleOverrides: {
					root: {
						borderRadius: 10,
						backgroundColor: def.inputBackground,
						border: `1px solid ${def.inputBorder}`,
						transition: "box-shadow .2s ease, border-color .2s ease",
						"&:hover": { backgroundColor: def.inputBackgroundHover },
						"&.Mui-focused": {
							backgroundColor: def.inputBackgroundHover,
							boxShadow: `0 0 0 2px rgba(${def.accentRgb},0.4)`,
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
						color: def.palette?.text?.primary as string,
						borderRadius: tokens.radius.md,
					},
				},
			},
			MuiAvatar: {
				styleOverrides: { root: { border: `1px solid ${def.inputBorder}` } },
			},
			MuiTableCell: {
				styleOverrides: { root: { borderBottom: `1px solid ${def.palette?.divider}` } },
			},
		},
	});
};

export const DEFAULT_THEME_NAME: ThemeName = "emerald";

/** Static default — most components read tokens reactively via useTheme(); this covers any leftover static import. */
export const tokens = buildTheme(DEFAULT_THEME_NAME).tokens;

const theme = buildTheme(DEFAULT_THEME_NAME);
export default theme;
