// importScripts
const connectToDatabase = require("../../config/database"); // Update the path if needed
const Player = require("../models/Player");
const Playerbet = require("../models/PlayerBet");
const { ObjectId } = require("mongodb");
const Account = require("../models/Account");
const BetTransaction = require("../models/BetTransactions");
const Transaction = require("../models/transactions");
const Transrequest = require("../models/Transrequest");
const Logs = require("../models/logs");
const Player = require("../models/Player");
async function updatePlayerAc(account, transaction) {
  try {
    if (account.isfirstdebosit && parseFloat(transaction.amount) >= 100) {
      account.karibubonus = parseFloat(transaction.amount) * 2;
      account.isfirstdebosit = false;
      const currentDate = new Date();
      const sevenDaysLater = new Date(currentDate);
      sevenDaysLater.setDate(currentDate.getDate() + 7);
      const formattedDate = sevenDaysLater.toISOString().replace(/\.000/, "");

      account.bonusexpirydate = formattedDate;
    }

    account.balance =
      parseFloat(account?.balance) + parseFloat(transaction.amount);
    await account.save();
    // const ipAddress = req.socket.remoteAddress;
    const log = new Logs({
      ip: "deposits",
      description: `${account?.user?.username} deposited ${transaction.amount}- Account Name:${account?.user?.username}`,
      user: transaction.userId,
    });
    await log.save();
  } catch (err) {}
}
module.exports = {
  updatePlayerAc,
};
