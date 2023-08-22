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
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OTP", otpSchema);
