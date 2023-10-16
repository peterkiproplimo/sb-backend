require("dotenv").config();
const bcrypt = require("bcryptjs");
const otpGenerator = require("otp-generator");
const jwt = require("jsonwebtoken");
var request = require("request");

//importing mongoose models
const Logs = require("../models/logs");
const Account = require("../models/Account");
const AdminLog = require("../models/adminlogs");
const User = require("../models/User");
const Player = require("../models/Player");
const Admin = require("../models/admins");
const OTP = require("../models/verifier");
const userResolvers = {
  getUsers: async () => await User.find(),
  deleteUsers: async () => await User.find(),

  createUser: (args, req) => {
    const phoneNumber = formatKenyanPhoneNumber(args.userInput.phoneNumber);
    return User.findOne({
      username: args.userInput.username,
    })
      .then((user) => {
        if (user) {
          throw new Error("User already exists!!!");
        }
        return bcrypt.hash(args.userInput.password, 12);
      })
      .then(async (hashedPass) => {
        const user = new User({
          role: args.userInput.roleId,
          username: args.userInput.username,
          phoneNumber: phoneNumber,
          password: hashedPass,
        });
        return user.save();
      })
      .then(async (result) => {
        console.log(123);
        const ipAddress = req.socket.remoteAddress;
        const log = new AdminLog({
          ip: ipAddress,
          description: `Created a new user ${args.userInput.username}`, //this will be changed to the authenticated user creating the logs
          user: result.id,
        });

        await log.save();
        return result;
      });
  },

  updateUser: (args, req) => {
    const phoneNumber = formatKenyanPhoneNumber(args.userInput.phoneNumber);
    return User.findB({
      username: args.userInput.username,
    })
      .then((user) => {
        if (!user) {
          throw new Error("User NOT found!!");
        }
        user.role = args.userInput.roleId;
        user.username = args.userInput.username;
        user.phoneNumber = phoneNumber;
        user.password = hashedPass;
        return user.save();
      })
      .then(async (result) => {
        console.log(123);
        const ipAddress = req.socket.remoteAddress;
        const log = new AdminLog({
          ip: ipAddress,
          description: `Created a new user ${args.userInput.username}`, //this will be changed to the authenticated user creating the logs
          user: result.id,
        });

        await log.save();
        return result;
      });
  },

  deleteUser: (args, req) => {
    const phoneNumber = formatKenyanPhoneNumber(args.userInput.phoneNumber);
    return User.findOne({
      username: args.userInput.username,
    })
      .then((user) => {
        if (!user) {
          throw new Error("User NOT found!!");
        }
        user.role = args.userInput.roleId;
        user.username = args.userInput.username;
        user.phoneNumber = phoneNumber;
        user.password = hashedPass;
        return user.save();
      })
      .then(async (result) => {
        console.log(123);
        const ipAddress = req.socket.remoteAddress;
        const log = new AdminLog({
          ip: ipAddress,
          description: `Created a new user ${args.userInput.username}`, //this will be changed to the authenticated user creating the logs
          user: result.id,
        });

        await log.save();
        return result;
      });
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

const MsgSend = async (otp, phone) => {
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
  await request(options, function (error, response) {
    if (error) throw new Error(error);
    // console.log(response.body);
  }).then((response) => {
    // console.log(response);
  });
  return "OK";
};

module.exports = userResolvers;
