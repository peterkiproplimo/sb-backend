const mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const betSchema = new Schema(
  {
    betAmount: {
      type: Number,
      required: true,
    },
    point: {
      type: Number,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    round: {
      type: Number,
      required: true,
    },
    possibleWin: {
      type: Number,
      required: false,
    },
    win: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
betSchema.plugin(uniqueValidator);
module.exports = mongoose.model("Playerbet", betSchema);
