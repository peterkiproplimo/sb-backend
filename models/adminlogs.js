const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const adminlogsSchema = new Schema(
  {
    ip: {
      type: String,
      required: false,
    },
    description: {
      type: String,
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminLog", adminlogsSchema);
