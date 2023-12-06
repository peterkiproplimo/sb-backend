require("dotenv").config();
const bcrypt = require("bcryptjs");
const otpGenerator = require("otp-generator");
const jwt = require("jsonwebtoken");
var request = require("request");

//importing mongoose models
const Logs = require("../models/logs");
const Account = require("../models/Account");
const AdminLog = require("../models/AdminLogs");
const User = require("../models/User");
const Player = require("../models/Player");
const Admin = require("../models/admins");
const OTP = require("../models/verifier");
const userResolvers = {
  // admin login route
  // adminOLDLOGIN: async ({ username, password }) => {
  //   const user = await User.findOne({ username: username });
  //   if (!user) {
  //     throw new Error("User Not Found");
  //   }
  //   const isUser = await bcrypt.compare(password, user.password);
  //   if (!isUser) {
  //     throw new Error("Incorrect Password/Username");
  //   }

  //   const token = await jwt.sign(
  //     { userId: user.id, username: user.username },
  //     process.env.SECRET_KEY,

  //     { expiresIn: "7d" }
  //   );
  //   return {
  //     userId: user.id,
  //     username: user.username,
  //     role: user.role,
  //     token,
  //     tokenValidity: 24000,
  //   };
  // },
  // users methods
  getUser: async ({ userId }) => await User.findById(userId),
  // getUsers: async () => await User.find().sort({ createdAt: -1 }),
  getUsers: async (args, req) => {
    try {
      let users;
      const searchTerm = args.searchTerm;
      const status = parseInt(args.status) || "";
      // Apply pagination
      const page = parseInt(args.page) || 1;
      const pageSize = parseInt(args.per_page) || 10;

      // Check if input object is provided
      if (searchTerm == "" || !searchTerm) {
        // If no input is provided, return all records with pagination
        users = await User.find()
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .sort({ createdAt: -1 })
          .lean();
      } else {
        // Use a regular expression to perform a case-insensitive search
        const regex = new RegExp(searchTerm, "i");

        // Find the player by username
        const player = await User.findOne({ username: { $in: [regex] } }).exec();
        // console.log(player)

        // Define the filter criteria based on the search term and user ID
        const filter = {
          $or: [
            { status: status },
            { username: { $in: [regex] } },
            { phoneNumber: { $in: [regex] } },
            { role: { $in: [regex] } },
            // Add more fields as needed
          ],
        };

        // Perform the search with filter      // Use lean() to convert the documents to plain JavaScript objects
        users = await PlayerBet.find(filter)
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .sort({ createdAt: -1 })
          .lean();
      }

      // console.log(bets);

      // Calculate pagination metadata
      const totalItems = await User.countDocuments();
      const totalPages = Math.ceil(totalItems / pageSize);

      return {
        users: users,
        paginationInfo: {
          total_pages: totalPages,
          current_page: page,
          total_items: totalItems,
          per_page: pageSize,
        },
      };
    } catch (error) {
      console.log(error);
      throw new Error("Error fetching users", "INTERNAL_SERVER_ERROR");
    }
  },

  updateOrCreateUser: async (args, req) => {
    if (!req.isAuth) {
      throw new Error("Unauthenticated");
    }
    const phoneNumber = formatKenyanPhoneNumber(args.userInput.phoneNumber);
    // if userid is present, update user
    if (args.userId) {
      // console.log(args.userId);

      return User.findById(args.userId).then(async (user) => {//get user by id
        if (user.username !== args.userInput.username) { //check if username  is new
            taken_username = await User.findOne({username: args.userInput.username}) //find if username is taken                    
            if (taken_username) {
              throw new Error("Username already taken!!!");
            }
        }
        user.role = args.userInput.role
        user.username = args.userInput.username
        user.phoneNumber = phoneNumber

        await user.save()
        const log = new AdminLog({
          ip: req.socket.remoteAddress,
          action : "Update User",
          description: `Updated a user ${user.username}`, //this will be changed to the authenticated user creating the logs
          user: req.user.userId,
        });

        await log.save();
        return {
          status: "success",
          message: `${args.userInput.username} updated successfully`,
        };
      })

    }
    // else create user
    return User.findOne({
      username: args.userInput.username,
    })
      .then(async (user) => {
        if (user) {
          throw new Error("User already exists!!!");
        }


        return bcrypt.hash(args.userInput.password, 12);
      })
      .then(async (hashedPass) => {
        const user = new User({
          role: args.userInput.role,
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
          action : "Create User",
          description: `Created a new user ${result.username}`, //this will be changed to the authenticated user creating the logs
          user: req.user.userId,
        });

        await log.save();
        return {
          status: "success",
          message: `${result.username} role created`,
        };
        return result;
      });
  },

  getUserData: async (args, req)=>{
    if (!req.isAuth) {
      throw new Error("Unauthenticated");
    }
    const userdata = await User.findById(req.user.userId)
    return userdata;
  },  
  
  changeAdminPassword: async (args, req) => {

    if (!req.isAuth) {
      throw new Error("Unauthenticated");
    }
    try {
       const user = await User.findById(req.user.userId)
       console.log(user)
       hashedPass = await bcrypt.hash(args.password, 12);

       user.password = hashedPass;

       user.save()

       const ipAddress = req.socket.remoteAddress;
        const log = new AdminLog({
          ip: ipAddress,
          action : "Change Password",
          description: `Password changed for ${user.username}`, //this will be changed to the authenticated user creating the logs
          user: req.user.userId,
        });

        await log.save();
       return{
        status: "success",
        message: `${user.username} password changed`,
       }
    } catch (error) {
      throw new Error(error);
    }  
  },

  updateUser: (args, req) => {
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

  deleteUser: (args, req) => {
    return User.findById(args.userId)
      .then((user) => {
        if (!user) {
          throw new Error("User NOT found!!");
        }
        // user.deleted = true;
        // Disable soft delete enable hard delete
        return User.deleteOne({ _id: args.userId });
        // return user.save();
      })
      .then(async (result) => {
        console.log(123);
        const ipAddress = req.socket.remoteAddress;
        const log = new AdminLog({
          ip: ipAddress,
          description: `Deleted a user ${args.username}`, //this will be changed to the authenticated user creating the logs
          user: result.id,
        });

        await log.save();
        return {
          status: "success",
          message: `Deleted user ${args.username}`,
        };
      });
  },
  restoreUser: (args, req) => {
    return User.findById(args.userId)
      .then((user) => {
        if (!user) {
          throw new Error("User NOT found!!");
        }
        user.deleted = false;
        return user.save();
      })
      .then(async (result) => {
        console.log(123);
        const ipAddress = req.socket.remoteAddress;
        const log = new AdminLog({
          ip: ipAddress,
          description: `Deleted a user ${args.username}`, //this will be changed to the authenticated user creating the logs
          user: result.id,
        });

        await log.save();
        return {
          status: "success",
          message: `Deleted user ${args.username}`,
        };
      });
  },

  suspendUser: (args, req) => {
    console.log(req.isAuth);
    if (!req.isAuth) {
      throw new Error("Unauthenticated");
    }
    var name;
    var message;
    return User.findById(args.userId)
      .then((user) => {
        if (!user) {
          throw new Error("Player NOT found!!");
        }
        name = user.username;
        message = user.status
          ? `Suspended user ${name}`
          : `Activated user ${name}`;
        user.status = !user.status;
        return user.save();
      })
      .then(async (result) => {
        console.log(result);
        const ipAddress = req.socket.remoteAddress;
        const log = new AdminLog({
          ip: ipAddress,
          action: result.status ? "Activate User" : "Suspend User",
          description: message, //this will be changed to the authenticated user creating the logs
          user: req.user.userId,
        });

        await log.save();
        return {
          status: "success",
          message: message,
        };
      });
  },
  activateUser: (args, req) => {
    if (!req.isAuth) {
      throw new Error("Unauthenticated");
    }
    return User.findById(args.userId)
      .then((user) => {
        if (!user) {
          throw new Error("User NOT found!!");
        }
        user.active = true;
        return user.save();
      })
      .then(async (result) => {
        console.log(123);
        const ipAddress = req.socket.remoteAddress;
        const log = new AdminLog({
          ip: ipAddress,
          description: `Deleted a user ${args.username}`, //this will be changed to the authenticated user creating the logs
          user: result.id,
        });

        await log.save();
        return {
          status: "success",
          message: `Deleted user ${args.username}`,
        };
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
