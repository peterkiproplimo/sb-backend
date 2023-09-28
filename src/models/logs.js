const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const logsSchema = new Schema(
  {
    ip: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    round: {
      type: Number,
      required: false,
    },
    crush: {
      type: Number,
      required: false,
    },
    transactionId:{
      type: String,
      required: false,
    },
     balance:{
      type: String,
      required: false,
    },
    conversationID:{
      type: String,
      required: false,
    },
    at: {
      type: Number,
      required: false,
    },
    won: {
      type: Number,
      required: false,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Logs", logsSchema);
