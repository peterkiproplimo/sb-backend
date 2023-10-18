const mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const TermsConditionSchema = new Schema(
  {
    terms: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);
TermsConditionSchema.plugin(uniqueValidator);
module.exports = mongoose.model("TermsCondition", TermsConditionSchema);
