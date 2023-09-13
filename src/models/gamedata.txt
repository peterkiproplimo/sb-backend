const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const gameSchema = new Schema({
  round: {
    type : String,
    required: true,
  },
  level: {
    type: String,
    required: true,
  },
},     
{ timestamps: true }
);

module.exports = mongoose.model("Game", gameSchema);
