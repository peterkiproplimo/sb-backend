// roleModel.js
const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
  name: String,
  permissions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Permission",
    },
  ],
});

const Role = mongoose.model("Role", roleSchema);

module.exports = Role;
