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
  createUser: (args, req) => {
    return Player.findOne({ username: args.userInput.username })
      .then((user) => {
        if (user) {
          throw new Error("Username already exists!!!");
        }
        return bcrypt.hash(args.userInput.password, 12);
      })
      .then((hashedPass) => {
        const otp = otpGenerator.generate(12, {
          upperCaseAlphabets: true,
          lowerCaseAlphabets: false,
          digits: true,
          specialChars: false,
        });

        const user = new Player({
          type: args.userInput.type,
          username: args.userInput.username,
          active: true,
          phone: args.userInput.phone,
          online: false,
          password: hashedPass,
          dataToken: otp,
          label: "1",
          firstDeposit: 0,
        });
        return user.save();
      })
      .then(async (result) => {
        if (result) {
          const account = new Account({
            balance: "0.00",
            phone: args.userInput.phone,
            active: true,
            user: result.id,
          });
          await account.save();

          const ipAddress = req.socket.remoteAddress;
          const log = new AdminLog({
            ip: ipAddress,
            description: `Created a new user ${args.userInput.username}`,
            user: result.id,
          });

          return log.save();
          // console.log(log);
        }
      })
      .then(async (result) => {
        const myuser = Player.findOne({ username: args.userInput.username });
        console.log(myuser);
        const mresult = await generateOtp(
          myuser,
          myuser.phone,
          "register",
          myuser.username
        );
        if (mresult) {
          const token = await jwt.sign(
            {
              userId: result.id,
              username: result.username,
              online: result.online,
              phone: result.phone,
            },
            "thisissupposedtobemysecret",
            {
              expiresIn: 60 * 15,
            }
          );
          return {
            userId: result.id,
            username: result.username,
            type: result.type,
            token: token,
            tokenExpiration: 15,
            online: result.online,
          };
        }
      })
      .catch((err) => {
        console.log(err);
        throw err;
      });
  },

  users: async (args, req) => {
    // if (!req.isAuth) {
    //   throw new Error("Not authenticated.");
    // }
    const users = await User.find().sort({ createdAt: -1 });
    const usrs = users.filter((item) => item.type === "User");
    return usrs.map((user) => {
      return {
        ...user._doc,
        _id: user.id,
        createdAt: new Date(user._doc.createdAt).toISOString(),
        updatedAt: new Date(user._doc.updatedAt).toISOString(),
      };
    });
  },

  players: async (args, req) => {
    const users = await Player.find().sort({ createdAt: -1 });

    const usrs = users.filter((item) => item.type === "regular");

    return usrs.map((user) => {
      return {
        ...user._doc,
        _id: user.id,
        createdAt: new Date(user._doc.createdAt).toISOString(),
        updatedAt: new Date(user._doc.updatedAt).toISOString(),
      };
    });
  },
  createAdmin: (args, req) => {
    return Admin.findOne({ username: args.userInput.username })
      .then((user) => {
        if (user) {
          throw new Error("Username already exists!!!");
        }
        return bcrypt.hash(args.userInput.password, 12);
      })
      .then((hashedPass) => {
        const user = new Admin({
          type: args.userInput.type,
          username: args.userInput.username,
          active: true,
          phone: args.userInput.phone,
          online: true,
          password: hashedPass,
        });
        return user.save();
      })
      .then(async (result) => {
        if (result) {
          const ipAddress = req.socket.remoteAddress;
          const log = new AdminLog({
            ip: ipAddress,
            description: `${args.userInput.initiator} created admin ${args.userInput.username}`,
            user: result.id,
          });

          await log.save();
        }
        const token = await jwt.sign(
          {
            userId: result.id,
            username: request.username,
            online: result.online,
            phone: result.phone,
          },
          "thisissupposedtobemysecret",
          {
            expiresIn: 60 * 15,
          }
        );
        // console.log({ userId: user.id, type:user.type, token: token, tokenExpiration: 1 })
        return {
          userId: result.id,
          type: result.type,
          token: token,
          username: result.username,
          online: result.online,
          tokenExpiration: 15,
          phone: result.phone,
        };
        // return { ...result._doc, _id: result.id, password: null };
      })
      .catch((err) => {
        console.log(err);
        throw err;
      });
  },

  //  Find one user detail
  aUser: async (args, req) => {
    try {
      const user = await Player.findOne({ username: args.username });

      if (!user) {
        return {
          code: 404,
          message: "User does not exist",
        };
      }

      return user;
    } catch (error) {
      // Handle other potential errors here if needed
      console.error("Error fetching user:", error);
      return {
        code: 500, // Internal Server Error
        message: "An error occurred while fetching the user.",
      };
    }
  },

  //  Change player password - DONE

  changePassword: async (args, req) => {
    const user = await Player.findOne({ username: args.username });
    if (!user) {
      throw new Error("User does'nt exist.");
    }

    return bcrypt
      .hash(args.password, 12)
      .then((hashedPass) => {
        user.password = hashedPass;
        return user.save();
      })
      .then(async (usr) => {
        const ipAddress = req.socket.remoteAddress;
        const log = new Logs({
          ip: ipAddress,
          description: `${args.initiator} changed password`,
          user: usr.id,
        });

        await log.save();
        return {
          ...usr._doc,
          _id: usr.id,
          password: null,
          createdAt: "ada",
          updatedAt: "adad",
        };
      })
      .catch((err) => console.log(err.message));
  },
};

const generateOtp = async (user, phone, username, type, req) => {
  const otp = otpGenerator.generate(5, {
    upperCaseAlphabets: true,
    lowerCaseAlphabets: false,
    digits: true,
    specialChars: false,
  });

  const otpCreator = new OTP({
    otp: otp,
    verified: false,
    user: user ? user._id : null,
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
      mobile: "0741734820",
      senderid: "SAFARIBUST",
      msg: "This is my message",
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

  const ipAddress = "ada";
  const log = new Logs({
    ip: ipAddress,
    description: ` OTP sent to User`,
    user: user ? user._id : null,
  });

  await log.save();

  return {
    ...generator._doc,
    _id: generator._id,
    user: user,
    createdAt: new Date(generator._doc.createdAt).toISOString(),
    updatedAt: new Date(generator._doc.updatedAt).toISOString(),
  };
};

module.exports = userResolvers;
