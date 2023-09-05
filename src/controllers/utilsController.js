
require("dotenv").config();

// import dependencies
const otpGenerator = require("otp-generator");
var request = require("request");

//importing mongoose models
const Logs = require("../models/logs");
const OTP = require("../models/verifier");
const Admin = require("../models/admins");
const AdminLog=require("../models/adminlogs");

const utilsResolvers = {
    verifyOtp: async (args, req) => {
        if (OTPs.includes(args.otp)) {
          // console.log("first")
          throw new Error("Invalid OTP!!!");
        }
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
    
        OTPs.push(args.otp);
    
        const verified = await otp.save();
    
        return {
          ...verified._doc,
          _id: verified.id,
          user: singleUser.bind(this, verified._doc.user),
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
          user:user? user.id:null,
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
            mobile: `${user?user.phone:args.phone}`,
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
          description: ` OTP sent an to ${user?user.phone.substr(
            1,
            13
          ):args.phone} - Username: ${args.username}`,
          user: user?user._id:null,
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
};

module.exports = utilsResolvers;