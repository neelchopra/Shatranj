import React, { useEffect, useState } from "react";
import { Button, Dialog, DialogActions, DialogTitle, Snackbar } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { socket } from "../socket";

type Challenge = {
	from: { id: string; username: string; rating: number };
	time: number;
	room: string;
};

/**
 * App-wide, invisible-except-for-popups socket listener. Mounted once in
 * AppShell so friend-request toasts and challenge invites work from any page,
 * and so every way of starting an online game (matchmaking, manual room
 * join, or accepting a challenge) funnels through one navigation point.
 */
const SocketNotifications = () => {
	const navigate = useNavigate();
	const [toast, setToast] = useState("");
	const [challenge, setChallenge] = useState<Challenge | null>(null);

	useEffect(() => {
		const onGameStart = (data: any) => navigate("/play/online/game", { state: data });
		const onFriendRequest = (data: { from: { username: string } }) =>
			setToast(`${data.from.username} sent you a friend request`);
		const onFriendAccepted = (data: { by: { username: string } }) =>
			setToast(`${data.by.username} accepted your friend request`);
		const onChallengeReceived = (data: Challenge) => setChallenge(data);
		const onChallengeDeclined = () => {
			setToast("Your challenge was declined");
			setChallenge(null);
		};

		socket.on("game_start", onGameStart);
		socket.on("friend_request_received", onFriendRequest);
		socket.on("friend_request_accepted", onFriendAccepted);
		socket.on("challenge_received", onChallengeReceived);
		socket.on("challenge_declined", onChallengeDeclined);
		return () => {
			socket.off("game_start", onGameStart);
			socket.off("friend_request_received", onFriendRequest);
			socket.off("friend_request_accepted", onFriendAccepted);
			socket.off("challenge_received", onChallengeReceived);
			socket.off("challenge_declined", onChallengeDeclined);
		};
	}, [navigate]);

	const acceptChallenge = () => {
		if (!challenge) return;
		socket.emit("join_room", { room: challenge.room });
		setChallenge(null);
	};

	const declineChallenge = () => {
		if (!challenge) return;
		socket.emit("challenge_declined", { room: challenge.room });
		setChallenge(null);
	};

	return (
		<>
			<Snackbar
				open={!!toast}
				autoHideDuration={5000}
				onClose={() => setToast("")}
				message={toast}
			/>
			<Dialog open={!!challenge} onClose={declineChallenge}>
				<DialogTitle>
					{challenge?.from.username} ({challenge?.from.rating}) challenges you to a {challenge?.time} min game
				</DialogTitle>
				<DialogActions>
					<Button onClick={acceptChallenge} variant="contained">
						Accept
					</Button>
					<Button onClick={declineChallenge}>Decline</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};

export default SocketNotifications;
