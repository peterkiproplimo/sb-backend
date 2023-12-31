const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const accountSchema = new Schema(
  {
    balance: {
      type: Number,
      required: true,
    },
    active: {
      type: Boolean,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    karibubonus: {
      type: Number,
      required: false,
      default: 0,
    },
    totalbetamount: {
      type: Number,
      required: false,
      default: 0,
    },
    isfirstdebosit: {
      type: Boolean,
      required: false,
      default: false,
    },
    bonusexpirydate: {
      type: Date,
      required: false,
    },
    bonusredeemed: {
      type: Boolean,
      required: false,
      default: false,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "Player",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Account", accountSchema);
