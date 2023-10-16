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
    const otp = await OTP.findOne({ otp: args.otp }).sort({
      createdAt: -1,
    });

    if (
      !otp ||
      parseInt(new Date().toISOString().split("T")[1].substr(3, 2)) -
        parseInt(otp.createdAt.toISOString().split("T")[1].substr(3, 2)) >
        10
    ) {
      throw new Error("Invalid OTP!!!");
    }
    otp.verified = true;

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
    // const user = await Player.findOne({ username: args.username });

    const phone = formatKenyanPhoneNumber(args.phone);

    const player = Player.findOne({
      $or: [{ username: args.username }, { phone: phone }],
    });

    if (player) {
      throw new Error("Player already exists!!!");
    }

    console.log("This is my phone number", args.phone);
    const otp = otpGenerator.generate(5, {
      upperCaseAlphabets: true,
      lowerCaseAlphabets: false,
      digits: true,
      specialChars: false,
    });

    const otpCreator = new OTP({
      otp: otp,
      verified: false,
      phone: phone,
      username: args.username,
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
        mobile: `${phone}`,
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

    return {
      ...generator._doc,
      _id: generator._id,
      user: args.username,
      createdAt: new Date(generator._doc.createdAt).toISOString(),
      updatedAt: new Date(generator._doc.updatedAt).toISOString(),
    };
  },

  generateForgetpasswordOtp: async (args, req) => {
    const user = await Player.findOne({ username: args.username });

    const phone = formatKenyanPhoneNumber(user.phone);

    console.log("This is my phone number", user.phone);
    const otp = otpGenerator.generate(5, {
      upperCaseAlphabets: true,
      lowerCaseAlphabets: false,
      digits: true,
      specialChars: false,
    });

    const otpCreator = new OTP({
      otp: otp,
      verified: false,
      phone: phone,
      username: args.username,
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
        mobile: `${phone}`,
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

    return {
      ...generator._doc,
      _id: generator._id,
      user: args.username,
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

function formatKenyanPhoneNumber(phoneNumber) {
  // Remove any spaces and non-numeric characters
  phoneNumber = phoneNumber.replace(/\D/g, "");

  // Check if the phone number starts with "254" and has 12 digits (including the country code)
  if (/^254\d{9}$/.test(phoneNumber)) {
    return phoneNumber; // Phone number is already in the correct format
  } else if (/^0\d{9}$/.test(phoneNumber)) {
    // Add "254" in front of the phone number
    return "254" + phoneNumber.slice(1);
  } else {
    // Handle invalid phone numbers
    return "Invalid phone number";
  }
}

module.exports = utilsResolvers;
