const connectToDatabase = require('../../config/database');
// const User = require('../models/Player');
const User = require("../models/users");
const Admin = require("../models/admins");

const crypto = require("crypto")



const userResolvers = {
createUser: (args, req) => {
      
  return User.findOne({ username: args.userInput.username })
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
          
      const user = new User({
        type: args.userInput.type,
        username: args.userInput.username,
        active: true,
        phone: args.userInput.phone,
        online: false,
        password: hashedPass,
        dataToken:otp,
        label:"1",
        firstDeposit:0
      });
      return user.save();
    })
    .then(async (result) => {
      if (result) {
        const account = new Account({
          balance: "0.00",
          phone:args.userInput.phone,
          active:true,
          user: result.id,
        });
        await account.save();
        //TODO: send a verification email
        const ipAddress = req.socket.remoteAddress;
        const log = new AdminLog({
          ip: ipAddress,
          description: `Created a new user ${args.userInput.username}`,
          user: result.id,
        });

        await log.save();
        console.log(log);
      }
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
      };
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
        tokenExpiration: 15,
      };
      // return { ...result._doc, _id: result.id, password: null };
    })
    .catch((err) => {
      console.log(err);
      throw err;
    });
},

}

module.exports = [userResolvers];