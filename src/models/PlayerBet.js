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
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    round: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);
betSchema.plugin(uniqueValidator);
module.exports = mongoose.model("Playerbet", betSchema);
