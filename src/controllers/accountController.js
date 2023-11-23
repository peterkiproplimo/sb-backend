require("dotenv").config();

//importing mongoose models
const Account = require("../models/Account");
const Bet = require("../models/Bet");
const Transaction = require("../models/transactions");
const Logs = require("../models/logs");
const Player = require("../models/Player");
const Playerbet = require("../models/PlayerBet");
const jwt = require("jsonwebtoken");
async function fetchTotalWinsForPlayer(playerId) {
  let totalWins = 0;

  // Define the criteria for the query to filter records for the specified player and wins
  const criteria = {
    win: true, // Filter for wins only
    userId: playerId, // Filter for the specified player
  };

  const pipeline = [
    { $match: criteria },
    {
      $group: {
        _id: null,
        totalAmount: {
          $sum: {
            $cond: [
              { $ifNull: ["$possibleWin", false] },
              { $toDouble: "$possibleWin" },
              0, // Default value for non-numeric values
            ],
          },
        },
      },
    },
  ];

  // Use Mongoose's aggregation framework to calculate the total wins
  await Playerbet.aggregate(pipeline, (err, result) => {
    if (err) {
      console.error("Error calculating total wins:", err);
    } else {
      totalWins = result.length > 0 ? result[0].totalWinAmount : 0;
      console.log("Total wins for the player:", totalWins);
    }
  });

  // Return the total wins for the player
  return totalWins;
}

async function fetchTotalDeposits(playerId) {
  let totalWins = 0;

  // Define the criteria for the query to filter records for the specified player and wins
  const criteria = {
    type: "Deposit", // Filter for wins only
    user: playerId, // Filter for the specified player
  };

  const pipeline = [
    { $match: criteria },
    {
      $group: {
        _id: null,
        totalAmount: {
          $sum: {
            $cond: [
              { $ifNull: ["$amount", false] },
              { $toDouble: "$amount" },
              0, // Default value for non-numeric values
            ],
          },
        },
      },
    },
  ];

  // Use Mongoose's aggregation framework to calculate the total wins
  await Transaction.aggregate(pipeline, (err, result) => {
    if (err) {
      console.error("Error calculating total wins:", err);
    } else {
      totalWins = result.length > 0 ? result[0].totalWinAmount : 0;
      console.log("Total wins for the player:", totalWins);
    }
  });

  // Return the total wins for the player
  return totalWins;
}

async function fetchTotalLosesForPlayer(playerId) {
  let totalLoses = 0;

  // Define the criteria for the query to filter records for the specified player and wins
  const criteria = {
    win: false, // Filter for wins only
    userId: playerId, // Filter for the specified player
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

  // Use Mongoose's aggregation framework to calculate the total wins
  await Playerbet.aggregate(pipeline, (err, result) => {
    if (err) {
      console.error("Error calculating total wins:", err);
    } else {
      totalLoses = result.length > 0 ? result[0].totalAmount : 0;
      console.log("Total wins for the player:", totalLoses);
    }
  });

  // Return the total wins for the player
  return totalLoses;
}
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
    return;
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
    try {
      let transactions;
      const searchTerm = args.searchTerm;
      // Apply pagination
      const page = parseInt(args.page) || 1;
      const pageSize = parseInt(args.per_page) || 10;

      // Check if input object is provided
      if (searchTerm == "" || !searchTerm) {
        // If no input is provided, return all records with pagination
        transactions = await Transaction.find()
          .populate("user")
          .populate("account")
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .sort({ createdAt: -1 })
          .lean();
      } else {
        // Use a regular expression to perform a case-insensitive search
        const regex = new RegExp(searchTerm, "i");

        // Find the player by username
        const player = await Player.findOne({
          username: { $in: [regex] },
        }).exec();
        // console.log(player)

        // Define the filter criteria based on the search term and user ID
        const filter = {
          $or: [
            { phone: { $in: [regex] } },
            { trans_id: { $in: [regex] } },
            // { createdAt: { $regex: regex } },
            { userId: player ? player._id : null },
            // Add more fields as needed
          ],
        };

        // Perform the search with filter      // Use lean() to convert the documents to plain JavaScript objects
        transactions = await Transaction.find(filter)
          .populate("user")
          .populate("account")
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .sort({ createdAt: -1 })
          .lean();
      }

      // console.log(bets);

      // Calculate pagination metadata
      const totalItems = await Transaction.countDocuments();
      const totalPages = Math.ceil(totalItems / pageSize);

      return {
        transactions: transactions,
        paginationInfo: {
          total_pages: totalPages,
          current_page: page,
          total_items: totalItems,
          per_page: pageSize,
        },
      };
    } catch (error) {
      console.log(error);
      throw new Error("Error fetching player bets", "INTERNAL_SERVER_ERROR");
    }
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
    try {
      const token = req.headers.authorization;

      if (!token) {
        throw new Error("Unauthorized: Missing token");
      }
      jwt.verify(
        token.split(" ")[1],
        process.env.SECRET_KEY,
        async (err, decoded) => {
          if (err) {
            throw new Error("Unauthorized: Invalid token");
          } else {
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
          }
        }
      );
    } catch (err) {
      console.log(err);
    }
  },

  accountSummary: async (args, req) => {
    const account = await Account.findOne({ user: args.userId });
    const user = await Player.findById(args.userId);

    const loses = await fetchTotalLosesForPlayer(args.userId);
    const wins = await fetchTotalWinsForPlayer(args.userId);
    const deposits = await fetchTotalDeposits(args.userId);

    return {
      _id: account?.id,
      balance: account?.balance,
      karibubonus: account?.karibubonus,
      totalbalance:
        parseFloat(account?.balance) + parseFloat(account?.karibubonus),
      user: user,
      winnings: wins,
      loses: loses,
      deposits: deposits,
      withdrawals: 0,
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

  /* admin accounts tab methods start here*/
  // get all the accounts in descending order default to page1 and 15 records per page
  getAccounts: async ({ page = 1, limit = 25 }) =>
    await Account.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("user"),
  updateBalance: (args, req) => {
    if (!req.isAuth) {
      throw new Error("Unauthenticated");
    }
    try {
      return Account.findById(args.accountId)
        .populate("user")
        .then(async (account) => {
          if (!account) {
            throw new Error("Account not found");
          }
          // account.balance = parseFloat(account.balance) + args.amount     //uncomment if balance update is by addition
          account.balance = parseFloat(args.amount); //this get the new updated balance
          await account.save();
          const ipAddress = req.socket.remoteAddress;
          const log = new Logs({
            ip: ipAddress,
            description: `${account.user.username} balance updated to ${account.balance}`,
            user: req.user._id,
          });

          log.save();
          return {
            status: "success",
            message: `${account.user.username} balance updated to ${account.balance}`,
          };
        });
    } catch (error) {
      throw new Error("Balance update failed, Please try again later");
    }
  },
  suspendAccount: (args, req) => {
    return Account.find(args.accountId)
      .then((account) => {
        if (!account) {
          throw new Error("Account NOT found!!");
        }
        account.active = false;
        return account.save();
      })
      .then(async (result) => {
        const ipAddress = req.socket.remoteAddress;
        const log = new AdminLog({
          ip: ipAddress,
          description: `Suspended account for user ${result.user.username}`, //this will be changed to the authenticated user creating the logs
          user: result.id,
        });

        await log.save();
        return {
          status: "success",
          message: `suspended account for user ${result.user.username}`,
        };
      });
  },
  restoreAccount: (args, req) => {
    return Account.findById(args.accountId)
      .then((account) => {
        if (!account) {
          throw new Error("Account NOT found!!");
        }
        account.status = true;
        return account.save();
      })
      .then(async (result) => {
        const ipAddress = req.socket.remoteAddress;
        const log = new AdminLog({
          ip: ipAddress,
          description: `Hold account for user ${result.user.username}`, //this will be changed to the authenticated user creating the logs
          user: result.id,
        });

        await log.save();
        return {
          status: "success",
          message: `Hold account for user ${result.user.username}`,
        };
      });
  },
};

module.exports = accountResolvers;
