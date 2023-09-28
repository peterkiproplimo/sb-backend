const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const PhonebookSchema = new Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      default: "Player",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Phonebook", PhonebookSchema);
