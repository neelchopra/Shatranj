/**
 * One-time (or rerun-to-refresh) tool: streams Lichess's open puzzle
 * database (CC0-licensed, https://database.lichess.org/#puzzles),
 * decompresses it on the fly, and keeps a rating-balanced sample without
 * downloading the full multi-hundred-MB dump to disk.
 *
 * Run with: node scripts/fetch-puzzle-sample.js
 * Writes: data/puzzles-sample.csv
 */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const readline = require("readline");
const { Readable, PassThrough } = require("stream");

/**
 * database.lichess.org prepends a 12-byte zstd "skippable frame"
 * (magic 0x184D2A50-5F + 4-byte size + data) before the real zstd stream.
 * Node's zlib zstd decompressor doesn't skip these automatically, so we
 * peel it off the front of the byte stream first.
 */
function stripLeadingSkippableFrame(source) {
	let buffered = Buffer.alloc(0);
	let resolved = false;
	const out = new PassThrough();
	source.on("data", (chunk) => {
		if (resolved) return out.write(chunk);
		buffered = Buffer.concat([buffered, chunk]);
		if (buffered.length < 8) return;
		const magic = buffered.readUInt32LE(0);
		const skip = magic >= 0x184d2a50 && magic <= 0x184d2a5f ? 8 + buffered.readUInt32LE(4) : 0;
		if (buffered.length >= skip) {
			resolved = true;
			out.write(buffered.subarray(skip));
			buffered = null;
		}
	});
	source.on("end", () => out.end());
	source.on("error", (e) => out.destroy(e));
	return out;
}

const SOURCE_URL = "https://database.lichess.org/lichess_db_puzzle.csv.zst";
const OUTPUT_PATH = path.join(__dirname, "..", "data", "puzzles-sample.csv");
const BUCKET_SIZE = 200; // rating band width
const PER_BUCKET = 1800; // puzzles to keep per band (~18k total across 10 bands)
const MIN_RATING = 600;
const MAX_RATING = 2600;
const MAX_LINES_SCANNED = 4_000_000; // safety net so this always terminates

async function main() {
	const buckets = new Map();
	for (let r = MIN_RATING; r < MAX_RATING; r += BUCKET_SIZE) buckets.set(r, []);
	const bucketKey = (rating) => Math.floor((rating - MIN_RATING) / BUCKET_SIZE) * BUCKET_SIZE + MIN_RATING;
	const isFull = () => [...buckets.values()].every((rows) => rows.length >= PER_BUCKET);

	console.log("Fetching", SOURCE_URL);
	const response = await fetch(SOURCE_URL);
	if (!response.ok || !response.body) throw new Error(`Fetch failed: ${response.status}`);

	const stripped = stripLeadingSkippableFrame(Readable.fromWeb(response.body));
	const decompressed = stripped.pipe(zlib.createZstdDecompress());
	const rl = readline.createInterface({ input: decompressed, crlfDelay: Infinity });

	let header = null;
	let ratingIdx = -1;
	let scanned = 0;
	let kept = 0;

	for await (const line of rl) {
		scanned++;
		if (!header) {
			header = line.split(",");
			ratingIdx = header.indexOf("Rating");
			if (ratingIdx === -1) throw new Error("Unexpected CSV header: " + line);
			continue;
		}

		const rating = Number(line.split(",")[ratingIdx]);
		if (Number.isFinite(rating) && rating >= MIN_RATING && rating < MAX_RATING) {
			const key = bucketKey(rating);
			const bucket = buckets.get(key);
			if (bucket && bucket.length < PER_BUCKET) {
				bucket.push(line);
				kept++;
			}
		}

		if (scanned % 100_000 === 0) {
			console.log(`  scanned ${scanned.toLocaleString()} lines, kept ${kept.toLocaleString()}`);
		}
		if (isFull() || scanned >= MAX_LINES_SCANNED) break;
	}

	rl.close();
	decompressed.destroy();
	stripped.destroy();
	response.body.cancel?.().catch(() => {});

	const rows = [...buckets.values()].flat();
	fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
	fs.writeFileSync(OUTPUT_PATH, [header.join(","), ...rows].join("\n") + "\n");
	console.log(`Wrote ${rows.length.toLocaleString()} puzzles to ${OUTPUT_PATH} (scanned ${scanned.toLocaleString()} lines)`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
