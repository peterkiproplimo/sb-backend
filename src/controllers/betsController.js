require("dotenv").config();

const moment = require("moment");

const Account = require("../models/Account");
const Bet = require("../models/Bet");
const Logs = require("../models/logs");
const BetHistory = require("../models/bethistory");
const Game = require("../models/Game");
const house = require("../models/house");
const Playerbet = require("../models/PlayerBet");
const Player = require("../models/Player");
const BetTransaction = require("../models/BetTransactions");
const History = require("../models/history");
const {
  handleKaribuBonusAndBalance,
} = require("../utils/playerAccountHandler");

const PlayerBet = require("../models/PlayerBet");

const betsResolvers = {
  createPlayerbet: async (args, req) => {
    const currentUser = req.user;

    if (!currentUser) {
      throw new Error("Unauthorized: Missing token");
    }

    try {
      // Verify the token

      const account = await Account.findOne({
        user: req.user.userId,
      });

      // if (!account) {
      //   throw new Error("account not found");
      // }

      if (parseFloat(args.playerbetInput.betAmount) < 10) {
        throw new Error("You cannot bet with any amount less than 10");
      }

      if (account?.balance < 0) {
        throw new Error("Insufficient account balance");
      }

      if (account?.balance < parseFloat(args.playerbetInput.betAmount)) {
        throw new Error("Insufficient account balance");
      }

      await handleKaribuBonusAndBalance(account, args);
      // Check if player has bonus then deduct the bonus
      // Subtract the player account balance

      //  Add the house balance
      const houseAccount = await Account.findById("6555e4028e89bb00288767eb");
      houseAccount.balance =
        parseFloat(houseAccount?.balance) +
        parseFloat(args.playerbetInput.betAmount);
      await houseAccount.save();

      //  Get the possible win
      let currentpossibleWin =
        args.playerbetInput.betAmount * args.playerbetInput.point;
      const winamount = currentpossibleWin - args.playerbetInput.betAmount;
      const withholdingtax = ((20 / 100) * winamount).toFixed(2);
      const finalwinamount = winamount - withholdingtax;
      let possibleWin = (
        parseFloat(args.playerbetInput.betAmount) + finalwinamount
      ).toFixed(2);

      const bet = new Playerbet({
        betAmount: args.playerbetInput.betAmount,
        point: args.playerbetInput.point,
        userId: args.playerbetInput.userId,
        played: 0,
        completed: 0,
        possibleWin: possibleWin,
        win: false,
        winamount: winamount,
        withholdingtax: withholdingtax,
      });

      const results = await bet.save();

      const betrans = new BetTransaction({
        type: "bet",
        usertype: "player",
        amount: args.playerbetInput.betAmount,
        account: account,
      });

      await betrans.save();

      const user = await Player.findById(req.user.userId);
      const account2 = await Account.findOne({
        user: req.user.userId,
      });

      const totalbalance =
        parseFloat(account2.balance) + parseFloat(account2.karibubonus);

      // Format and return the result
      const createdBet = {
        ...results._doc,
        _id: results._id.toString(),
        userId: user,
        balance: totalbalance,
        createdAt: new Date(results._doc.createdAt).toISOString(),
        updatedAt: new Date(results._doc.updatedAt).toISOString(),
        Player: {
          _id: user._id.toString(), // Include the _id of the associated Player
        },
      };

      return createdBet;
    } catch (err) {
      console.log(err);
    }
  },

  markUserBetAsWin: async (_, { userId, round }) => {
    try {
      // Find the first Playerbet for the given user ID, specific round, and where 'win' is set to false
      const userBetToUpdate = await Playerbet.findOne({
        userId,
        round,
        win: false,
      });

      if (!userBetToUpdate) {
        throw new Error("No eligible bets found to mark as a win");
      }

      // Update 'win' to true for the found bet
      userBetToUpdate.win = true;
      await userBetToUpdate.save(); // Save the updated bet

      return true; // Return true to indicate success
    } catch (error) {
      console.error("Error marking a bet as a win:", error);
      throw new Error("Failed to mark a bet as a win");
    }
  },

  getAllPlayers: async (args, req) => {
    const currentUser = req.user;

    if (!currentUser) {
      throw new Error("Unauthorized: Missing token");
    }

    try {
      const pageNumber = parseInt(args.page) || 1;
      const itemsPerPage = parseInt(args.per_page) || 10;
      // Create a query object based on search and filter criteria
      const query = {};
      if (args.username != "") {
        query.username = new RegExp(args.username, "i"); // Case-insensitive search
      }
      if (args.active != "") {
        query.active = args.active == "0" ? true : false;
      }
      query.type = "regular";

      // pagination
      // total_pages
      // current_page
      // total
      // per_page
      // Calculate skip and limit values for pagination
      const skip = (pageNumber - 1) * itemsPerPage;
      const limit = itemsPerPage;

      const totalItems = await Player.countDocuments(query);
      const totalPages = Math.ceil(totalItems / itemsPerPage);

      // Fetch players from your data source (e.g., MongoDB)
      const players = await Player.find(query)
        .skip(skip)
        .limit(limit)
        .populate("account")
        .populate("bets")
        .sort({ createdAt: -1 });
      return {
        players: players,
        paginationInfo: {
          current_page: pageNumber,
          total_pages: totalPages,
          total_items: totalItems,
          per_page: itemsPerPage,
        },
      };
    } catch (error) {
      throw new Error("Error fetching players: " + error.message);
    }
  },

  winnersBets: async () => {
    const bets = await Bet.find().sort({ createdAt: -1 });
    const currentBets = bets.filter((item) => item.round === bets[0].round);

    let sum = 0;
    currentBets.map((item) => {
      if (item.round !== bets[0].round) {
        return;
      }
      if (item.win === false) {
        sum = sum + item.betAmount;
      }
      if (item.win === true) {
        sum = sum - item.amount;
      }
    });
    // console.log(sum);
    return { round: bets[0].round, amount: sum };
  },

  winnersPerRound: async () => {
    const bets = await Bet.aggregate([
      { $match: { win: false } },
      {
        $group: {
          _id: {
            round: "$round",
            createdAt: { $substr: ["$createdAt", 5, 2] },
          },
          amount: { $sum: "$betAmount" },
        },
      },
      { $sort: { amount: 1, _id: 1 } },
    ]);
    let bt = bets.filter(
      (it) => +it._id.createdAt === new Date().getMonth() + 1
    );

    let bts = [];

    bt.map((it) => {
      let obj = {
        _id: +it._id.round,
        amount: it.amount,
      };
      bts.push(obj);
    });

    return bts;
  },

  losersPerRound: async () => {
    const bets = await Bet.aggregate([
      { $match: { win: true } },
      {
        $group: {
          _id: {
            round: "$round",
            createdAt: { $substr: ["$createdAt", 5, 2] },
          },
          amount: { $sum: { $add: ["$amount", "$tax"] } },
        },
      },
      { $sort: { amount: 1, _id: 1 } },
    ]);
    let bt = bets.filter(
      (it) => +it._id.createdAt === new Date().getMonth() + 1
    );
    let bts = [];

    bt.map((it) => {
      let obj = {
        _id: +it._id.round,
        amount: it.amount,
      };
      bts.push(obj);
    });

    return bts;
  },

  getCurrentRound: async (args, req) => {
    const currentBets = await Bet.find({ round: args.round }).sort({
      createdAt: -1,
    });
    return currentBets.map((bet) => {
      return {
        ...bet?._doc,
        _id: bet?.id,
        user: singleUser.bind(this, bet?._doc.user),
        createdAt: new Date(bet?._doc?.createdAt).toISOString(),
        updatedAt: new Date(bet?._doc?.updatedAt).toISOString(),
      };
    });
  },

  getHouse: async (args, req) => {
    const bets = await Bet.find();
    const dayBets = bets.filter(
      (item) =>
        item.createdAt.toISOString().split("T")[0] ===
        moment(new Date()).format("YYYY-MM-DD")
    );

    let lost = 0;
    let won = 0;

    if (dayBets.length > 1) {
      dayBets.map((item) => {
        if (item.win == false) {
          won = won + item.betAmount;
          return;
        }
        if (item.win == true) {
          lost = lost + item.amount + item.tax;
          return;
        }
      });
    }

    return [
      {
        houseTotal: won - lost,
        _id: "6318a55d329e4eaf1f1bcd9a",
        createdAt: new Date().toISOString(),
      },
    ];
  },

  // Get the History bets
  historyBets: async (args, req) => {
    const currentUser = req.user;

    if (!currentUser) {
      throw new Error("Unauthorized: Missing token");
    }
    const bets = await Playerbet.find({ userId: req.user.userId })
      .populate("userId")
      .populate("roundid")
      .sort({
        createdAt: -1,
      })
      .limit(20);

    return bets.map((bet) => {
      return {
        ...bet?._doc,
        _id: bet?.id,
        createdAt: new Date(bet?._doc?.createdAt).toISOString(),
        updatedAt: new Date(bet?._doc?.updatedAt).toISOString(),
      };
    });
  },

  //  Get bets for a paricular user

  bets: async (args, req) => {
    const currentUser = req.user;

    if (!currentUser) {
      throw new Error("Unauthorized: Missing token");
    }
    const bets = await Playerbet.find({ user: req.user.userId })
      .sort({
        createdAt: -1,
      })
      .limit(20);
    return bets.map((bet) => {
      return {
        ...bet?._doc,
        _id: bet?.id,
        user: singleUser.bind(this, bet?._doc.user),
        createdAt: new Date(bet?._doc?.createdAt).toISOString(),
        updatedAt: new Date(bet?._doc?.updatedAt).toISOString(),
      };
    });
  },

  allBets: async (args, req) => {
    const currentUser = req.user;

    if (!currentUser) {
      throw new Error("Unauthorized: Missing token");
    }
    try {
      let bets;
      const searchTerm = args.searchTerm;
      // Apply pagination
      const page = parseInt(args.page) || 1;
      const pageSize = parseInt(args.per_page) || 10;

      // Check if input object is provided
      if (searchTerm == "" || !searchTerm) {
        // If no input is provided, return all records with pagination
        bets = await PlayerBet.find()
          .populate("userId")
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
            { win: args.win == "0" ? true : false },
            // { createdAt: { $regex: regex } },
            { userId: player ? player._id : null },
            // Add more fields as needed
          ],
        };

        // Perform the search with filter      // Use lean() to convert the documents to plain JavaScript objects
        bets = await PlayerBet.find(filter)
          .populate("userId")
          .populate("roundid")
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .sort({ createdAt: -1 })
          .lean();
      }

      // console.log(bets);

      // Calculate pagination metadata
      const totalItems = await PlayerBet.countDocuments();
      const totalPages = Math.ceil(totalItems / pageSize);

      return {
        playerBets: bets,
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

  //  Get bets where win is true
  filteredBets: async (args, req) => {
    const bets = await Bet.find({ win: true }).sort({ createdAt: -1 });
    return bets.map((bet) => {
      return {
        ...bet?._doc,
        _id: bet?.id,
        user: singleUser.bind(this, bet?._doc?.user),
        createdAt: new Date(bet?._doc?.createdAt).toISOString(),
        updatedAt: new Date(bet?._doc?.updatedAt).toISOString(),
      };
    });
  },

  //  Get the bet history for a particular user

  history: async (args, req) => {
    const currentUser = req.user;

    if (!currentUser) {
      throw new Error("Unauthorized: Missing token");
    }
    const history = await History.find().sort({ createdAt: -1 }).limit(20);

    return history.map((bet) => {
      return {
        ...bet?._doc,
        _id: bet?.id,

        createdAt: new Date(bet?._doc?.createdAt).toISOString(),
        updatedAt: new Date(bet?._doc?.updatedAt).toISOString(),
      };
    });
  },

  createBetHistory: async (args, req) => {
    const history = new BetHistory({
      point: args.point,
      user: args.user,
    });
    const data = await history.save().then((res) => res);
    const ipAddress = req.socket.remoteAddress;
    const log = new Logs({
      ip: ipAddress,
      description: "Added bet a history",
      user: args.user,
    });

    await log.save();
    return {
      ...data?._doc,
      _id: data?.id,
      user: singleUser.bind(this, data?._doc.user),
      createdAt: new Date(data?._doc?.createdAt).toISOString(),
      updatedAt: new Date(data?._doc?.updatedAt).toISOString(),
    };
  },

  createBet: async (args, req) => {
    const account = await Account.findOne({ user: args.betInput.user });
    if (+account.balance < 0) {
      throw new Error("Insufficient account account balance");
    }
    const dublicateBet = await Bet.findOne({
      user: args.betInput.user,
      round: args.betInput.round,
    });

    const bet = new Bet({
      nonce: args.betInput.nonce,
      clientSeed: args.betInput.clientSeed,
      amount: args.betInput.amount,
      betAmount: args.betInput.betAmount,
      serverSeed: args.betInput.serverSeed,
      point: args.betInput.point,
      round: dublicateBet ? +args.betInput.round + 100 : args.betInput.round,
      win: args.betInput.win,
      auto: args.betInput.auto,
      user: args.betInput.user,
      tax: args.betInput.tax,
      crush: parseFloat(args.betInput.crush),
      balance: `${account.balance}`,
    });
    const results = await bet.save();

    const houseAccount = await house.findOne({
      user: "6549edb45d7a310028988145",
    });

    const ipAddress = req.socket.remoteAddress;
    const log = new Logs({
      ip: ipAddress,
      description: `User ${args.betInput.win ? "won " : "lost"} ${
        args.betInput.win
          ? parseFloat(+args.betInput.amount).toFixed(2)
          : parseFloat(+args.betInput.betAmount).toFixed(2)
      }`,
      user: args.betInput.user,
      round: args.betInput.round,
      won: args.betInput.win,
      at: parseFloat(args.betInput.point),
      crush: parseFloat(args.betInput.crush),
      balance: `${account.balance}`,
    });
    await log.save();

    let userProfit = +args?.betInput?.amount + +args?.betInput?.tax;
    houseAccount.houseTotal = args.betInput.win
      ? +houseAccount?.houseTotal - +userProfit
      : +houseAccount?.houseTotal + +args?.betInput?.betAmount;

    await houseAccount.save();
    return {
      ...results._doc,
      _id: results.id,
      user: singleUser.bind(this, results._doc.user),
      createdAt: new Date(results._doc.createdAt).toISOString(),
      updatedAt: new Date(results._doc.updatedAt).toISOString(),
    };
  },

  createGameData: async (args, req) => {
    const game = new Game({
      round: args.round,
      level: args.level,
    });

    const results = await game.save();

    return {
      ...results._doc,
      _id: results.id,
      user: singleUser.bind(this, results._doc.user),
      createdAt: new Date(results._doc.createdAt).toISOString(),
      updatedAt: new Date(results._doc.updatedAt).toISOString(),
    };
  },
};

module.exports = betsResolvers;
