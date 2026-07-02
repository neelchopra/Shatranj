import React, { useState } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  TableContainer,
  Button,
  Avatar,
} from "@mui/material";
import { motion } from "framer-motion";
import GlassCard from "../../ui/GlassCard";
import { tokens } from "../../theme";

export type LeaderboardPlayer = {
  _id: string;
  username: string;
  rating: number;
  number_of_matches: number;
};

const medallions: Record<number, { color: string; background: string }> = {
  0: { color: "#FBBF24", background: "rgba(251,191,36,0.15)" },
  1: { color: "#CBD5E1", background: "rgba(203,213,225,0.12)" },
  2: { color: "#D97706", background: "rgba(217,119,6,0.15)" },
};

const headCellSx = {
  color: "text.secondary",
  fontSize: "0.75rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  borderBottom: "1px solid rgba(148,163,184,0.12)",
};

const Leaderboard = ({ players }: { players: LeaderboardPlayer[] }) => {
  const [isViewAll, setIsViewAll] = useState(false);

  const visible = isViewAll ? players : players.slice(0, 5);

  return (
    <GlassCard sx={{ width: "100%", maxWidth: 900, padding: { xs: "20px", sm: "32px" } }}>
      <Typography variant="h2" sx={{ marginBottom: "24px" }}>
        Top players
      </Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...headCellSx, width: 70 }}>Rank</TableCell>
              <TableCell sx={headCellSx}>Player</TableCell>
              <TableCell sx={headCellSx} align="right">Rating</TableCell>
              <TableCell sx={{ ...headCellSx, display: { xs: "none", sm: "table-cell" } }} align="right">
                Games
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visible.map((player, index) => {
              const medallion = medallions[index];
              return (
                <TableRow
                  key={player._id}
                  component={motion.tr}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.35, ease: "easeOut" }}
                  sx={{
                    "&:hover": { background: "rgba(255,255,255,0.03)" },
                    ...(index === 0 && { borderLeft: "3px solid rgba(16,185,129,0.6)" }),
                  }}
                >
                  <TableCell>
                    {medallion ? (
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          fontSize: "0.9rem",
                          fontWeight: 700,
                          color: medallion.color,
                          background: medallion.background,
                          border: `1px solid ${medallion.color}44`,
                        }}
                      >
                        {index + 1}
                      </Avatar>
                    ) : (
                      <Typography sx={{ color: "text.secondary", paddingLeft: "10px" }}>
                        {index + 1}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600 }}>{player.username}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      sx={{
                        fontFamily: tokens.fontDisplay,
                        fontWeight: 700,
                        color: "primary.light",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {player.rating}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ display: { xs: "none", sm: "table-cell" } }}>
                    <Typography sx={{ color: "text.secondary", fontVariantNumeric: "tabular-nums" }}>
                      {player.number_of_matches}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      {players.length === 0 && (
        <Typography sx={{ color: "text.secondary", padding: "24px 0 8px 0" }}>
          No players yet — be the first on the board.
        </Typography>
      )}
      {players.length > 5 && (
        <Box sx={{ marginTop: "16px" }}>
          <Button onClick={() => setIsViewAll(!isViewAll)}>
            {isViewAll ? "View less" : `View all ${players.length}`}
          </Button>
        </Box>
      )}
    </GlassCard>
  );
};

export default Leaderboard;
