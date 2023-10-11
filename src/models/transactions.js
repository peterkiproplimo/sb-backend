const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const transactionSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
    },
    trans_id: {
      type: String,
      required: false,
      unique: false,
    },
    bill_ref_number: {
      type: String,
      required: false,
    },
    MerchantRequestID: {
      type: String,
      required: false,
    },
    CheckoutRequestID: {
      type: String,
      required: false,
    },
    mpesaReceiptNumber: {
      type: String,
      required: false,
    },
    transactionDate: {
      type: String,
      required: false,
    },
    trans_time: {
      type: String,
      required: false,
    },
    conversationID: {
      type: String,
      required: false,
    },
    balance: {
      type: String,
      required: false,
    },
    floatBalance: {
      type: String,
      required: false,
    },
    username: {
      type: String,
      required: false,
    },
    phone: {
      type: String,
      required: false,
    },
    amount: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: false,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "Player",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
