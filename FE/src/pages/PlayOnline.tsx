import React, { useEffect, useState } from "react";
import Typography from "@mui/material/Typography";
import {
	BottomNavigation,
	BottomNavigationAction,
	Box,
	Button,
	CircularProgress,
	Divider,
	TextField,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { socket } from "../socket";

const PlayOnline = () => {
	const [time, setTime] = useState(5);
	const [mode, setMode] = useState<"idle" | "searching" | "hosting">("idle");
	const [hostedRoom, setHostedRoom] = useState("");
	const [joinCode, setJoinCode] = useState("");
	const [error, setError] = useState("");
	const navigate = useNavigate();

	useEffect(() => {
		const onGameStart = (data: {
			room: string;
			color: string;
			time: number;
			opponent: { username: string; rating: number };
		}) => {
			navigate("/play/online/game", { state: data });
		};
		const onRoomCreated = (data: { room: string }) => {
			setHostedRoom(data.room);
			setMode("hosting");
			setError("");
		};
		const onRoomError = (data: { message: string }) => {
			setError(data.message);
		};
		const onConnectError = () => {
			setError("Could not connect to the game server. Please log in again.");
			setMode("idle");
		};

		socket.on("game_start", onGameStart);
		socket.on("room_created", onRoomCreated);
		socket.on("room_error", onRoomError);
		socket.on("connect_error", onConnectError);

		return () => {
			socket.off("game_start", onGameStart);
			socket.off("room_created", onRoomCreated);
			socket.off("room_error", onRoomError);
			socket.off("connect_error", onConnectError);
			socket.emit("cancel_find");
		};
	}, [navigate]);

	const findMatch = () => {
		setError("");
		socket.connect();
		socket.emit("find_match", { time });
		setMode("searching");
	};

	const cancelFind = () => {
		socket.emit("cancel_find");
		setMode("idle");
	};

	const createRoom = () => {
		setError("");
		socket.connect();
		socket.emit("create_room", { time });
	};

	const joinRoom = () => {
		if (!joinCode.trim()) {
			setError("Enter a room code first");
			return;
		}
		setError("");
		socket.connect();
		socket.emit("join_room", { room: joinCode });
	};

	return (
		<Box sx={{ padding: "20px 40px", maxWidth: "700px" }}>
			<Typography variant={"h3"}>Select time</Typography>
			<BottomNavigation
				showLabels
				value={time}
				onChange={(event, newValue) => setTime(newValue)}
				sx={{ margin: "16px 0" }}
			>
				<BottomNavigationAction label="5 min" value={5} />
				<BottomNavigationAction label="10 min" value={10} />
				<BottomNavigationAction label="15 min" value={15} />
			</BottomNavigation>

			{error && (
				<Typography sx={{ color: "#f44336", margin: "12px 0" }}>{error}</Typography>
			)}

			<Typography variant={"h4"} sx={{ margin: "24px 0 12px 0" }}>
				Play a random opponent
			</Typography>
			{mode === "searching" ? (
				<Box sx={{ display: "flex", alignItems: "center", gap: "16px" }}>
					<CircularProgress size={28} color="secondary" />
					<Typography>Searching for an opponent…</Typography>
					<Button color="secondary" variant="outlined" onClick={cancelFind}>
						Cancel
					</Button>
				</Box>
			) : (
				<Button color="secondary" variant="contained" onClick={findMatch}>
					Find match
				</Button>
			)}

			<Divider sx={{ margin: "32px 0", backgroundColor: "rgba(255,255,255,0.2)" }} />

			<Typography variant={"h4"} sx={{ margin: "0 0 12px 0" }}>
				Play a friend
			</Typography>
			{mode === "hosting" ? (
				<Box>
					<Typography sx={{ fontSize: "18px" }}>
						Share this code with your friend — the game starts when they join:
					</Typography>
					<Typography variant="h3" sx={{ letterSpacing: "6px", margin: "12px 0" }}>
						{hostedRoom}
					</Typography>
					<Box sx={{ display: "flex", alignItems: "center", gap: "16px" }}>
						<CircularProgress size={28} color="secondary" />
						<Typography>Waiting for your friend…</Typography>
					</Box>
				</Box>
			) : (
				<Box sx={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
					<Button color="secondary" variant="contained" onClick={createRoom}>
						Create room
					</Button>
					<Typography>or</Typography>
					<TextField
						label="Room code"
						variant="filled"
						value={joinCode}
						onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
					/>
					<Button color="secondary" variant="contained" onClick={joinRoom}>
						Join
					</Button>
				</Box>
			)}
		</Box>
	);
};

export default PlayOnline;
