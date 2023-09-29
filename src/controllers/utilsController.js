require("dotenv").config();

// import dependencies
const otpGenerator = require("otp-generator");
var request = require("request");

//importing mongoose models
const Logs = require("../models/logs");
const OTP = require("../models/verifier");
const Admin = require("../models/admins");
const AdminLog = require("../models/adminlogs");
const Chat = require("../models/Chat");
const Player = require("../models/Player");
const User = require("../models/User");
// Some of the below to delete
require("dotenv").config();
const express = require("express");
const http = require("http");
const app = express();
const socketAuth = require("../../src/middleware/socketAuth");
const server = http.createServer(app);
// Get Socket io manenos
const { socketIO } = require("../../src/socket/socketio");
const { connection } = require("../../src/socket/gameHandler");

const io = socketIO(server);

const onConnection = (socket) => {
  connection(io, socket);
};

io.on("connection", onConnection);
io.use(socketAuth);

const utilsResolvers = {
  verifyOtp: async (args, req) => {
    // if (OTPs.includes(args.otp)) {
    //   // console.log("first")
    //   throw new Error("Invalid OTP!!!");
    // }
    const otp = await OTP.findOne({ otp: args.otp }).sort({
      createdAt: -1,
    });
    // console.log(otp);

    if (
      !otp ||
      parseInt(new Date().toISOString().split("T")[1].substr(3, 2)) -
        parseInt(otp.createdAt.toISOString().split("T")[1].substr(3, 2)) >
        10
    ) {
      // console.log("second")

      throw new Error("Invalid OTP!!!");
    }
    otp.verified = true;

    // OTPs.push(args.otp);

    const verified = await otp.save();
    const user = await User.findById(verified.user);
    return {
      ...verified._doc,
      _id: verified.id,
      user: user,
      createdAt: new Date(verified._doc.createdAt).toISOString(),
      updatedAt: new Date(verified._doc.updatedAt).toISOString(),
    };
  },

  generateOtp: async (args, req) => {
    const user = await User.findOne({ username: args.username });
    const otp = otpGenerator.generate(5, {
      upperCaseAlphabets: true,
      lowerCaseAlphabets: false,
      digits: true,
      specialChars: false,
    });

    const otpCreator = new OTP({
      otp: otp,
      verified: false,
      user: user ? user.id : null,
    });
    const generator = await otpCreator.save();

    var options = {
      method: "POST",
      url: "https://sms.securifier.co.ke/SMSApi/send",
      headers: {
        Headers: "Content-Type:application/json",
      },
      formData: {
        userid: "safaribust",
        password: "qghckqHE",
        mobile: `${user ? user.phone : args.phone}`,
        senderid: "SAFARIBUST",
        msg: `OTP: ${otp}`,
        sendMethod: "quick",
        msgType: "text",
        output: "json",
        duplicatecheck: "true",
      },
    };
    request(options, function (error, response) {
      if (error) throw new Error(error);
      // console.log(response.body);
    });

    const ipAddress = req.socket.remoteAddress;
    const log = new Logs({
      ip: ipAddress,
      description: ` OTP sent an to `,
      user: user ? user._id : null,
    });

    await log.save();

    return {
      ...generator._doc,
      _id: generator.id,
      user: generator._doc.user,
      createdAt: new Date(generator._doc.createdAt).toISOString(),
      updatedAt: new Date(generator._doc.updatedAt).toISOString(),
    };
  },

  generateAdminOtp: async (args, req) => {
    const user = await Admin.findOne({ username: args.username });
    if (!user) {
      throw new Error("Invalid user!!!");
    }
    const otp = otpGenerator.generate(5, {
      upperCaseAlphabets: true,
      lowerCaseAlphabets: false,
      digits: true,
      specialChars: false,
    });

    const otpCreator = new OTP({
      otp: otp,
      verified: false,
      user: user.id,
    });
    const generator = await otpCreator.save();
    var options = {
      method: "POST",
      url: "https://sms.securifier.co.ke/SMSApi/send",
      headers: {
        Headers: "Content-Type:application/json",
      },
      formData: {
        userid: "safaribust",
        password: "qghckqHE",
        mobile: `${user.phone}`,
        senderid: "SAFARIBUST",
        msg: `OTP: ${otp}`,
        sendMethod: "quick",
        msgType: "text",
        output: "json",
        duplicatecheck: "true",
      },
    };
    request(options, function (error, response) {
      if (error) throw new Error(error);
      // console.log(response.body);
    });

    const ipAddress = req.socket.remoteAddress;
    const log = new AdminLog({
      ip: ipAddress,
      description: `${user.username} sent an OTP to ${user.phone}`,
      user: generator.user._id,
    });

    await log.save();
    return {
      ...generator._doc,
      _id: generator.id,
      user: singleUser.bind(this, generator._doc.user),
      createdAt: new Date(generator._doc.createdAt).toISOString(),
      updatedAt: new Date(generator._doc.updatedAt).toISOString(),
    };
  },

  createChat: async (args, req) => {
    // Validate user existence (optional, depends on your use case)

    const user = await Player.findById(args.chatInput?.userId);

    if (!user) {
      throw new Error("User not found.");
    }

    // Create a new chat message
    const chat = new Chat({
      message: args.chatInput.message,
      user: args.chatInput.userId,
    });

    // Save the chat message to the database
    const savedChat = await chat.save();

    const createdChat = {
      ...savedChat._doc,
      _id: savedChat._id.toString(),
      userId: user,
      message: savedChat.message,
      createdAt: new Date(savedChat._doc.createdAt).toISOString(),
      updatedAt: new Date(savedChat._doc.updatedAt).toISOString(),
      Player: {
        _id: user._id.toString(), // Include the _id of the associated Player
      },
    };

    console.log(createdChat);
    return createdChat;
  },
};

module.exports = utilsResolvers;
