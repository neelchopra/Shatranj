const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const FriendsSchema = new Schema(
	{
		// player_id is the requester, friend_id is the recipient.
		player_id: {
			type: mongoose.SchemaTypes.ObjectId,
			ref: "User",
			required: true,
		},
		friend_id: {
			type: mongoose.SchemaTypes.ObjectId,
			ref: "User",
			required: true,
		},
		status: {
			type: String,
			enum: ["pending", "accepted"],
			default: "pending",
		},
	},
	{ timestamps: true }
);

const Friends = mongoose.model("Friend", FriendsSchema);

module.exports = Friends;
