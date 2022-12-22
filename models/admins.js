const mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");


const Schema = mongoose.Schema;

const adminSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    active: {
      type: Boolean,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    online: {
      type: Boolean,
      required: true,
    },
  },
  { timestamps: true }
);
adminSchema.plugin(uniqueValidator);
module.exports = mongoose.model("Admin", adminSchema);
