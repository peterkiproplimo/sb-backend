// permissionModel.js
const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema(
  {
    entity_name: String,
    action_name: String,
    description: String,
  },

  {
    timestamps: true,
  }
);

const Permission = mongoose.model("Permission", permissionSchema);

module.exports = Permission;
