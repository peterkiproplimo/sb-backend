const mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const gameSchema = new Schema(
  {
    bustpoint: {
      type: Number,
      required: true,
    },
    seedeed: {
      type: String,
      required: true,
    },
    gameId: {
      type: Number,
      unique: true,
      required: true,
    },
    played: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);
gameSchema.plugin(uniqueValidator);
module.exports = mongoose.model("Game", gameSchema);
