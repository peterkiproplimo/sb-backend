const connectToDatabase = require('../../config/database');
const User = require('../models/Player');

async function createUser(req, res) {
    try {
      const newUser = await User.create(req.body);
      res.status(201).json(newUser);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

async function getUsers(req, res) {
    try {
      const db = await connectToDatabase();
      const accountsCollection = db.collection('users');
  
      const users = await accountsCollection.find({}).toArray();
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  module.exports = {
    createUser,
    getUsers, // Add the getUsers function
  };