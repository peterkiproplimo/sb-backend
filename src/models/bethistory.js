const mongoose = require("mongoose");
var uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const betHistorySchema = new Schema({
    point: {
        type: String,
        required:true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
}, 
{ timestamps: true }
);
module.exports = mongoose.model("BetHistory", betHistorySchema);
