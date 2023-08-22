const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const accountSchema = new Schema({
  balance: {
    type: String,
    required: true,
  },
  active:{
    type: Boolean,
    required: true,
  },
  phone:{
    type: String,
    required: true,
  },
  user:{
    type:Schema.Types.ObjectId,
    ref:"User"
  }
},     
{ timestamps: true }
);

module.exports = mongoose.model("Account", accountSchema);
