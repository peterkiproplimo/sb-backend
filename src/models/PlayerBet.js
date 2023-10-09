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
    withholdingtax: {
      type: String,
      required: false,
    },
    winamount: {
      type: String,
      required: false,
    },
    round: {
      type: String,
      required: true,
    },
    possibleWin: {
      type: Number,
      required: false,
    },
    win: {
      type: Boolean,
      default: false,
      required: false,
    },
    busted: {
      type: Boolean,
      default: true,
      required: false,
    },
  },
  { timestamps: true }
);
betSchema.plugin(uniqueValidator);
module.exports = mongoose.model("Playerbet", betSchema);
