const bcrypt = require("bcryptjs");
const otpGenerator = require("otp-generator");
const jwt = require("jsonwebtoken");

//importing mongoose models
const Player = require("../models/Player");
const Admin = require("../models/admins");
const Logs = require("../models/logs");
const AdminLog = require("../models/adminlogs");
const User = require("../models/User");

const authResolvers = {
  login: async (args, req) => {
    const user = await Player.findOne({ username: args.loginInput.username });
    if (!user) {
      throw new Error("Invalid credentials. Please try again!");
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
      username: user.username,
      phone: user.phone,
      token: token,
      dataToken: user.dataToken,
      tokenExpiration: 15,
      online: user.online,
    };
    // online: user.online,
  },

  adminLogin: async (args, req) => {
    console.log(args);
    const user = await User.findOne({
      username: args.loginInput.username,
    }).populate("role");
    if (!user) {
      throw new Error("Invalid credentials. Please try again!");
    }
    if (user.active === false) {
      throw new Error("Account suspended!!!");
    }
    if (user.online === true && user.type === "User") {
      throw new Error("User already online");
    }
    const isEqual = await bcrypt.compare(
      args.loginInput.password,
      user.password
    );
    if (!isEqual) {
      throw new Error("Invalid credentials. Please try again!");
    }
    user.online = true;
    await user.save();

    const ipAddress = req.socket.remoteAddress;
    const log = new AdminLog({
      ip: ipAddress,
      description: `${user.username} logged in `,
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
      phone: user.phone,
      username: user.username,
      type: user.type,
      token: token,

      online: user.online,
      tokenExpiration: 15,
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
