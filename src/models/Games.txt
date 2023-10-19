const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const GameSchema = new Schema(
  {
    bust: {
      type: Number,
      required: true,
    },
    hash: {
      type: String,
      required: true,
    },
    status: {
      //playing, ended
      type: String,
      required: true,
    },
    bets: [
      {
        type: Schema.Types.ObjectId,
        ref: "Bet",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Game", GameSchema);
