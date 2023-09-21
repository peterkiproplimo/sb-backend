const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    type: String,
    username: String,
    active: Boolean,
    phone: String,
    online: Boolean,
    password: String,
    dataToken: String,
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
