const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const OrganizationSchema = new Schema(
  {
    totalFunds: {
      type: Number,
    },
    walletFunds: {
      type: Number,
    },
    totalTax: {
      type: Number,
      required: true,
      default: 0,
    },
    houseFunds: {
      type: Number,
    },
    waitingFunds: {
      type: Number,
    },
    withdrawals: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Organization", OrganizationSchema);
