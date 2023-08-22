const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const houseSchema = new Schema(
  {
    houseTotal: {
      type: Number,
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("House", houseSchema);
