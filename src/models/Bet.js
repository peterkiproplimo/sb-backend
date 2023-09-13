const mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const betSchema = new Schema(
  {
    serverSeed: {
      type: String,
      required: true,
    },
    nonce: {
      type: String,
      required: true,
    },
    clientSeed: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    auto:{
      type: Boolean,
      required: false,
    },
      balance:{
      type: String,
      required: false,
    },
    betAmount: {
      type: Number,
      required: true,
    },
    point: {
      type: String,
      required: true,
    },
      crush: {
      type: Number,
      required: false,
    },
    round: {
      type: String,
      requird: true,
    },
    win: {
      type: Boolean,
      required: true,
    },
    tax: {
      type: Number,
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);
betSchema.plugin(uniqueValidator);
module.exports = mongoose.model("Bet", betSchema);
