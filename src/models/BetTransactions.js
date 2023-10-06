const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const transactionSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
    },
    usertype: {
      type: String,
      required: true,
    },
    amount: {
      type: String,
      required: true,
    },
    account: {
      type: Schema.Types.ObjectId,
      ref: "Account",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BetTransaction", transactionSchema);
