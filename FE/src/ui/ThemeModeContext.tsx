import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { buildTheme, DEFAULT_THEME_NAME, ThemeName } from "../theme";

const STORAGE_KEY = "shatranj-theme";

const isThemeName = (value: string | null): value is ThemeName =>
	value === "emerald" || value === "rosewood" || value === "marble";

const getStoredThemeName = (): ThemeName => {
	const stored = localStorage.getItem(STORAGE_KEY);
	return isThemeName(stored) ? stored : DEFAULT_THEME_NAME;
};

type ThemeModeContextValue = { name: ThemeName; setName: (name: ThemeName) => void };

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

/** Current theme name + setter — for the switcher UI. Board/glass colors flow through MUI's theme instead. */
export const useThemeMode = (): ThemeModeContextValue => {
	const ctx = useContext(ThemeModeContext);
	if (!ctx) throw new Error("useThemeMode must be used within ThemeModeProvider");
	return ctx;
};

/** Wraps the app in ThemeProvider, rebuilding the MUI theme whenever the chosen theme name changes. */
const ThemeModeProvider = ({ children }: { children: React.ReactNode }) => {
	const [name, setNameState] = useState<ThemeName>(getStoredThemeName);

	const setName = useCallback((next: ThemeName) => {
		localStorage.setItem(STORAGE_KEY, next);
		setNameState(next);
	}, []);

	const theme = useMemo(() => buildTheme(name), [name]);
	const contextValue = useMemo(() => ({ name, setName }), [name, setName]);

	return (
		<ThemeModeContext.Provider value={contextValue}>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				{children}
			</ThemeProvider>
		</ThemeModeContext.Provider>
	);
};

export default ThemeModeProvider;
