import React, { useEffect, useState } from "react";
import Typography from "@mui/material/Typography";
import {
	Box,
	Button,
	Divider,
	IconButton,
	TextField,
	Tooltip,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import PersonSearchOutlinedIcon from "@mui/icons-material/PersonSearchOutlined";
import { motion } from "framer-motion";
import { socket } from "../socket";
import GlassCard from "../ui/GlassCard";
import SegmentedControl from "../ui/SegmentedControl";
import { fadeUp, pulseRing, staggerContainer } from "../ui/motion";
import { tokens } from "../theme";

const PlayOnline = () => {
	const [time, setTime] = useState(5);
	const [mode, setMode] = useState<"idle" | "searching" | "hosting">("idle");
	const [hostedRoom, setHostedRoom] = useState("");
	const [joinCode, setJoinCode] = useState("");
	const [error, setError] = useState("");
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		// "game_start" (matchmaking, manual join, or a challenge accepted
		// elsewhere) is handled globally by SocketNotifications/AppShell —
		// this page only needs its own status events.
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

		socket.on("room_created", onRoomCreated);
		socket.on("room_error", onRoomError);
		socket.on("connect_error", onConnectError);

		return () => {
			socket.off("room_created", onRoomCreated);
			socket.off("room_error", onRoomError);
			socket.off("connect_error", onConnectError);
			socket.emit("cancel_find");
		};
	}, []);

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

	const copyCode = () => {
		navigator.clipboard.writeText(hostedRoom).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		});
	};

	return (
		<motion.div variants={staggerContainer} initial="initial" animate="animate">
			<motion.div variants={fadeUp}>
				<Typography variant="h2" sx={{ marginBottom: "28px" }}>
					Play online
				</Typography>
			</motion.div>
			<motion.div variants={fadeUp}>
				<GlassCard sx={{ padding: { xs: "24px", sm: "36px" }, maxWidth: 640 }}>
					<Typography variant="h4" sx={{ marginBottom: "14px", color: "text.secondary" }}>
						Time control
					</Typography>
					<SegmentedControl
						layoutId="time-pill"
						options={[
							{ label: "5 min", value: 5 },
							{ label: "10 min", value: 10 },
							{ label: "15 min", value: 15 },
						]}
						value={time}
						onChange={setTime}
					/>

					{error && (
						<motion.div variants={fadeUp} initial="initial" animate="animate">
							<Typography sx={{ color: "error.main", margin: "16px 0 0 0" }}>
								{error}
							</Typography>
						</motion.div>
					)}

					<Typography variant="h3" sx={{ margin: "36px 0 16px 0" }}>
						Play a random opponent
					</Typography>
					{mode === "searching" ? (
						<Box sx={{ display: "flex", alignItems: "center", gap: "24px" }}>
							<Box
								sx={{
									position: "relative",
									width: 56,
									height: 56,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								{[0, 0.9].map((delay) => (
									<motion.div
										key={delay}
										animate={pulseRing.animate}
										transition={{ ...pulseRing.animate.transition, delay }}
										style={{
											position: "absolute",
											inset: 0,
											borderRadius: "50%",
											border: "2px solid rgba(16,185,129,0.6)",
										}}
									/>
								))}
								<Box
									sx={{
										width: 56,
										height: 56,
										borderRadius: "50%",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										background: "rgba(16,185,129,0.14)",
										color: "primary.light",
									}}
								>
									<PersonSearchOutlinedIcon />
								</Box>
							</Box>
							<Typography sx={{ color: "text.secondary" }}>
								Searching for an opponent…
							</Typography>
							<Button variant="outlined" onClick={cancelFind}>
								Cancel
							</Button>
						</Box>
					) : (
						<Button variant="contained" size="large" onClick={findMatch}>
							Find match
						</Button>
					)}

					<Divider sx={{ margin: "36px 0" }} />

					<Typography variant="h3" sx={{ marginBottom: "16px" }}>
						Play a friend
					</Typography>
					{mode === "hosting" ? (
						<Box>
							<Typography sx={{ color: "text.secondary", marginBottom: "16px" }}>
								Share this code with your friend — the game starts when they join:
							</Typography>
							<Box sx={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
								<Box
									sx={{
										padding: "12px 24px",
										borderRadius: "12px",
										border: "1px dashed rgba(16,185,129,0.5)",
										background: "rgba(16,185,129,0.06)",
									}}
								>
									<Typography
										sx={{
											fontFamily: tokens.fontDisplay,
											fontSize: "1.8rem",
											fontWeight: 700,
											letterSpacing: "6px",
											color: "primary.light",
										}}
									>
										{hostedRoom}
									</Typography>
								</Box>
								<Tooltip title={copied ? "Copied!" : "Copy code"}>
									<IconButton onClick={copyCode} sx={{ color: copied ? "primary.light" : "text.secondary" }}>
										{copied ? <CheckIcon /> : <ContentCopyIcon />}
									</IconButton>
								</Tooltip>
							</Box>
							<Box sx={{ display: "flex", alignItems: "center", gap: "16px" }}>
								<motion.div
									animate={{ opacity: [0.5, 1, 0.5] }}
									transition={{ duration: 2, repeat: Infinity }}
								>
									<Typography sx={{ color: "text.secondary" }}>
										Waiting for your friend…
									</Typography>
								</motion.div>
							</Box>
						</Box>
					) : (
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								gap: "14px",
								flexWrap: "wrap",
							}}
						>
							<Button variant="contained" onClick={createRoom}>
								Create room
							</Button>
							<Typography sx={{ color: "text.secondary" }}>or</Typography>
							<TextField
								label="Room code"
								variant="filled"
								size="small"
								value={joinCode}
								onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
								sx={{ width: 160 }}
							/>
							<Button variant="outlined" onClick={joinRoom}>
								Join
							</Button>
						</Box>
					)}
				</GlassCard>
			</motion.div>
		</motion.div>
	);
};

export default PlayOnline;
