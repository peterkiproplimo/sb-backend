const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    role: {
      //1-admin, 2-Manager, 3-secretary
      // these are administrative levels stored as 1 or 2 or 3
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    status: {
      // true for active and false for inactive
      type: Number,
      default: true,
      required: true,
    },
    deleted: {
      // true if deleted
      type: Number,
      default: false,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", UserSchema);
