import React, { useState } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  styled,
  TableContainer,
  Button,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

export type LeaderboardPlayer = {
  _id: string;
  username: string;
  rating: number;
  number_of_matches: number;
};

const Leaderboard = ({ players }: { players: LeaderboardPlayer[] }) => {
  const theme = useTheme();
  const [isViewAll, setIsViewAll] = useState(false);

  const StyledTableCell = styled(TableCell)(({ theme }) => ({
    "&.MuiTableCell-head": {
      backgroundColor: theme.palette.primary.main,
      color: "white",
      padding: "16px 30px",
    },
    color: "#FFF",
    fontSize: "20px",
    fontStyle: "normal",
    fontWeight: "700",
    lineHeight: "normal",
    border: "none",
    padding: "9px 30px",
  }));

  const StyledTableRow = styled(TableRow)({
    "&.MuiTableRow-head": {
      borderRadius: "10px",
    },
    border: "none",
    backgroundColor: theme.palette.primary.light,
  });

  const OuterBox = styled(Box)({
    borderRadius: "10px",
    backgroundColor: `${theme.palette.primary.main}`,
    margin: "22px",
    position: "relative",
    width: "800px",
    padding: "20px",
    [theme.breakpoints.up("laptop")]: {
      width: "1050px",
      padding: "30px",
    },
  });

  const visible = isViewAll ? players : players.slice(0, 5);

  return (
    <OuterBox>
      <Typography variant="h4" sx={{ color: "white", marginBottom: "16px", fontWeight: 700 }}>
        Top Players
      </Typography>
      <TableContainer>
        <Table stickyHeader aria-label="leaderboard table">
          <TableHead>
            <StyledTableRow>
              <StyledTableCell>#</StyledTableCell>
              <StyledTableCell>Name</StyledTableCell>
              <StyledTableCell align="right">Rating</StyledTableCell>
              <StyledTableCell align="right">Games</StyledTableCell>
            </StyledTableRow>
          </TableHead>
          <TableBody>
            {visible.map((player, index) => (
              <StyledTableRow key={player._id}>
                <StyledTableCell>{index + 1}</StyledTableCell>
                <StyledTableCell>{player.username}</StyledTableCell>
                <StyledTableCell align="right">{player.rating}</StyledTableCell>
                <StyledTableCell align="right">{player.number_of_matches}</StyledTableCell>
              </StyledTableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {players.length > 5 && (
        <Button
          variant="contained"
          color="primary"
          sx={{ marginTop: "16px" }}
          onClick={() => setIsViewAll(!isViewAll)}
        >
          {isViewAll ? "View Less" : "View More"}
        </Button>
      )}
    </OuterBox>
  );
};

export default Leaderboard;
