require("dotenv").config();

const bcrypt = require("bcryptjs");
const moment = require("moment");
const mongoose = require("mongoose");
//importing mongoose models
const Account = require("../models/Account");
const Bet = require("../models/Bet");
const Logs = require("../models/logs");
const Admin = require("../models/admins");
const AdminLog = require("../models/AdminLogs");
const house = require("../models/house");
const Actives = require("../models/activeusers");
const Role = require("../models/roleModel");
const Permission = require("../models/permissionModel");
const permissions = require("../../permissions.json");
const Player = require("../models/Player");
const User = require("../models/User");
const Playerbet = require("../models/PlayerBet");
const Transaction = require("../models/transactions");

const connectToDatabase = require("../../config/database");

const AdminLogs = require("../models/AdminLogs");
async function fetchHouseRevenueData() {
  const today = new Date();
  let totalmoney = 0;
  // Set the time to midnight (00:00:00)
  today.setHours(0, 0, 0, 0);

  // Define the criteria for the query
  const criteria = {
    win: true,
    createdAt: { $gte: today },
  };

  // Create an aggregation pipeline to calculate the sum
  const pipeline = [
    { $match: criteria },
    {
      $group: {
        _id: null,
        totalAmount: {
          $sum: {
            $cond: [
              { $ifNull: ["$betAmount", false] },
              { $toDouble: "$betAmount" },
              0, // Default value for non-numeric values
            ],
          },
        },
      },
    },
  ];

  // Use Mongoose's aggregation framework to calculate the sum
  await Playerbet.aggregate(pipeline, (err, result) => {
    if (err) {
      console.error("Error calculating the sum:", err);
    } else {
      const sum = result.length > 0 ? result[0].totalAmount : 0;
      totalmoney = sum;
      // console.log("Sum of amount for Playerbets with win=false today:", sum);
    }
  });
  // console.log(total);
  return { currentDay: totalmoney };
  // Replace with actual data
}

async function fetchHouselosesTodayData() {
  const today = new Date();
  // Set the time to midnight (00:00:00)
  today.setHours(0, 0, 0, 0);
  let totalmoney = 0;
  // Define the criteria for the query
  const criteria = {
    win: false,
    createdAt: { $gte: today },
  };

  // Create an aggregation pipeline to calculate the sum
  const pipeline = [
    { $match: criteria },
    {
      $group: {
        _id: null,
        totalAmount: {
          $sum: {
            $cond: [
              { $ifNull: ["$winAmount", false] },
              { $toDouble: "$winAmount" },
              0, // Default value for non-numeric values
            ],
          },
        },
      },
    },
  ];

  // Use Mongoose's aggregation framework to calculate the sum
  await Playerbet.aggregate(pipeline, (err, result) => {
    if (err) {
      console.error("Error calculating the sum:", err);
    } else {
      const sum = result.length > 0 ? result[0].totalAmount : 0;

      totalmoney = sum;
      // console.log("Sum of amount for Playerbets with win=false today:", sum);
    }
  });
  return { currentDay: totalmoney };
  // Replace with actual data
}

function fetchMPESABalanceData() {
  return { paybillTotal: 0.0, b2cTotal: 0.0 }; // Replace with actual data
}
async function fetchPlayersData() {
  const playerCount = await Player.countDocuments({ type: "regular" });
  // const onlineUserCount = await Player.countDocuments({ online: true });
  const today = new Date();
  // Set the time to midnight (00:00:00)
  today.setHours(0, 0, 0, 0);

  // Define the criteria for the query
  const criteria = {
    action: "login",
    createdAt: { $gte: today },
  };

  const todayUserCount = 0;

  // Logs.countDocuments(criteria, (err, count) => {
  //   if (err) {
  //     console.error("Error counting logs:", err);
  //   } else {
  //     // console.log("Count of login logs today:", count);
  //   }
  // });

  return { total: playerCount, onlineToday: todayUserCount }; // Replace with actual data
}

async function fetchWithholdingTaxData() {
  let totalmoney = 0;
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  // Define the criteria for the query
  const criteria = {
    withholdingtax: { $exists: true }, // Ensure withholdingtax field exists
    createdAt: { $gte: firstDayOfMonth, $lte: lastDayOfMonth },
  };

  // Create an aggregation pipeline to calculate the sum of withholdingtax
  const pipeline = [
    { $match: criteria },
    {
      $group: {
        _id: null,
        totalMonthlyWithholdingTax: {
          $sum: "$withholdingtax",
        },
      },
    },
  ];

  // Use Mongoose's aggregation framework to calculate the sum
  await Playerbet.aggregate(pipeline, (err, result) => {
    if (err) {
      console.error("Error calculating the total withholding tax:", err);
    } else {
      // console.log(result.length);
      const total =
        result.length > 0 ? result[0].totalMonthlyWithholdingTax : 0;
      totalmoney = total;
      // console.log("Total withholding tax:", total);
    }
  });

  return { total: totalmoney }; // Replace with actual data
}

async function fetchWalletsTotalData() {
  let totalmoney = 0;
  const pipeline = [
    {
      $match: {
        _id: { $ne: mongoose.Types.ObjectId("6523f69762c8841fb3313ade") },
      },
    },
    {
      $group: {
        _id: null,
        totalBalance: { $sum: { $toDouble: "$balance" } },
      },
    },
  ];

  // Use Mongoose's aggregation framework to calculate the sum
  await Account.aggregate(pipeline, (err, result) => {
    if (err) {
      console.error("Error calculating the sum:", err);
    } else {
      const total = result.length > 0 ? result[0].totalBalance : 0;
      totalmoney = total;
      // console.log(
      //   "Aggregate balance for all accounts except the specified account:",
      //   total
      // );
    }
  });
  return { grandTotal: totalmoney }; // Replace with actual data
}

async function fetchHouseWinsData() {
  const today = new Date();
  let mytotalmoney = 0;
  // Set the time to midnight (00:00:00)
  today.setHours(0, 0, 0, 0);

  // Calculate the start date of the current month
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // Define the criteria for the query to filter records for the current month
  const criteria = {
    win: true,
    createdAt: { $gte: firstDayOfMonth, $lt: today },
  };

  const pipeline = [
    { $match: criteria },
    {
      $group: {
        _id: null,
        totalAmount: {
          $sum: {
            $cond: [
              { $ifNull: ["$betAmount", false] },
              { $toDouble: "$betAmount" },
              0, // Default value for non-numeric values
            ],
          },
        },
      },
    },
  ];

  // Use Mongoose's aggregation framework to calculate the sum
  await Playerbet.aggregate(pipeline, (err, result) => {
    if (err) {
      console.error("Error calculating the sum:", err);
    } else {
      const sum = result.length > 0 ? result[0].totalAmount : 0;
      mytotalmoney = sum;
      // console.log(
      //   "Sum of amount for Playerbets with win=false this month:",
      //   sum
      // );
    }
  });

  // Return the total for the current month
  return { monthlyTotal: mytotalmoney };
}
async function fetchHouseLossesData() {
  const today = new Date();
  let mytotalmoney = 0;
  // Set the time to midnight (00:00:00)
  today.setHours(0, 0, 0, 0);

  // Calculate the start date of the current month
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // Define the criteria for the query to filter records for the current month
  const criteria = {
    win: false,
    createdAt: { $gte: firstDayOfMonth, $lt: today },
  };

  const pipeline = [
    { $match: criteria },
    {
      $group: {
        _id: null,
        totalAmount: {
          $sum: {
            $cond: [
              { $ifNull: ["$betAmount", false] },
              { $toDouble: "$betAmount" },
              0, // Default value for non-numeric values
            ],
          },
        },
      },
    },
  ];

  // Use Mongoose's aggregation framework to calculate the sum
  await Playerbet.aggregate(pipeline, (err, result) => {
    if (err) {
      console.error("Error calculating the sum:", err);
    } else {
      const sum = result.length > 0 ? result[0].totalAmount : 0;
      mytotalmoney = sum;
      // console.log(
      //   "Sum of amount for Playerbets with win=false this month:",
      //   sum
      // );
    }
  });

  // Return the total for the current month
  return { monthlyTotal: mytotalmoney }; // Replace with actual data
}

async function fetchTotalEarned(userId) {
  try {
    const result = await Playerbet.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId), // Assuming userId is in ObjectId format
          win: true, // Filter records where win is true
        },
      },
      {
        $group: {
          _id: null,
          totalEarned: { $sum: { $subtract: ["$winamount", "$betAmount"] } },
        },
      },
      {
        $project: {
          _id: 0,
          totalEarned: 1,
        },
      },
    ]).exec();

    if (result && result.length > 0) {
      return { totalearned: result[0].totalEarned };
    } else {
      return { totalearned: 0 };
    }
  } catch (error) {
    console.error("Error:", error);
    throw error; // Handle or rethrow the error as needed
  }
}

async function fetchTotalPaid(userId) {
  try {
    const result = await Transaction.aggregate([
      {
        $match: {
          user: mongoose.Types.ObjectId(userId), // Match transactions for a specific user
          type: 1, // Filter transactions of type 1
        },
      },
      {
        $group: {
          _id: null,
          totalPaid: { $sum: "$amount" },
        },
      },
      {
        $project: {
          _id: 0,
          totalPaid: 1,
        },
      },
    ]).exec();

    if (result && result.length > 0) {
      return { totalpaid: result[0].totalPaid };
    } else {
      return { totalpaid: 0 }; // If no transactions of type 1 found for the user
    }
  } catch (error) {
    console.error("Error:", error);
    throw error; // Handle or rethrow the error as needed
  }
}

async function calculateTotalBalanceForPlayers() {
  try {
    const excludedAccountId = "6523f69762c8841fb3313ade";

    // Define the criteria for the query
    const criteria = {
      _id: { $ne: mongoose.Types.ObjectId(excludedAccountId) },
    };

    // Create an aggregation pipeline to calculate the sum of balance
    const pipeline = [
      { $match: criteria },
      {
        $group: {
          _id: null,
          totalBalance: {
            $sum: "$balance",
          },
        },
      },
    ];

    // Execute the aggregation pipeline
    const result = await Account.aggregate(pipeline);

    // Extract the total balance from the result
    const totalBalance = result.length > 0 ? result[0].totalBalance : 0;

    return { totalPlayersBalance: totalBalance };
  } catch (error) {
    // Handle errors here
    console.error("Error calculating total balance for players:", error);
    throw error;
  }
}

const adminResolvers = {
  Dashboard: async (args, req) => {
    const currentUser = req.user;

    if (!currentUser) {
      throw new Error("Unauthorized: Missing token");
    }
    // Your logic to fetch and return the data for the dashboard
    try {
      // Execute all asynchronous functions concurrently
      const [
        houseRevenueData,
        HouseLosesToday,
        mpesaBalanceData,
        playersData,
        withholdingTaxData,
        walletsTotalData,
        houseWinsData,
        houseLossesData,
        totalPlayersBalance,
      ] = await Promise.all([
        fetchHouseRevenueData(),
        fetchHouselosesTodayData(),
        fetchMPESABalanceData(),
        fetchPlayersData(),
        fetchWithholdingTaxData(),
        fetchWalletsTotalData(),
        fetchHouseWinsData(),
        fetchHouseLossesData(),
        calculateTotalBalanceForPlayers(),
      ]);

      // Return the data after all promises are resolved
      return {
        houseRevenue: houseRevenueData,
        houseLose: HouseLosesToday,
        mpesaBalance: mpesaBalanceData,
        players: playersData,
        withholdingTax: withholdingTaxData,
        walletsTotal: walletsTotalData,
        houseWins: houseWinsData,
        houseLosses: houseLossesData,
        playerWallets: totalPlayersBalance,
      };
    } catch (error) {
      // Handle errors if any of the promises fail
      throw new Error(`Error fetching data: ${error.message}`);
    }
  },

  affiliate: async (args, req) => {
    const currentUser = req.user;

    if (!currentUser) {
      throw new Error("Unauthorized: Missing token");
    }

    const totalearned = fetchTotalEarned(req.user.userId);
    const totalpaid = fetchTotalPaid(req.user.userId);

    return {
      earned: totalearned,
      paid: totalpaid,
    };
  },
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
    let bt = bets.filter((it) => +it._id === new Date().getMonth() + 1);
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
    let bt = bets.filter((it) => +it._id === new Date().getMonth() + 1);
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
    const currentUser = req.user;

    if (!currentUser) {
      throw new Error("Unauthorized: Missing token");
    }
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

  taxToTal: async () => {
    const bets = await Bet.find().sort({ createdAt: -1 });

    let bts = bets.filter(
      (item) => item.createdAt.getMonth() + 1 === new Date().getMonth() + 1
    );

    let sum = bts.reduce((acc, obj) => {
      return acc + parseFloat(obj.tax);
    }, 0);

    return { amount: sum };
  },

  //    Get a list of all the admins

  admins: async (args, req) => {
    const currentUser = req.user;

    if (!currentUser) {
      throw new Error("Unauthorized: Missing token");
    }
    const users = await User.find().sort({ createdAt: -1 });

    return users;
  },

  //  Get a list of all the accounts

  accounts: async (args, req) => {
    const currentUser = req.user;

    if (!currentUser) {
      throw new Error("Unauthorized: Missing token");
    }
    const acc = await Account.find().sort({ createdAt: -1 }).populate("user");
    return acc.map(async (acc) => {
      // const user = await singleUser.bind(this, acc?._doc.user)
      // const user = await User.findOne({ _id: acc?._doc.user });
      return {
        ...acc?._doc,
        _id: acc?.id,
        // user: user,
        createdAt: new Date(acc?._doc?.createdAt).toISOString(),
        updatedAt: new Date(acc?._doc?.updatedAt).toISOString(),
      };
    });
  },

  //  Get all the system logs for the admin
  getAdminLogs: async (args, req) => {
    try {
      const pageNumber = parseInt(args.page) || 1;
      const itemsPerPage = parseInt(args.per_page) || 10;

      // Calculate skip and limit values for pagination
      const skip = (pageNumber - 1) * itemsPerPage;
      const limit = itemsPerPage;

      const totalItems = await AdminLogs.countDocuments();
      const totalPages = Math.ceil(totalItems / itemsPerPage);

      // Fetch logs from your data source (e.g., MongoDB)
      const logs = await AdminLogs.find()
        .populate("user")
        .skip(skip)
        .limit(limit) /*.populate("account").populate("bets")*/
        .sort({ createdAt: -1 });
      return {
        logs: logs,
        paginationInfo: {
          current_page: pageNumber,
          total_pages: totalPages,
          total_items: totalItems,
          per_page: itemsPerPage,
        },
      };
    } catch (error) {
      throw new Error("Error fetching logs: " + error.message);
    }
  },

  // Get all the logs from the database

  logs: async (args, req) => {
    const logs = await Logs.find()
      .populate("user")
      .sort({ createdAt: -1 })
      .limit(200);
    return logs.map((log) => {
      return {
        ...log._doc,
        _id: log?.id,
        user: log._doc.user,
        createdAt: new Date(log?._doc?.createdAt).toISOString(),
        updatedAt: new Date(log?._doc?.updatedAt).toISOString(),
      };
    });
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
    if (!account && +args.amount < 0) {
      return;
    }
    let bal = account.balance;
    account.balance = args.amount;
    const doc = await account.save();

    //Refund account
    if (args.backend !== true) {
      const houseAccount = await house.findOne({
        user: "62fb898a4a4d42002392750d",
      });
      houseAccount.houseTotal = +houseAccount?.houseTotal - +args?.amount;

      await houseAccount.save();
    }

    //save logs
    const ipAddress = req.socket.remoteAddress;
    const log = new Logs({
      ip: ipAddress,
      description: `Account refunded ${parseFloat(+args.amount - +bal).toFixed(
        2
      )}- Account Name:${account.user.username}`,
      user: args.userId,
      balance: account.balance,
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
    if (!account && parseFloat(args.amount) < 1) {
      return;
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
      houseAccount.houseTotal = +houseAccount?.houseTotal - +args?.amount;

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
    const user = await User.findOne({ _id: args.userId });

    if (user.dataToken !== args.dataToken) {
      throw new Error("Session expired!!!");
    }

    const account = await Account.findOne({ user: args.userId });
    if (+account.balance < 0) {
      account.balance = "0";
      throw new Error("Insufficient funds");
    }
    let bal = account.balance;
    account.balance = args.amount;
    const doc = await account.save();

    const ipAddress = req.socket.remoteAddress;
    const log = new Logs({
      ip: ipAddress,
      description: `Deducted ${parseFloat(+args.amount - +bal).toFixed(
        2
      )} - Account Name:${account?.user.username}`,
      user: args.userId,
      balance: account.balance,
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

  //    Edit admin user phone number
  editAdminUserPhone: async (args, req) => {
    const user = await User.findOne({ username: args.username });
    if (!user) {
      throw new Error("User does'nt exist.");
    }
    user.phone = args.phone;
    return user
      .save()
      .then(async (usr) => {
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
    user.phone = args.phone;
    return user
      .save()
      .then(async (usr) => {
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
      balance: +accnt.balance,
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

  createRole: async (args, req) => {
    console.log(args.roleInput);
    try {
      const role = new Role({
        name: args.roleInput.name,
        description: args.roleInput.description,
      });

      await role.save();
      console.log(`Role "${args.roleInput.name}" created with permissions:`);

      return {
        status: "success",
        message: `${args.roleInput.name} role created`,
      };
    } catch (error) {
      console.error("Error creating role:", error);
      throw new Error("Failed to create role");
    }
  },
  permissions: async (args, req) => {
    try {
      // Fetch the selected permissions by their IDs
      const permissions = await Permission.find().sort({ createdAt: -1 });

      return permissions.map((permission) => {
        return {
          ...permission._doc,
          _id: permission.id,
          createdAt: "time",
          updatedAt: "time",
        };
      });
    } catch (error) {
      console.error("Error fetching permissions:", error);
      throw new Error("Failed to fetch permissions");
    }
  },

  roles: async (args, req) => {
    try {
      // Fetch the selected permissions by their IDs
      const roles = await Role.find()
        .populate("permissions")
        .sort({ createdAt: -1 });

      return roles.map((role) => {
        return {
          ...role._doc,
          _id: role.id,
          createdAt: "time",
          updatedAt: "time",
        };
      });
    } catch (error) {
      console.error("Error fetching permissions:", error);
      throw new Error("Failed to fetch permissions");
    }
  },
};
async function savePermissionsToMongo() {
  try {
    const db = await connectToDatabase(); // Replace with your database name
    const permissionsCollection = db.collection("permissions");

    // Clear existing permissions and insert new ones
    await permissionsCollection.deleteMany({});
    const permissionArray = [];

    for (const entity in permissions) {
      for (const action in permissions[entity]) {
        permissionArray.push({
          entity_name: entity,
          action_name: action,
          description: permissions[entity][action],
        });
      }
    }

    const result = await permissionsCollection.insertMany(permissionArray);
    console.log(`${result.insertedCount} permissions inserted into MongoDB`);
  } catch (error) {
    console.error("Error saving permissions to MongoDB:", error);
  } finally {
    await client.close();
    console.log("Disconnected from MongoDB");
  }
}

// savePermissionsToMongo();

module.exports = adminResolvers;
