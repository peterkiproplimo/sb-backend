const mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const betSchema = new Schema(
  {
    bustpoint: {
      type: Number,
      required: true,
    },
    seedeed: {
      type: String,
      required: true,
    },
    played: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);
betSchema.plugin(uniqueValidator);
module.exports = mongoose.model("Game", betSchema);
