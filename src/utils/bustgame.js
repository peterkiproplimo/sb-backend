const crypto = require("crypto");
const CryptoJS = require("crypto-js");
const OperationClass = require("../accounts/transactionclass");
const Account = require("../models/Account");
const Bets = require("../models/Bet");
const Game = require("../models/Game");
const User = require("../models/User");
const connectToDatabase = require('./database');



function generateHash_old() {
  var bust = crypto.randomInt(+process.env.HIGHEST_BUST);
  var hash = crypto.randomBytes(50).toString("hex");
  return { hash, bust };
}

const generateHash = () => {
  const SALT = crypto.randomBytes(50).toString("hex");
  const seed = () => crypto.randomBytes(256).toString("hex");
  const nBits = 52; // number of most significant bits to use

  // 1. HMAC_SHA256(message=seed, key=salt)
  const hash = CryptoJS.HmacSHA256(seed, SALT).toString();

  // 2. r = 52 most significant bits
  const r = parseInt(hash.slice(0, nBits / 4), 16);

  // 3. X = r / 2^52
  const X = r / Math.pow(2, nBits); // uniformly distributed in [0; 1)

  // 4. X = 90 / (1-X)
  let result = Math.floor(90 / (1 - X));

  if (Math.max(1, result / 100) > +process.env.HIGHEST_BUST) {
    result = Math.max(1, result / 5000);
  }

  // 5. return capped to 1 on lower end
  const bust = Math.max(1, result / 100);
  return { bust, hash };
};

module.exports = {
  createGame: async () => {
    var { bust, hash } = generateHash();
    // save new game to db
    const game = await Game.create({
      hash,
      bust,
      status: "playing",
    });
    const bets = await Bets.find({ status: "wait" });
    await bets.forEach((bet) => {
      game.bets.push(bet);
      bet.status = "play";
      bet.save();
    });
    return game;
  },

  endGame: async (game) => {
    game.status = "ended";
    const EndGame = await game.save();
    const recordTrans = new OperationClass();
    const completeGame = await EndGame.bets.forEach((bet) => {
      if (bet.rate > game.bust) {
        bet.status = "lose";
      } else {
        bet.status = "win";
        winbust = bet.rate;
        // winnings to db
        const user = User.findOne({ _id: bet.user })
          .populate("account")
          .then((user) => {
            if (user.role !== "bot") {
              account = user.account;
              // handle winning in accounts
              const winnings = bet.amount * winbust;
              const winAmount = winnings - bet.amount;
              const taxAmount = winAmount * 0.2;
              const taxedAmount = winnings - taxAmount;
              const deductData = {
                taxAmount,
                winnings,
                winAmount,
                amount: taxedAmount,
                account: account,
              };
              try {
                recordTrans.betWin(deductData);

                account.balance += taxedAmount;
                account.save();
              } catch (error) {
                console.log(error);
              }
            }
          });
        // end winningfto db
      }
      bet.save();
    });
    recordTrans.betEnded();
    return true;
  },

  placeBet: async (amount, rate, user) => {
    // check user bet
    // console.log("user", amount, rate, user);
    const userBet = await Bets.findOne({ user: user, status: "wait" });
    if (userBet) {
      return {
        status: "error",
        message: "Bet in progress. wait bet to end",
      };
    }
    const betModel = new Bets({
      amount,
      rate,
      user,
      status: "wait",
    });
    const bet = await betModel.save();
    user.bets.push(betModel);
    // console.log("user", betModel);
    await user.save();

    return bet;
  },
  addBots: async () => {
    // generate random bots
    const skipR = Math.floor(Math.random() * (20 - 1 + 1)) + 1;
    const bots = User.find({ role: "bot" }).skip(skipR).limit(10).cursor();
    const minBet = 20;
    const maxBet = 3000;
    const minRate = 1;
    const maxRate = 10;
    bots.forEach((bot) => {
      Bets.create({
        amount: Math.floor(Math.random() * (maxBet - minBet + 1)) + minBet,
        rate: (Math.random() * (maxRate - minRate) + minRate).toFixed(2),
        user: bot,
        status: "wait",
      });
    });
  },

 updateGameResults : async () => {
  const db = await connectToDatabase();
  // const collection = db.collection('mygameResults'); // Replace with your collection name

  
    try {
      // Connect to MongoDB
     
      // Specify the collection you want to update
      const collection = db.collection('gameResults'); // Replace with your collection name
  
      // Update documents to set 'played' to 0 for all documents
      const result = await collection.updateMany({}, { $set: { played: 0 } });
  
      console.log(`Updated ${result.modifiedCount} documents in the gameResults collection.`);
    } catch (error) {
      console.error('Error updating documents:', error);
    } finally {
      // Close the MongoDB connection
      client.close();
    }
  },
  
};
