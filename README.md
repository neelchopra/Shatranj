# Shatranj ♞

A full-stack online chess platform. Play rated games against random opponents in real time, invite friends with a room code, or practice against Stockfish — with live clocks, Elo ratings, game history and a global leaderboard.

**Live demo:** _coming soon_ · **Tech:** React + TypeScript · Redux Toolkit · MUI · Express · Socket.IO · MongoDB · JWT

> ⏳ The backend runs on a free tier and sleeps when idle — the first request may take ~50 seconds to wake it up.

## Features

- **Random matchmaking** — join a queue per time control (5/10/15 min); the server pairs players and assigns colors
- **Play a friend** — create a private room, share the 6-character code
- **Rated games** — server-side Elo (K=32) applied when a game ends; ratings update live for both players
- **Resign / draw offers / disconnect forfeit** — full game lifecycle handled over WebSockets
- **Play the computer** — Stockfish (WASM web worker, three depths); works without an account
- **Profiles & history** — every online game is persisted with PGN; win/loss/draw record on your account page
- **Leaderboard & friends** — top players by rating; search users and build a friends list
- **JWT auth** — bcrypt-hashed passwords, token-authenticated REST **and** WebSocket connections

## Architecture

```
React (Vercel) ── REST (axios + JWT) ──► Express ──► MongoDB Atlas
      │                                    │
      └───── Socket.IO (JWT handshake) ────┘
             matchmaking · move relay · game persistence · Elo
```

- One backend process serves both the REST API and Socket.IO (`BE/server.js`).
- The socket layer (`BE/socket-handlers.js`) owns matchmaking queues, room lifecycle, and is the **single writer** for game results — clients report the outcome, the server persists it idempotently and applies Elo to both players atomically.
- Result convention: `player_id` = white; `result` 1 / 0 / 0.5 from white's perspective.

## Running locally

Requirements: Node 18+, a MongoDB instance (local or [Atlas free tier](https://www.mongodb.com/atlas)).

```bash
# Backend
cd BE
npm install
cp .env.example .env   # fill in MONGODB_URI and JWT_SECRET
npm run dev            # http://localhost:8000

# Frontend (second terminal)
cd FE
npm install
cp .env.example .env   # defaults point at localhost:8000
npm start              # http://localhost:3000
```

To play yourself: open a second browser (or incognito window), register two accounts, and click **Find match** in both.

## Tests

```bash
cd BE
npm test
```

Boots the real server against an in-memory MongoDB and runs 42 end-to-end checks with real HTTP and Socket.IO clients: auth edge cases, matchmaking, move relay, Elo math, idempotent persistence, friend rooms, resign/draw flows, and disconnect handling.

## Deployment

- **Backend** — Render web service: root directory `BE`, build `npm install`, start `npm start`. Env vars: `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN` (the Vercel URL). Render injects `PORT`.
- **Frontend** — Vercel: root directory `FE`, Create React App preset. Env vars: `REACT_APP_API_URL` and `REACT_APP_SOCKET_URL` (both the Render URL). Re-deploy after changing them — CRA bakes env vars at build time.
- **Database** — MongoDB Atlas M0 free cluster; allow access from `0.0.0.0/0` (Render has dynamic egress IPs).

## Known limitations

- Game results are reported by the clients and accepted by the server (first report wins); server-side move validation is a planned improvement.
- Matchmaking queues and live rooms are in-memory — a redeploy drops games in progress (finished games are already persisted).
- Free-tier cold starts (~50 s) on the backend after idle periods.
