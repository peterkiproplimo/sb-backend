const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const transactionSchema = new Schema(
  {
    type: {
      type: Number,
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
    // For Mpesa express
    MerchantRequestID: {
      type: String,
      required: false,
    },
    CheckoutRequestID: {
      type: String,
      required: false,
    },

    // For B2C
    OriginatorConversationID: {
      type: String,
      required: false,
    },
    ConversationID: {
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
    ResultDesc: {
      type: String,
      required: false,
    },
    balance: {
      type: Number,
      required: false,
    },
    floatBalance: {
      type: Number,
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
      type: Number,
      required: true,
    },
    status: {
      type: Number,
      required: false,
      default: 0,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "Player",
    },
    account: {
      type: Schema.Types.ObjectId,
      ref: "Account",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
