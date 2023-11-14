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
const PlayerBet = require("../models/PlayerBet");
const Transactions = require("../models/transactions");
const playerResolvers = {
  createPlayer: (args, req) => {
    const phoneNumber = formatKenyanPhoneNumber(args.userInput.phone);
    return Player.findOne({
      $or: [{ username: args.userInput.username }, { phone: phoneNumber }],
    })
      .then((user) => {
        if (user) {
          throw new Error("User already exists!!!");
        }
        return bcrypt.hash(args.userInput.password, 12);
      })
      .then(async (hashedPass) => {
        const otp = await OTP.findOne({
          otp: args.userInput.otp,
          phone: phoneNumber,
          verified: false,
        }).sort({
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

        await otp.save();

        const user = new Player({
          type: args.userInput.type,
          username: args.userInput.username,
          active: true,
          phone: phoneNumber,
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
          const phoneNumber2 = formatKenyanPhoneNumber(args.userInput.phone);
          const account = new Account({
            balance: "0.00",
            phone: phoneNumber2,
            active: true,
            user: result.id,
            karibubonus: 0,
            totalbetamount: 0,
            isfirstdebosit: false,
            bonusredeemed: false,
          });
          await account.save();

          const ipAddress = req.socket.remoteAddress;
          const log = new AdminLog({
            ip: ipAddress,
            description: `Created a new user ${args.userInput.username}`,
            user: result.id,
          });

          await log.save();
          return account;
          // console.log(log);
        }
      })
      .then(async (result) => {
        // console.log(result);
        const myuser = await Player.findOne({ phone: result.phone });

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
          username: myuser.username,
          type: myuser.type,
          token: token,
          tokenExpiration: 15,
          online: myuser.online,
        };
      })
      .catch((err) => {
        console.log(err);
        throw err;
      });
  },

  users: async (args, req) => {
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
  createAdmin: async (args, req) => {
    return User.findOne({ username: args.userInput.username })
      .then((user) => {
        if (user) {
          throw new Error("Username already exists!!!");
        }
        return bcrypt.hash(args.userInput.password, 12);
      })
      .then((hashedPass) => {
        const user = new User({
          type: args.userInput.type,
          username: args.userInput.username,
          active: true,
          phone: args.userInput.phone,
          online: true,
          role: args.userInput.roleId,
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
          type: "test",
          token: token,
          username: result.username,
          online: true,
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

  deleteAdmin: async (args, req) => {
    return User.findOne({ username: args.userInput.username })
      .then(async (user) => {
        if (user) {
          user.deleted = true;
          await user.save();
        }
      })
      .catch((err) => {
        console.log(err);
        throw err;
      });
  },

  //  Find one user detail
  aPlayer: async (args, req) => {
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
      throw new Error("Player does'nt exist.");
    }

    const otp = await OTP.findOne({
      otp: args.otp,
      username: args.username,
      verified: false,
    }).sort({
      createdAt: -1,
    });

    if (
      !otp ||
      parseInt(new Date().toISOString().split("T")[1].substr(3, 2)) -
        parseInt(otp.createdAt.toISOString().split("T")[1].substr(3, 2)) >
        10
    ) {
      throw new Error("Invalid OTP!!!");
    } else {
      otp.verified = true;

      await otp.save();

      return bcrypt
        .hash(args.password, 12)
        .then((hashedPass) => {
          user.password = hashedPass;
          user.online = false;

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
    }
  },

  // bY Machina
  getSinglePlayer: async (args, req) => {
    return await Player.findById(args.playerId)
      .then(async (player) => {
        if (!player) {
          throw new Error("User NOT found!!");
        }
        const account = await Account.findOne({ user: player.id });
        return { account, player };
      })
      .then(async (result) => {
        const bets = await PlayerBet.find({ userId: result.player.id }).sort({
          createdAt: -1,
        });
        const transactions = await Transactions.find({
          user: result.player.id,
        }).sort({ createdAt: -1 });
        return {
          player: result.player,
          account: result.account,
          transactions,
          bets,
        };
      });
  },
  suspendPlayer: (args, req) => {
    if (!req.isAuth) {
      throw new Error("Unauthenticated");
    }
    var name;
    var message;
    return Player.findById(args.playerId)
      .then((player) => {
        if (!player) {
          throw new Error("Player NOT found!!");
        }
        name = player.username;
        message = player.active
          ? `Suspended player ${name}`
          : `Activated player ${name}`;
        player.active = !player.active;
        return player.save();
      })
      .then(async (result) => {
        console.log(123);
        const ipAddress = req.socket.remoteAddress;
        const log = new AdminLog({
          ip: ipAddress,
          description: message, //this will be changed to the authenticated user creating the logs
          user: req.user,
        });

        await log.save();
        return {
          status: "success",
          message: message,
        };
      });
  },
  // activatePlayer: (args, req) => {
  //   return User.findById(args.userId)
  //     .then((user) => {
  //       if (!user) {
  //         throw new Error("User NOT found!!");
  //       }
  //       user.status = true
  //       return user.save();
  //     })
  //     .then(async (result) => {
  //       console.log(123);
  //       const ipAddress = req.socket.remoteAddress;
  //       const log = new AdminLog({
  //         ip: ipAddress,
  //         description: `Deleted a user ${args.username}`, //this will be changed to the authenticated user creating the logs
  //         user: result.id,
  //       });

  //       await log.save();
  //       return {
  //         status: "success",
  //         message: `Deleted user ${args.username}`,
  //       };
  //     });
  // },
};

const generateOtp = async (user, phone, type) => {
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
      mobile: `${phone}`,
      senderid: "SAFARIBUST",
      msg: `OTP: ${otp}`,
      sendMethod: "quick",
      msgType: "text",
      output: "json",
      duplicatecheck: "true",
    },
  };

  request(options, function (error) {
    if (error) throw new Error(error);
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

module.exports = playerResolvers;
