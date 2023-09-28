const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const PaybillC2BSchema = new Schema(
  {
    TransactionType: {
      type: String,
    },
    TransID: {
      type: String,
    },
    TransTime: {
      type: String,
    },
    TransAmount: {
      type: String,
    },
    BusinessShortCode: {
      type: String,
    },
    BillRefNumber: {
      type: String,
    },
    InvoiceNumber: {
      type: String,
    },
    OrgAccountBalance: {
      type: String,
    },
    ThirdPartyTransID: {
      type: String,
    },
    MSISDN: {
      type: String,
    },
    FirstName: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Paybillc2b", PaybillC2BSchema);
