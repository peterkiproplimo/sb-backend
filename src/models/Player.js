const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    type: String,
    username: {
      type: String,
      unique: true, // Set 'unique' to true for the username field
    },
    active: Boolean,
    phone: {
      type: String,
      unique: true, // Set 'unique' to true for the username field
    },
    online: Boolean,
    password: String,
    dataToken: String,
    otp: String,
    label: String,
    firstDeposit: Number,
    createdAt: Date,
    updatedAt: Date,
    playerbets: [{ type: mongoose.Schema.Types.ObjectId, ref: "Playerbet" }],
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("Player", userSchema);

module.exports = User;
