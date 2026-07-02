/**
 * Loads data/puzzles-sample.csv (produced by fetch-puzzle-sample.js) into
 * the Puzzle collection. Safe to rerun — duplicates are skipped via the
 * unique index on puzzleId.
 *
 * Run with: node scripts/seed-puzzles.js
 */
const fs = require("fs");
const path = require("path");
const readline = require("readline");
require("dotenv").config();
const mongoose = require("mongoose");
const Puzzle = require("../models/puzzle.model");

const CSV_PATH = path.join(__dirname, "..", "data", "puzzles-sample.csv");
const BATCH_SIZE = 1000;

async function main() {
	if (!process.env.MONGODB_URI) {
		console.error("MONGODB_URI is not set. Copy .env.example to .env and fill it in.");
		process.exit(1);
	}
	if (!fs.existsSync(CSV_PATH)) {
		console.error(`No puzzle CSV found at ${CSV_PATH}. Run fetch-puzzle-sample.js first.`);
		process.exit(1);
	}

	await mongoose.connect(process.env.MONGODB_URI);
	console.log("Connected to MongoDB");

	const rl = readline.createInterface({
		input: fs.createReadStream(CSV_PATH),
		crlfDelay: Infinity,
	});

	let header = null;
	let idx = {};
	let batch = [];
	let inserted = 0;
	let skipped = 0;

	const flush = async () => {
		if (batch.length === 0) return;
		try {
			const result = await Puzzle.insertMany(batch, { ordered: false });
			inserted += result.length;
		} catch (err) {
			// Duplicate key errors are expected on reruns; count what did land.
			const insertedIds = err.insertedDocs?.length || 0;
			inserted += insertedIds;
			skipped += batch.length - insertedIds;
		}
		batch = [];
	};

	for await (const line of rl) {
		if (!header) {
			header = line.split(",");
			["PuzzleId", "FEN", "Moves", "Rating", "Themes"].forEach((col) => {
				idx[col] = header.indexOf(col);
			});
			if (Object.values(idx).some((i) => i === -1)) {
				throw new Error("CSV is missing an expected column: " + line);
			}
			continue;
		}
		if (!line.trim()) continue;
		const cols = line.split(",");
		batch.push({
			puzzleId: cols[idx.PuzzleId],
			fen: cols[idx.FEN],
			moves: cols[idx.Moves].split(" "),
			rating: Number(cols[idx.Rating]),
			themes: cols[idx.Themes] ? cols[idx.Themes].split(" ") : [],
		});
		if (batch.length >= BATCH_SIZE) await flush();
	}
	await flush();

	console.log(`Done. Inserted ${inserted}, skipped ${skipped} (already present).`);
	await mongoose.disconnect();
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
