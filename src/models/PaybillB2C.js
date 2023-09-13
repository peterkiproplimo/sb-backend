const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const PaybillB2CSchema = new Schema(
  {
    ConversationID: {
      type: String,
    },
    OriginatorConversationID: {
      type: String,
    },
    ResultCode: {
      type: String,
    },
    Amount: {
      type: Number,
    },
    TransactionID: {
      type: String,
    },
    TransactionDate: {
      type: String,
    },
    B2CRecipientIsRegisteredCustomer: {
      type: String,
    },
    B2CChargesPaidAccountAvailableFunds: {
      type: String,
    },
    B2CUtilityAccountAvailableFunds: {
      type: String,
    },
    B2CWorkingAccountAvailableFunds: {
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

module.exports = mongoose.model("Paybillb2c", PaybillB2CSchema);
