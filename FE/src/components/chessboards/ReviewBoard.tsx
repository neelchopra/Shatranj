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

/**
 * Below-board Back/Forward row. Exported so callers that show the board
 * before ReviewBoard mounts (e.g. Puzzles.tsx) can render this same
 * component in `placeholder` mode to reserve the exact same height —
 * matching a hardcoded pixel value drifts out of sync the moment this
 * markup changes and causes a visible layout shift when ReviewBoard appears.
 */
export const ReviewControls = ({
	index,
	total,
	label,
	onFirst,
	onPrev,
	onNext,
	onLast,
	placeholder,
}: {
	index: number;
	total: number;
	label: string;
	onFirst: () => void;
	onPrev: () => void;
	onNext: () => void;
	onLast: () => void;
	placeholder?: boolean;
}) => (
	<Box sx={{ visibility: placeholder ? "hidden" : "visible" }} aria-hidden={placeholder}>
		<Box sx={{ display: "flex", justifyContent: "center", gap: "4px", marginTop: "12px" }}>
			<IconButton size="small" onClick={onFirst} disabled={placeholder || index === 0}>
				<SkipPreviousIcon />
			</IconButton>
			<IconButton size="small" onClick={onPrev} disabled={placeholder || index === 0}>
				<NavigateBeforeIcon />
			</IconButton>
			<IconButton size="small" onClick={onNext} disabled={placeholder || index === total}>
				<NavigateNextIcon />
			</IconButton>
			<IconButton size="small" onClick={onLast} disabled={placeholder || index === total}>
				<SkipNextIcon />
			</IconButton>
		</Box>
		<Typography sx={{ textAlign: "center", color: "text.secondary", marginTop: "6px", fontSize: "0.85rem" }}>
			{label || " "}
		</Typography>
	</Box>
);

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
			<ReviewControls
				index={index}
				total={plies.length}
				label={index === 0 ? "Starting position" : `${index}. ${plies[index - 1].san}`}
				onFirst={() => setIndex(0)}
				onPrev={() => setIndex((i) => Math.max(0, i - 1))}
				onNext={() => setIndex((i) => Math.min(plies.length, i + 1))}
				onLast={() => setIndex(plies.length)}
			/>
		</Box>
	);
};

export default ReviewBoard;
