const Player = require('../models/Player');
const Admin = require("../models/admins");
const bcrypt = require("bcryptjs");


const authResolvers = {

  login: async (args, req) => {
    const user = await Player.findOne({ username: args.loginInput.username });
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
  },


  adminLogin: async (args, req) => {
    console.log(args); 
    const user = await Admin.findOne({
      username: args.loginInput.username, 
    });
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
      type: user.type,
      token: token,
      online: user.online,
      tokenExpiration: 15,
    };
  },

  
};


// const singleUser = async (userID) => {
//   try {
//     const user = await User.findById(userID);
//     return {
//       ...user._doc,
//       _id: user.id,
//     };
//   } catch (err) {
//     throw err;
//   }
// };

module.exports = authResolvers;
