const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const SettingsSchema = new Schema(
  {
    item: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Settings", SettingsSchema);
