const bcrypt = require("bcryptjs");
const otpGenerator = require("otp-generator");
const jwt = require("jsonwebtoken");

//importing mongoose models
const Player = require("../models/Player");
const Logs = require("../models/logs");
const AdminLog = require("../models/AdminLogs");
const User = require("../models/User");
const { AuthenticationError } = require("apollo-server-express");
const Account = require("../models/Account");

const authResolvers = {
  login: async (args, req) => {
    const user = await Player.findOne({ username: args.loginInput.username });
    if (!user) {
      throw new AuthenticationError("Invalid credentials. Please try again!");
    }
    // if (user.online) {
    //   throw new Error("User cannot sign in in more than one device");
    // }
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
    user.dataToken = otp;
    user.online = true;
    await user.save();

    const account = Account.findOne({ user: user });
    const totalbalance = account?.karibubonus + account?.balance;
    const ipAddress = req.socket.remoteAddress;
    const log = new Logs({
      action: "login",
      ip: ipAddress,
      description: `${user.username} logged in`,
      user: user._id,
    });

    await log.save();

    const tokenExpiresIn = 60 * 30; // in seconds
    const expirationTime = Math.floor(Date.now() / 1000) + tokenExpiresIn;

    const token = await jwt.sign(
      { userId: user.id, phone: user.phone, exp: expirationTime },
      process.env.SECRET_KEY
    );

    // const token = await jwt.sign(
    //   { userId: user.id, phone: user.phone },
    //   process.env.SECRET_KEY,
    //   { expiresIn: "1h" } // Set the token to expire in 1 hour
    // );

    return {
      userId: user.id,
      type: user.type,
      balance: totalbalance,
      username: user.username,
      phone: user.phone,
      token: token,
      dataToken: user.dataToken,
      tokenExpiration: expirationTime,
      online: user.online,
    };
    // online: user.online,
  },

  adminLogin: async (args, req) => {
    console.log(args);
    const user = await User.findOne({
      username: args.username,
    });
    if (!user) {
      throw new AuthenticationError("Invalid credentials. Please try again!");
    }
    if (user.status === false) {
      throw new AuthenticationError("Account suspended!!!");
    }
    // if (user.online === true && user.type === "User") {
    //   throw new AuthenticationError("User already online");
    // }
    const isEqual = await bcrypt.compare(args.password, user.password);
    if (!isEqual) {
      throw new AuthenticationError("Invalid credentials. Please try again!");
    }
    user.online = true;
    await user.save();

    const log = new AdminLog({
      ip: req.socket.remoteAddress,
      action: "User Login",
      description: `${user.username} logged in `,
      user: user._id,
    });

    await log.save();

    // const token = await jwt.sign(
    //   { userId: user.id, phone: user.phone },
    //   process.env.SECRET_KEY,
    //   {
    //     expiresIn: 30,
    //   }
    // );
    const tokenExpiresIn = 60 * 30; // in seconds
    const expirationTime = Math.floor(Date.now() / 1000) + tokenExpiresIn;

    const token = await jwt.sign(
      { userId: user.id, phone: user.phone, exp: expirationTime },
      process.env.SECRET_KEY
    );

    return {
      userId: user.id,
      username: user.username,
      role: user.role,
      token,
      tokenValidity: expirationTime,
    };
  },

  logout: async (args, req) => {
    const user = await User.findOne({ username: args.username });
    if (!user) {
      throw Error("User not found");
    }
    user.online = false;
    await user.save();

    const ipAddress = req.socket.remoteAddress;
    const log = new AdminLog({
      ip: ipAddress,
      description: `${args.initiator} logged out ${user.username}`,
      user: user._id,
    });

    await log.save();
    return user;
  },

  logoutUser: async (args, req) => {
    const user = await User.findOne({ username: args.username });
    if (!user) {
      throw Error("User not found");
    }
    user.online = false;
    await user.save();

    const ipAddress = req.socket.remoteAddress;
    const log = new Logs({
      ip: ipAddress,
      description: `${user.username} logged out `,
      user: user._id,
    });
    await log.save();
    return user;
  },

  logoutPlayer: async (args, req) => {
    const user = await Player.findOne({ username: args.username });
    if (!user) {
      throw Error("User not found");
    }
    user.online = false;
    await user.save();

    const ipAddress = req.socket.remoteAddress;
    const log = new Logs({
      ip: ipAddress,
      description: `${user.username} logged out `,
      user: user._id,
    });
    await log.save();
    return user;
  },
};

module.exports = authResolvers;
