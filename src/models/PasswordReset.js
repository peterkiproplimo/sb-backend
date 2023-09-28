const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const PasswordResetSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PasswordReset", PasswordResetSchema);
