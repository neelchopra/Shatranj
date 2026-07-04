import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { motion } from "framer-motion";

type Option<T> = { label: string; value: T };

type Props<T> = {
	options: Option<T>[];
	value: T;
	onChange: (value: T) => void;
	/** Unique per control on a page so the sliding pills don't collide. */
	layoutId?: string;
};

/**
 * Pill group with a sliding active indicator.
 */
function SegmentedControl<T extends string | number>({
	options,
	value,
	onChange,
	layoutId = "segmented-pill",
}: Props<T>) {
	const { tokens } = useTheme();
	return (
		<Box
			sx={{
				display: "inline-flex",
				gap: "4px",
				padding: "4px",
				borderRadius: "12px",
				background: tokens.glass.background,
				border: tokens.glass.border,
			}}
		>
			{options.map((option) => {
				const active = option.value === value;
				return (
					<Box
						key={String(option.value)}
						onClick={() => onChange(option.value)}
						sx={{
							position: "relative",
							padding: "8px 20px",
							borderRadius: "9px",
							cursor: "pointer",
							userSelect: "none",
						}}
					>
						{active && (
							<motion.div
								layoutId={layoutId}
								transition={{ type: "spring", stiffness: 400, damping: 32 }}
								style={{
									position: "absolute",
									inset: 0,
									borderRadius: 9,
									background: `rgba(${tokens.accentRgb},0.16)`,
									border: `1px solid rgba(${tokens.accentRgb},0.4)`,
									boxShadow: tokens.glowAccent,
								}}
							/>
						)}
						<Typography
							sx={{
								position: "relative",
								fontWeight: 600,
								fontSize: "0.95rem",
								color: active ? "primary.light" : "text.secondary",
								transition: "color .2s ease",
							}}
						>
							{option.label}
						</Typography>
					</Box>
				);
			})}
		</Box>
	);
}

export default SegmentedControl;
