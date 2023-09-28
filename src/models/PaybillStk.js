const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const PaybillStkSchema = new Schema(
  {
    MerchantRequestID: {
      type: String,
    },
    CheckoutRequestID: {
      type: String,
    },
    Amount: {
      type: Number,
    },
    MpesaReceiptNumber: {
      type: String,
    },
    transactionCode: {
      type: String,
    },
    PhoneNumber: {
      type: String,
    },
    TransactionDate: {
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

module.exports = mongoose.model("Paybillstk", PaybillStkSchema);
