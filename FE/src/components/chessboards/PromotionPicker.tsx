import React from "react";
import { Dialog, Box, IconButton, Typography, useTheme } from "@mui/material";
import { PromotionPiece } from "../../utilities/promotion";

type Props = {
	open: boolean;
	color: "w" | "b";
	onSelect: (piece: PromotionPiece) => void;
	onCancel: () => void;
};

const GLYPHS: Record<"w" | "b", Record<PromotionPiece, string>> = {
	w: { q: "♕", r: "♖", b: "♗", n: "♘" },
	b: { q: "♛", r: "♜", b: "♝", n: "♞" },
};

const PIECES: PromotionPiece[] = ["q", "r", "b", "n"];

/**
 * Click-to-move never had a piece choice — it silently promoted to queen.
 * Drag already gets one for free from react-chessboard's own dialog; this
 * covers the click path so under-promotion (a puzzle or game position that
 * specifically needs a knight/rook/bishop) is actually reachable by click.
 */
const PromotionPicker = ({ open, color, onSelect, onCancel }: Props) => {
	const { tokens } = useTheme();
	return (
		<Dialog
			open={open}
			onClose={onCancel}
			PaperProps={{
				sx: {
					background: tokens.glassStrong.background,
					backdropFilter: tokens.glassStrong.blur,
					border: tokens.glassStrong.border,
					borderRadius: `${tokens.radius.lg}px`,
					boxShadow: tokens.glowSoft,
				},
			}}
		>
			<Box sx={{ padding: "28px", textAlign: "center" }}>
				<Typography sx={{ fontWeight: 600, marginBottom: "18px" }}>Promote to</Typography>
				<Box sx={{ display: "flex", gap: "10px" }}>
					{PIECES.map((piece) => (
						<IconButton
							key={piece}
							onClick={() => onSelect(piece)}
							sx={{
								fontSize: "2.2rem",
								width: 64,
								height: 64,
								borderRadius: "12px",
								border: tokens.glass.border,
								fontFamily: tokens.fontDisplay,
								color: "text.primary",
								"&:hover": { background: `rgba(${tokens.accentRgb},0.12)`, borderColor: `rgba(${tokens.accentRgb},0.4)` },
							}}
						>
							{GLYPHS[color][piece]}
						</IconButton>
					))}
				</Box>
			</Box>
		</Dialog>
	);
};

export default PromotionPicker;
