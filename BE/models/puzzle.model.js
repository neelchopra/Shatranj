const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PuzzleSchema = new Schema({
	puzzleId: {
		type: String,
		required: true,
		unique: true,
	},
	fen: {
		type: String,
		required: true,
	},
	// UCI moves: index 0 is the opponent's setup move (already reflected by
	// `fen`'s side-to-move being the solver), the rest alternate solver/opponent.
	moves: [
		{
			type: String,
			required: true,
		},
	],
	rating: {
		type: Number,
		required: true,
		index: true,
	},
	themes: [
		{
			type: String,
		},
	],
});

const Puzzle = mongoose.model("Puzzle", PuzzleSchema);

module.exports = Puzzle;
