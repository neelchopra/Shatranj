import { io } from "socket.io-client";
import { SOCKET_URL } from "./config";

export const socket = io(SOCKET_URL, {
	autoConnect: false,
	auth: (cb) => cb({ token: localStorage.getItem("token") }),
});
