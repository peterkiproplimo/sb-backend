require("dotenv").config();

//importing mongoose models
const Account = require("../models/Account");
const Bet = require("../models/Bet");
const Transaction = require("../models/transactions");
const Logs = require("../models/logs");
const Player = require("../models/Player");

const accountResolvers = {
  calculateBalance: async (args, req) => {
    const trans = await Transaction.find({ type: "Deposit" }).sort({
      createdAt: -1,
    });
    // console.log(trans[0])

    return {
      amount: trans[0].floatBalance,
    };
  },

  transactionDetails: async (args, req) => {
    const trans = await Transaction.findOne({ trans_id: args.trans_id });
    const user = await User.findOne({ phone: trans.bill_ref_number });
    const accnt = await Account.findOne({ phone: trans.bill_ref_number });

    trans.balance = accnt.balance;
    trans.username = user.username;
    const tran = await trans.save();
    if (user.label === "1") {
      accnt.balance = `${parseFloat(+accnt.balance + +trans.amount).toFixed(
        2
      )}`;
      user.label = "2";
      user.firstDeposit = +trans.amount;
      await accnt.save();
      await user.save();
    }
    return {
      ...tran?._doc,
      _id: tran?.id,
      createdAt: new Date(trans?._doc?.createdAt).toISOString(),
      updatedAt: new Date(trans?._doc?.updatedAt).toISOString(),
    };
  },

  accountBalanceUpdate: async (args, req) => {
    const account = await Account.findOne({ user: args.userId });
    account.balance = args.amount;
    const doc = await account.save();
    return {
      ...doc._doc,
      _id: doc.id,
      user: singleUser.bind(this, doc._doc.user),
      createdAt: new Date(doc._doc.createdAt).toISOString(),
      updatedAt: new Date(doc._doc.updatedAt).toISOString(),
    };
  },

  userTransaction: async (args, req) => {
    const trans = await Transaction.find({ bill_ref_number: args.phone }).sort({
      createdAt: -1,
    });
    return trans.map((trans) => {
      return {
        ...trans?._doc,
        _id: trans?.id,
        createdAt: new Date(trans?._doc?.createdAt).toISOString(),
        updatedAt: new Date(trans?._doc?.updatedAt).toISOString(),
      };
    });
  },

  allTransactions: async (args, req) => {
    const trans = await Transaction.find()
      .sort({ createdAt: -1 })
      .populate("user");
    // const user = await Player.findById(trans.user);
    return trans.map((trans) => {
      return {
        ...trans?._doc,
        _id: trans?.id,

        createdAt: new Date(trans?._doc?.createdAt).toISOString(),
        updatedAt: new Date(trans?._doc?.updatedAt).toISOString(),
      };
    });
  },

  /// Get all the bets that the user has won / lost

  userTT: async (args, req) => {
    const bets = await Bet.find({ user: args.userId });

    let wonBets = bets.filter((item) => item.win === true);
    let lostBets = bets.filter((item) => item.win === false);
    let sum = bets.reduce((acc, obj) => {
      return acc + parseFloat(obj.tax);
    }, 0);
    return { tax: sum, won: wonBets.length, lost: lostBets.length };
  },

  //  Get the total amount of deposits for a particular user

  totalDeposits: async (args, req) => {
    const bets = await Transaction.find({ user: args.userId });

    let sum = bets.reduce((acc, obj) => {
      return acc + parseFloat(obj.amount);
    }, 0);

    // console.log(sum)

    return { amount: sum };
  },

  /// Get the total amount of widthrawal that a particular user has transacted

  totalWidrawal: async (args, req) => {
    const bets = await Transaction.find({
      bill_ref_number: args.phone,
      type: "Withdrawal",
    });

    let sum = bets.reduce((acc, obj) => {
      return acc + parseFloat(obj.amount);
    }, 0);

    return { amount: sum };
  },

  // The total amount of money in the house

  houseAmount: async () => {
    const amount = await Bet.aggregate([
      { $match: { win: false } },
      { $group: { _id: null, amount: { $sum: "$betAmount" } } },
    ]);
    return amount;
  },

  //    Get the transactions that belong to a particular user

  transactions: async (args, req) => {
    if (!req.isAuth) {
      throw new Error("Not authenticated.");
    }
    const transactions = await Transaction.find({ user: args.userId });
    return transactions.map((item) => {
      return {
        ...item?._doc,
        _id: item?.id,
        user: singleUser.bind(this, item?._doc.user),
        createdAt: new Date(item?._doc?.createdAt).toISOString(),
        updatedAt: new Date(item?._doc?.updatedAt).toISOString(),
      };
    });
  },

  //    Get the user account balance

  accountBalance: async (args, req) => {
    const account = await Account.findOne({ user: args.userId });
    const user = await Player.findById(args.userId);
    return {
      _id: account?.id,
      balance: account?.balance,
      karibubonus: account?.karibubonus,
      totalbalance:
        parseFloat(account?.balance) + parseFloat(account?.karibubonus),
      user: user,
      createdAt: new Date(account?._doc?.createdAt).toISOString(),
      updatedAt: new Date(account?._doc?.updatedAt).toISOString(),
      active: account?.active,
    };
  },

  //    Save a particular user's transaction

  createTransaction: async (args, req) => {
    const transaction = new Transaction({
      type: args.transactionInput.type,
      amount: args.transactionInput.amount,
      user: req.userId,
    });

    const transact = await transaction.save();
    const ipAddress = req.socket.remoteAddress;
    const log = new Logs({
      ip: ipAddress,
      description: `Added a transaction`,
      user: args.transactionInput.user,
    });

    await log.save();
    return {
      ...transact._doc,
      _id: transact.id,
      user: singleUser.bind(this, transact._doc.user),
      createdAt: new Date(transact._doc.createdAt).toISOString(),
      updatedAt: new Date(transact._doc.updatedAt).toISOString(),
    };
  },
};

module.exports = accountResolvers;
