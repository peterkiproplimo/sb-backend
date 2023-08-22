// src/models/User.js

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  type: String,
  username: String,
  active: Boolean,
  phone: String,
  online: Boolean,
  password: String,
  dataToken: String,
  label: String,
  firstDeposit: Number,
  createdAt: Date,
  updatedAt: Date,
});

const User = mongoose.model('User', userSchema);

module.exports = User;
