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

  async function login (args, req) {
    const user = await User.findOne({ username: args.loginInput.username });
    if (!user) {
      throw new Error("Invalid credentials. Please try again!");
    }
    if (user.active === false) {
      throw new Error("Account suspended!!!");
    }
    const isEqual = await bcrypt.compare(
      args.loginInput.password,
      user.password
    );
    if (!isEqual) {
      throw new Error("Invalid credentials. Please try again!");
    }
    const otp = otpGenerator.generate(12, {
              upperCaseAlphabets: true,
              lowerCaseAlphabets: false,
              digits: true,
              specialChars: false,
            });
    user.dataToken=otp
    user.online = true;
    await user.save();

    const ipAddress = req.socket.remoteAddress;
    const log = new Logs({
      ip: ipAddress,
      description: `${user.username} logged in`,
      user: user._id,
    });

    await log.save();

    const token = await jwt.sign(
      { userId: user.id, phone: user.phone },
      "thisissupposedtobemysecret",
      {
        expiresIn: 60 * 30,
      }
    );
    return {
      userId: user.id,
      type: user.type,
      phone:user.phone,
      token: token,
      online: user.online,
      dataToken:user.dataToken,
      tokenExpiration: 15,
    };
  }

  module.exports = {
    createUser,
    getUsers, // Add the getUsers function
  };