const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Account = require("../models/Account");
const { MsgSend } = require("./smsSend");
const PasswordReset = require("../models/PasswordReset");
const moment = require("moment");
const rnd = require("random-number");

const generateAccNo = () => {
  // create user account no using id
  // const arrOfDigits = Array.from(String(user.id), Number);
  const rnumber = Date.now() % 9999; //number to generate account
  const arrOfDigits = Array.from(String(rnumber), Number);
  let AccountNo = [];
  let toChars = "";
  arrOfDigits.forEach((n) => {
    toChars = `${n >= 26 ? toChars(Math.floor(n / 26) - 1) : ""}${
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[n % 26]
    }`;
    AccountNo.push(toChars);
  });
  AccountNo = AccountNo.join("");
  return AccountNo;
};

const register = async (phoneNumber, username, password) => {
  const user = await User.findOne({ phoneNumber: phoneNumber });
  if (user) {
    throw new Error("User Already Exists");
  }
  const hashedPassword = await bcrypt.hash(password, 12);
  const newUser = await User.create({
    phoneNumber: phoneNumber,
    username: username,
    password: hashedPassword,
    role: "player",
  });
  const AccountNo = await generateAccNo();
  const account = new Account({
    accountNumber: AccountNo,
    user: newUser,
  });
  await account.save();
  newUser.account = account;
  await newUser.save();
  return user;
};

module.exports = {
  register,

  login: async (phoneNumber, password) => {
    const user = await User.findOne({ phoneNumber: phoneNumber });
    if (!user) {
      throw new Error("User Not Found");
    }
    const isUser = await bcrypt.compare(password, user.password);
    if (!isUser) {
      throw new Error("Incorrect Password/Phone Number");
    }
    const token = await jwt.sign(
      { userId: user.id, phoneNumber: user.phoneNumber },
      process.env.SECRET_KEY,
      { expiresIn: "7d" }
    );
    return {
      userId: user.id,
      username: user.username,
      token,
      tokenValidity: 24000,
    };
  },

  Adminlogin: async (phoneNumber, password) => {
    const user = await User.findOne({ phoneNumber: phoneNumber });
    if (!user) {
      throw new Error("User Not Found");
    }
    const isUser = await bcrypt.compare(password, user.password);
    if (!isUser) {
      throw new Error("Incorrect Password/Phone Number");
    }
    if (user.role !== "admin") {
      throw new Error("You are not authorized");
    }
    const token = await jwt.sign(
      { userId: user.id, phoneNumber: user.phoneNumber },
      process.env.SECRET_KEY,
      { expiresIn: "7d" }
    );
    return {
      userId: user.id,
      username: user.username,
      token,
      tokenValidity: 24000,
    };
  },

  checkUser: async ({ phoneNumber }) => {
    const user = await User.findOne({ phoneNumber: phoneNumber });
    if (!user) {
      throw new Error("User Not Found");
    }
    try {
      const code = rnd({ min: 100000, max: 999999, integer: true });
      await PasswordReset.create({
        code: code,
        user: user,
      });
      const msgs =
        code +
        " is your VUTAPESA Verification Code. Please, ignore this message if you did not request your Password to be reset";
      await MsgSend(msgs, user.phoneNumber).then((res) => {
        return {
          status: "success",
          message: "Verification code sent to your phone",
        };
      });
    } catch (error) {
      throw new Error("Request Failed, Try again later!");
    }
  },

  confirmOTP: async ({ phoneNumber, code }) => {
    const resetCode = await PasswordReset.findOne({ code: code }).populate(
      "user"
    );
    if (!resetCode) {
      throw new Error("Invalid Code");
    }
    if (phoneNumber !== resetCode.user.phoneNumber) {
      resetCode.delete();
      throw new Error("Invalid Code phone Number");
    }
    try {
      const expired = moment().diff(moment(resetCode.createdAt));
      if (expired > 60000) {
        await resetCode.delete();
        throw new Error("Code Expired, Try again");
      }
      await resetCode.delete();
      return {
        status: "success",
        code: "success",
        message: "Code Verified",
      };
    } catch (error) {
      console.error(new Error(error));
      return {
        status: "error",
        message: "Request Failed",
      };
    }
  },
  passwordChange: async ({ phoneNumber, password }) => {
    const user = await User.findOne({ phoneNumber: phoneNumber }).populate(
      "account"
    );

    const hashedPassword = await bcrypt.hash(password, 12);
    user.password = hashedPassword;
    await user.save();
    // send password change message
    return {
      status: "success",
      code: "success",
      message: "password Changed",
    };
  },

  passwordLoggedIn: async (user, password) => {
    const hashedPassword = await bcrypt.hash(password, 12);
    user.password = hashedPassword;
    await user.save();
    // send password change message
    return {
      status: "success",
      code: "success",
      message: "Code Verified",
    };
  },
};
