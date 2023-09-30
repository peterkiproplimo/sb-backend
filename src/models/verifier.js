const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const otpSchema = new Schema(
  {
    otp: {
      type: String,
      required: true,
    },
    verified: {
      type: Boolean,
      required: true,
    },
    type: {
      type: String,
      required: false,
    },
    phone: {
      type: String,
      required: false,
    },
    username: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OTP", otpSchema);
