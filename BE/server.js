const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const gameRouter = require("./routes/games.routes");
const userRouter = require("./routes/users.routes");
const attachSocket = require("./socket-handlers");

require("dotenv").config();

if (!process.env.MONGODB_URI) {
	console.error("MONGODB_URI is not set. Copy .env.example to .env and fill it in.");
	process.exit(1);
}
if (!process.env.JWT_SECRET) {
	console.error("JWT_SECRET is not set. Copy .env.example to .env and fill it in.");
	process.exit(1);
}

const app = express();
const port = process.env.PORT || 8000;
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:3000").split(",");

app.use(express.json());
app.use(cors({ origin: allowedOrigins }));

mongoose
	.connect(process.env.MONGODB_URI)
	.then(() => console.log("MongoDB connection established successfully"))
	.catch((err) => {
		console.error("MongoDB connection failed:", err.message);
		process.exit(1);
	});

app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use("/users", userRouter);
app.use("/games", gameRouter);

const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: allowedOrigins,
		methods: ["GET", "POST"],
	},
});
attachSocket(io);

server.listen(port, () => {
	console.log(`Listening on port ${port}`);
});
