require("dotenv").config();

const bcrypt = require("bcryptjs");
const moment = require("moment");


//importing mongoose models
const Account = require("../models/account");
const Bet = require("../models/bet");
const Logs = require("../models/logs");
const Admin = require("../models/admins");
const AdminLog=require("../models/adminlogs");
const house = require("../models/house");
const Actives = require("../models/activeusers");

const adminResolvers = {

    // Get the number of winners  in a particular month
    winnersPerMonth: async () => {
        const bets = await Bet.aggregate([
          { $match: { win: false } },
          {
            $group: {
              _id: { $substr: ["$createdAt", 5, 2] },
              amount: { $sum: "$betAmount" },
            },
          },
          { $sort: { amount: 1, _id: 1 } },
        ]);
        let bt=bets.filter(it=>+it._id === new Date().getMonth()+1)
        console.log(bt);
        return bt;
      },


    //  Total losers per month 

      losersPerMonth: async () => {
        const bets = await Bet.aggregate([
          { $match: { win: true } },
          {
            $group: {
              _id: { $substr: ["$createdAt", 5, 2] },
              amount: { $sum: { $add: ["$amount", "$tax"] } },
            },
          },
          { $sort: { amount: 1, _id: 1 } },
        ]);
       let bt=bets.filter(it=>+it._id === new Date().getMonth()+1)
        return bt;
      },

   // Total bets per month

      betsPerMonth: async () => {
        const bets = await Bet.aggregate([
          {
            $group: {
              _id: { $substr: ["$createdAt", 5, 2] },
              numberofbets: { $sum: 1 },
            },
          },
        ]);
        // console.log(bets);
        return bets;
      },

    //    Total number of users per month

      usersPerMonth: async () => {
        const bets = await User.aggregate([
          { $match: { type: "User" } },
          {
            $group: {
              _id: { $substr: ["$createdAt", 5, 2] },
              amount: { $sum: 1 },
            },
          },
          { $sort: { amount: 1, _id: 1 } },
        ]);
        //console.log(bets);
        return bets;
      },

    //  Active users per month

      activesPerMonth: async () => {
        const bets = await Actives.aggregate([
          { $unwind: "$username" },
          {
            $group: {
              _id: {
                username: "$username",
                createdAt: "$createdAt",
              },
              count: { $sum: 1 },
            },
          },
          {
            $group: {
              _id: { $substr: ["$_id.createdAt", 5, 2] },
              distinctV: {
                $addToSet: {
                  value: "$_id.username",
                  numberOfValues: "$count",
                },
              },
            },
          },
          {
            $project: {
              _id: 0,
              month: "$_id",
              distinctV: 1,
            },
          },
        ]);
    
        let dt = [];
        bets.map((item) => {
          let obj = {
            _id: item.month,
            amount: item.distinctV.length,
          };
          dt.push(obj);
        });
        return dt.sort((a, b) => a._id - b._id);
      },


      activeUser: async () => {
        const actives = await Actives.find().sort({ createdAt: -1 });
        let dt = [];
        if (actives) {
          actives.map((item) => {
            if (
              item.createdAt.toISOString().split("T")[0] ===
              moment(new Date()).format("YYYY-MM-DD")
            ) {
              let present = dt.filter((it) => item.username === it.username);
              if (present.length === 0) {
                dt.push(item);
              }
            }
          });
        }
        return dt.map((item) => {
          return {
            ...item?._doc,
            _id: item?.id,
            createdAt: new Date(item?._doc?.createdAt).toISOString(),
            updatedAt: new Date(item?._doc?.updatedAt).toISOString(),
          };
        });
      },


      actives: async (args, req) => {
   
        const users = await Actives.find().sort({ createdAt: -1 });
        // console.log(users);
        return users.map((user) => {
          return {
            ...user._doc,
            _id: user.id,
            createdAt: new Date(user._doc.createdAt).toISOString(),
            updatedAt: new Date(user._doc.updatedAt).toISOString(),
          };
        });
      },


    customerToTal: async () => {
        const accounts = await Account.find().sort({ createdAt: -1 });
      
        let sum = accounts.reduce((acc, obj) => {
          return acc + parseFloat(obj.balance);
        }, 0);
        return { amount: sum };
      },


    // Get a list of all the players

    players: async (args, req) => {
        const users = await Player.find().sort({ createdAt: -1 });
    
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


      taxToTal: async () => {
        const bets = await Bet.find().sort({ createdAt: -1 });
    
        let bts=bets.filter((item)=>item.createdAt.getMonth()+1 === new Date().getMonth()+1)
    
        let sum = bts.reduce((acc, obj) => {
          return acc + parseFloat(obj.tax);
        }, 0);
    
        return { amount: sum };
      },

    //    Get a list of all the admins

      admins: async (args, req) => {
    
        const users = await Admin.find().sort({ createdAt: -1 });
    
        return users.map((user) => {
          return {
            ...user._doc,
            _id: user.id,
            createdAt: new Date(user._doc.createdAt).toISOString(),
            updatedAt: new Date(user._doc.updatedAt).toISOString(),
          };
        });
      },


    //  Get a list of all the accounts

      accounts: async (args, req) => {
  
        const acc= await Account.find().sort({ createdAt: -1 })
           return acc.map(async(acc) => {
                     // const user = await singleUser.bind(this, acc?._doc.user)
             const user = await User.findOne({_id:acc?._doc.user})
             return {  
               ...acc?._doc,
               _id: acc?.id,
               user: user,
               createdAt: new Date(acc?._doc?.createdAt).toISOString(),
               updatedAt: new Date(acc?._doc?.updatedAt).toISOString(),
             }
           });
     
       },

    //  Get all the system logs for the admin

       systemLogs: async (args, req) => {
        const logs = await AdminLog.find().sort({ createdAt: -1 }).limit(200);
        return logs.map((it) => {
          return {
            ...it._doc,
            _id: it.id,
            user: singleUser.bind(this, it._doc.user),
            createdAt: new Date(it._doc.createdAt).toISOString(),
            updatedAt: new Date(it._doc.updatedAt).toISOString(),
          };
        });
      },
   

      // Get all the logs from the database

      logs: async (args, req) => {
        const logs = await Logs.find().sort({ createdAt: -1 }).limit(200);
        return logs.map((log) => {
          return {
            ...log._doc,
            _id: log?.id,
            user: singleUser.bind(this, log._doc.user),
            createdAt: new Date(log?._doc?.createdAt).toISOString(),
            updatedAt: new Date(log?._doc?.updatedAt).toISOString(),
          };
        });
      },
  
    /// Suspending a player from the system

      suspendPlayer: async (args, req) => {
        let filter = { username: args.username };
        let update = { active: false };
        const user = await Admin.findOneAndUpdate(filter, update);
        const ipAddress = req.socket.remoteAddress;
        const log = new AdminLog({
          ip: ipAddress,
          description: `${args.initiator} suspended ${user.username}`,
          user: user.id,
        });
    
        await log.save();
        return {
          ...user._doc,
          _id: user.id,
          createdAt: new Date(user._doc.createdAt).toISOString(),
          updatedAt: new Date(user._doc.updatedAt).toISOString(),
        };
      },



    // Suspend an account

      suspendAccount: async (args, req) => {
        let filter = { _id: args.accountId };
        let update = { active: false };
        const account = await Account.findOneAndUpdate(filter, update);
        const ipAddress = req.socket.remoteAddress;
        const log = new AdminLog({
          ip: ipAddress,
          description: `${args.initiator} suspended ${account.id}`,
          user: account.user.id,
        });
    
        await log.save();
    
        return {
          ...account._doc,
          _id: account.id,
          user: singleUser.bind(this, account._doc.user),
          createdAt: new Date(account._doc.createdAt).toISOString(),
          updatedAt: new Date(account._doc.updatedAt).toISOString(),
        };
      },

  //  Activate a particular account.

      activateAccount: async (args, req) => {
        let filter = { _id: args.accountId };
        let update = { active: true };
        const account = await Account.findOneAndUpdate(filter, update);
        const ipAddress = req.socket.remoteAddress;
        const log = new AdminLog({
          ip: ipAddress,
          description: `${args.initiator} activated ${account.id}`,
          user: account.user.id,
        });
    
        await log.save();
        return {
          ...account._doc,
          _id: account.id,
          user: singleUser.bind(this, account._doc.user),
          createdAt: new Date(account._doc.createdAt).toISOString(),
          updatedAt: new Date(account._doc.updatedAt).toISOString(),
        };
      },

//  Activate a player in the system

      activatePlayer: async (args, req) => {
        let filter = { username: args.username };
        let update = { active: true };
        const user = await Admin.findOneAndUpdate(filter, update);
        const ipAddress = req.socket.remoteAddress;
        const log = new AdminLog({
          ip: ipAddress,
          description: `${args.initiator} activated ${user.username}`,
          user: user.id,
        });
    
         await log.save();
        return {
          ...user._doc,
          _id: user.id,
          createdAt: new Date(user._doc.createdAt).toISOString(),
          updatedAt: new Date(user._doc.updatedAt).toISOString(),
        };
      },


    // Refunding a particular user account

      refundAccount: async (args, req) => {
        const account = await Account.findOne({ user: args.userId });
        if(!account && +args.amount < 0){
          return
        }
        let bal=account.balance 
        account.balance = args.amount;
        const doc = await account.save();
    
        //Refund account
        if (args.backend !== true) {
          const houseAccount = await house.findOne({
            user: "62fb898a4a4d42002392750d",
          });
          houseAccount.houseTotal =
            +houseAccount?.houseTotal - +args?.amount;
    
          await houseAccount.save();
        }
    
        //save logs
        const ipAddress = req.socket.remoteAddress;
        const log = new Logs({
          ip: ipAddress,
          description: `Account refunded ${parseFloat( +args.amount - +bal ).toFixed(2)}- Account Name:${account.user.username}`,
          user: args.userId,
          balance:account.balance
        });
    
       await log.save();
        return {
          ...doc._doc,
          _id: doc.id,
          user: singleUser.bind(this, doc._doc.user),
          createdAt: new Date(doc._doc.createdAt).toISOString(),
          updatedAt: new Date(doc._doc.updatedAt).toISOString(),
        };
      },


    //  Refunding a particular user's account

      adminrefundAccount: async (args, req) => {
        const account = await Account.findOne({ user: args.userId });
        if(!account && parseFloat(args.amount) < 1){
          return
        }
        let filter = { user: args.userId };
        let update = {
          balance: `${+account?.balance + +args.amount}`,
        };
        const doc = await Account.findOneAndUpdate(filter, update);
    
        if (args.backend !== true) {
          const houseAccount = await house.findOne({
            user: "62fb898a4a4d42002392750d",
          });
          houseAccount.houseTotal =
            +houseAccount?.houseTotal - +args?.amount;
    
          await houseAccount.save();
        }
    
        const ipAddress = req.socket.remoteAddress;
        const log = new AdminLog({
          ip: ipAddress,
          description: `${args.initiator} refunded ${args.amount}- Account Name:${account?.user?.username}`,
          user: args.userId,
        });
    
        await log.save();
        return {
          ...doc._doc,
          _id: doc.id,
          user: singleUser.bind(this, doc._doc.user),
          createdAt: new Date(doc._doc.createdAt).toISOString(),
          updatedAt: new Date(doc._doc.updatedAt).toISOString(),
        };
      },


    //  Deduct  account balance

      deductAccountBalance: async (args, req) => {
        const user = await User.findOne({_id:args.userId})
    
        if(user.dataToken !== args.dataToken){
          throw new Error("Session expired!!!")
        }
    
        const account = await Account.findOne({ user: args.userId });
        if(+account.balance <0){
          account.balance = "0";
          throw new Error("Insufficient funds")
        }
        let bal =account.balance
        account.balance=args.amount;
        const doc = await account.save();
    
        const ipAddress = req.socket.remoteAddress;
        const log = new Logs({
          ip: ipAddress,
          description: `Deducted ${parseFloat(+args.amount-+bal).toFixed(2)} - Account Name:${account?.user.username}`,
          user: args.userId,
          balance:account.balance
        });
    
        await log.save();
        return {
          ...doc._doc,
          _id: doc.id,
          user: singleUser.bind(this, doc._doc.user),
          createdAt: new Date(doc._doc.createdAt).toISOString(),
          updatedAt: new Date(doc._doc.updatedAt).toISOString(),
        };
      },

    //    Admin deduct account balance

      admindeductAccountBalance: async (args, req) => {
        const account = await Account.findOne({ user: args.userId });
        let filter = { user: args.userId };
        let update = {
          balance: `${+account?.balance - +args.amount}`,
        };
        const doc = await Account.findOneAndUpdate(filter, update);
    
        const ipAddress = req.socket.remoteAddress;
        const log = new AdminLog({
          ip: ipAddress,
          description: `${args.initiator} deducted account ${args.amount} - Account Name:${account?.user?.username}`,
          user: args.userId,
        });
    
        await log.save();
        return {
          ...doc._doc,
          _id: doc.id,
          user: singleUser.bind(this, doc._doc.user),
          createdAt: new Date(doc._doc.createdAt).toISOString(),
          updatedAt: new Date(doc._doc.updatedAt).toISOString(),
        };
      },

    //    Change admin password
      changeAdminPassword: async (args, req) => {
        const user = await Admin.findOne({ username: args.username });
        if (!user) {
          throw new Error("User does'nt exist.");
        }
        return bcrypt
          .hash(args.password, 12)
          .then((hashedPass) => {
            user.password = hashedPass;
            return user.save();
          })
          .then(async(usr) => {
            const ipAddress = req.socket.remoteAddress;
            const log = new AdminLog({
              ip: ipAddress,
              description: `${args.initiator} changed password for ${user.username}`,
              user: usr.id,
            });
    
            await log.save();
            return { ...usr._doc, _id: usr.id, password: null };
          })
          .catch((err) => console.log(err.message));
      },



    //    Edit admin user phone number
      editAdminUserPhone: async (args, req) => {
        const user = await User.findOne({ username: args.username });
       if (!user) {
         throw new Error("User does'nt exist.");
       }
       user.phone = args.phone;
       return user
         .save()
         .then(async(usr) => {
           const ipAddress = req.socket.remoteAddress;
           const log = new AdminLog({
             ip: ipAddress,
             description: `${args.initiator} changed user phone to ${user.phone}`,
             user: usr.id,
           });
   
           await log.save();
           return { ...user._doc, _id: user.id, password: null };
         })
         .catch((err) => console.log(err.message));
     },


    //   Edit admin user
     editAdminUser: async (args, req) => {
        const user = await Admin.findOne({ username: args.username });
        if (!user) {
          throw new Error("User does'nt exist.");
        }
        user.type = args.type;
        user.phone = args.phone
        return user
          .save()
          .then(async(usr) => {
            const ipAddress = req.socket.remoteAddress;
            const log = new AdminLog({
              ip: ipAddress,
              description: `${args.initiator} edited user ${args.username}`,
              user: usr.id,
            });
    
            await log.save();
            return { ...user._doc, _id: user.id, password: null };
          })
          .catch((err) => console.log(err.message));
      },


//  Change user type

      changeType: async (args, req) => {
        const user = await Admin.findOne({ username: args.username });
        if (!user) {
          throw new Error("User does'nt exist.");
        }
        user.type = args.type;
        return user
          .save()
          .then(async (usr) => {
            const ipAddress = req.socket.remoteAddress;
            const log = new AdminLog({
              ip: ipAddress,
              description: `${args.initiator} changed user type for ${user.type}`,
              user: usr.id,
            });
    
            await log.save();
            return { ...user._doc, _id: user.id, password: null };
          })
          .catch((err) => console.log(err.message));
      },


//  Create active users

      createActives: async (args, req) => {
        const user = await User.findOne({ username: args.user });
        const activeUser = new Actives({
          username: user.username,
          type: user.username,
          phone: user.phone,
          online: user.online,
          active: user.active,
        });
        const active = await activeUser.save();
        const ipAddress = req.socket.remoteAddress;
        const accnt = await Account.findOne({ user: user.id });
        const log = new Logs({
          ip: ipAddress,
          description: `User placed a bet for round ${args.round}`,
          user: user.id,
          round: args.round,
          balance:+accnt.balance
        });
    
        await log.save();
        return {
          ...active._doc,
          _id: active.id,
          createdAt: new Date(active._doc.createdAt).toISOString(),
          updatedAt: new Date(active._doc.updatedAt).toISOString(),
        };
      },


    // Create system logs

      createLogs: async (args, req) => {
        const ipAddress = req.socket.remoteAddress;
        const log = new Logs({
          ip: ipAddress,
          description: args.logsInput.description,
          user: args.logsInput.userId,
          round: args.logsInput.round,
        });
    
    
        const results = await log.save();
    
        return {
          ...results._doc,
          _id: results.id,
          user: singleUser.bind(this, results._doc.user),
          createdAt: new Date(results._doc.createdAt).toISOString(),
          updatedAt: new Date(results._doc.updatedAt).toISOString(),
        };
      },
  

    //    Update house
      updateHouse: async (args, req) => {
        const log = new house({
          houseTotal: 0,
          user: args.userId,
        });
    
        const results = await log.save();
    
        return {
          ...results._doc,
          _id: results.id,
          createdAt: new Date(results._doc.createdAt).toISOString(),
          updatedAt: new Date(results._doc.updatedAt).toISOString(),
        };
      },
      
};

module.exports = adminResolvers;

