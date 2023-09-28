const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const BetSchema = new Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    rate: {
      type: Number,
      required: true,
    },
    status: {
      //play, wait, lose, win
      type: String,
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    game: {
      type: Schema.Types.ObjectId,
      ref: "Game",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Bet", BetSchema);
