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
const betsResolvers = {
  createPlayerbet: async (args, req) => {
    // console.log(req);
    const account = await Account.findOne({ user: args.playerbetInput.userId });
    if (+account.balance < 0) {
      throw new Error("Insufficient account account balance");
    }

    let possibleWin = args.playerbetInput.betAmount * args.playerbetInput.point;

    const bet = new Playerbet({
      betAmount: args.playerbetInput.betAmount,
      point: args.playerbetInput.point,
      userId: args.playerbetInput.userId,
      round: args.playerbetInput.round,
      possibleWin: possibleWin,
    });

    const results = await bet.save();

    // {
    //   _id: 65002f01e2fb925a56a57aed,
    //   betAmount: 100,
    //   point: '2.5',
    //   userId: '64ef000875f6b542d6437d46',
    //   round: '1',
    //   createdAt: 2023-09-12T09:27:30.060Z,
    //   updatedAt: 2023-09-12T09:27:30.060Z,
    //   __v: 0
    // }

    // Format and return the result
    const createdBet = {
      ...results._doc,
      _id: results._id,
      user: "a",
      createdAt: new Date(results._doc.createdAt).toISOString(),
      updatedAt: new Date(results._doc.updatedAt).toISOString(),
    };

    return createdBet;
  },

  getAllPlayers: async () => {
    try {
      // Fetch all players from your data source (e.g., MongoDB)
      const players = await Player.find().exec();
      return players;
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
    const bets = await Bet.find({ user: args.userId })
      .sort({
        createdAt: -1,
      })
      .limit(50);

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

  //  Get bets for a paricular user

  bets: async (args, req) => {
    const bets = await Bet.find({ user: args.userId })
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

  //  Get all the bets

  allBets: async (args, req) => {
    const bets = await Bet.find().sort({ createdAt: -1 });
    console.log(bets);
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
    const history = await BetHistory.find({ user: args.userId })
      .sort({ createdAt: -1 })
      .limit(30);

    return history.map((bet) => {
      return {
        ...bet?._doc,
        _id: bet?.id,
        user: singleUser.bind(this, bet?._doc?.user),
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
      user: "62fb898a4a4d42002392750d",
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
