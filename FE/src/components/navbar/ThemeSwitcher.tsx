import React, { useState } from "react";
import { Box, IconButton, Menu, MenuItem, Typography, useTheme } from "@mui/material";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import CheckIcon from "@mui/icons-material/Check";
import { THEME_LIST } from "../../theme";
import { useThemeMode } from "../../ui/ThemeModeContext";

/** A small swatch strip previewing a theme's background/accent/board colors. */
const Swatch = ({ colors }: { colors: [string, string, string, string] }) => (
	<Box sx={{ display: "flex", width: 44, height: 20, borderRadius: "6px", overflow: "hidden", flexShrink: 0 }}>
		{colors.map((color, i) => (
			<Box key={i} sx={{ flex: 1, background: color }} />
		))}
	</Box>
);

const ThemeSwitcher = () => {
	const { tokens } = useTheme();
	const { name, setName } = useThemeMode();
	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

	return (
		<>
			<IconButton
				onClick={(e) => setAnchorEl(e.currentTarget)}
				aria-label="Change theme"
				sx={{ marginRight: "4px" }}
			>
				<PaletteOutlinedIcon />
			</IconButton>
			<Menu
				anchorEl={anchorEl}
				open={!!anchorEl}
				onClose={() => setAnchorEl(null)}
				PaperProps={{
					sx: {
						background: tokens.glassStrong.background,
						backdropFilter: tokens.glassStrong.blur,
						border: tokens.glassStrong.border,
						boxShadow: tokens.glowSoft,
						minWidth: 220,
					},
				}}
			>
				{THEME_LIST.map((option) => (
					<MenuItem
						key={option.name}
						selected={option.name === name}
						onClick={() => {
							setName(option.name);
							setAnchorEl(null);
						}}
						sx={{ gap: "12px", padding: "10px 16px" }}
					>
						<Swatch colors={option.swatch} />
						<Typography sx={{ flexGrow: 1, fontWeight: 600, fontSize: "0.9rem" }}>{option.label}</Typography>
						{option.name === name && <CheckIcon sx={{ fontSize: 18, color: "primary.light" }} />}
					</MenuItem>
				))}
			</Menu>
		</>
	);
};

export default ThemeSwitcher;
