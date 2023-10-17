const mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const PrivacyPolicySchema = new Schema(
  {
    policy: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);
PrivacyPolicySchema.plugin(uniqueValidator);
module.exports = mongoose.model("PrivacyPolicy", PrivacyPolicySchema);
