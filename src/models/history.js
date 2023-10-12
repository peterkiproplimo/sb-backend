const mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const betHistorySchema = new Schema(
  {
    point: {
      type: String,
      required: true,
    },
    hash: {
      type: String,
      required: true,
    },
    round: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("History", betHistorySchema);
