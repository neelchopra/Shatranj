import React, { useState } from "react";
import { Chessboard } from "react-chessboard";
import { Box, IconButton, Typography } from "@mui/material";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import { tokens } from "../../theme";
import { Ply } from "../../utilities/pgnPlies";

type Props = {
	plies: Ply[];
	boardWidth: number;
	orientation: "white" | "black";
};

/** Read-only step-through board — Back/Forward through a fixed move list, no engine. */
const ReviewBoard = ({ plies, boardWidth, orientation }: Props) => {
	const [index, setIndex] = useState(plies.length); // start at the final position

	if (plies.length === 0) return null;
	const position = index === 0 ? plies[0].before : plies[index - 1].after;

	return (
		<Box>
			<Chessboard
				position={position}
				arePiecesDraggable={false}
				boardWidth={boardWidth}
				boardOrientation={orientation}
				customDarkSquareStyle={{ backgroundColor: tokens.board.dark }}
				customLightSquareStyle={{ backgroundColor: tokens.board.light }}
			/>
			<Box sx={{ display: "flex", justifyContent: "center", gap: "4px", marginTop: "12px" }}>
				<IconButton size="small" onClick={() => setIndex(0)} disabled={index === 0}>
					<SkipPreviousIcon />
				</IconButton>
				<IconButton size="small" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
					<NavigateBeforeIcon />
				</IconButton>
				<IconButton size="small" onClick={() => setIndex((i) => Math.min(plies.length, i + 1))} disabled={index === plies.length}>
					<NavigateNextIcon />
				</IconButton>
				<IconButton size="small" onClick={() => setIndex(plies.length)} disabled={index === plies.length}>
					<SkipNextIcon />
				</IconButton>
			</Box>
			<Typography sx={{ textAlign: "center", color: "text.secondary", marginTop: "6px", fontSize: "0.85rem" }}>
				{index === 0 ? "Starting position" : `${index}. ${plies[index - 1].san}`}
			</Typography>
		</Box>
	);
};

export default ReviewBoard;
