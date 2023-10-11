const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const accountSchema = new Schema(
  {
    phone: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: false,
      default: 0,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "Player",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transrequest", accountSchema);
