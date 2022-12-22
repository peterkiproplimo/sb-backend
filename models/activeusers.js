const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const activeusersSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
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
    },
    online: {
      type: Boolean,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Actives", activeusersSchema);
