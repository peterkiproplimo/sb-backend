const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const PaymentSchema = new Schema(
  {
    amount: {
      type: Number,
    },
    transType: {
      type: String,
    },
    transCode: {
      type: String,
    },
    timestamp: {
      type: String,
    },
    payments_id: {
      type: String,
    },
    account: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Payment", PaymentSchema);
