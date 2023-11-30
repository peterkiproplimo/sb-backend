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
      type: Schema.Types.ObjectId,
      ref: "Player",
    },
    withholdingtax: {
      type: Number,
      required: false,
    },
    winamount: {
      type: Number,
      required: false,
    },
    round: {
      type: String,
      required: false,
      // required: false,
    },
    roundid: {
      type: Schema.Types.ObjectId,
      ref: "Game",
      required: false,
    },
    played: {
      type: Number,
      required: true,
    },
    completed: {
      type: Number,
      required: false,
      default: 0,
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
