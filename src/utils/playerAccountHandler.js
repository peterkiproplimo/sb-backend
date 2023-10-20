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
async function updatePlayerAc(account, transaction) {
  try {
    if (account.isfirstdebosit && parseFloat(transaction.amount) >= 100) {
      account.karibubonus = parseFloat(args.amount) * 2;
      if (account.karibubonus >= 10000) {
        account.karibubonus = 10000;
      }
      account.isfirstdebosit = false;
      const currentDate = new Date();
      const sevenDaysLater = new Date(currentDate);
      sevenDaysLater.setDate(currentDate.getDate() + 7);
      const formattedDate = sevenDaysLater.toISOString().replace(/\.000/, "");

      account.bonusexpirydate = formattedDate;
      await account.save();

      const log = new Logs({
        ip: "deposits",
        description: `${account?.user?.username} deposited ${transaction.amount}- Account Name:${account?.user?.username}`,
        user: transaction.userId,
      });
      await log.save();
    } else {
      account.balance =
        parseFloat(account?.balance) + parseFloat(transaction.amount);
      await account.save();

      const log = new Logs({
        ip: "deposits",
        description: `${account?.user?.username} deposited ${transaction.amount}- Account Name:${account?.user?.username}`,
        user: transaction.userId,
      });
      await log.save();
    }
    // const ipAddress = req.socket.remoteAddress;
  } catch (err) {}
}

async function handleKaribuBonusAndBalance(account, args) {
  let lessbonusamount = 0;
  const currentDate = new Date();

  if (
    account.karibubonus > 0 &&
    account.karibubonus >= parseFloat(args.playerbetInput.betAmount) &&
    currentDate <= account.bonusexpirydate
  ) {
    account.karibubonus =
      parseFloat(account?.karibubonus) -
      parseFloat(args.playerbetInput.betAmount);

    account.totalbetamount =
      parseFloat(account?.totalbetamount) +
      parseFloat(args.playerbetInput.betAmount);
    await account.save();
  } else if (
    account.karibubonus > 0 &&
    account.karibubonus < parseFloat(args.playerbetInput.betAmount) &&
    currentDate <= account.bonusexpirydate
  ) {
    lessbonusamount = account.karibubonus;
    account.karibubonus = 0;
    account.balance =
      parseFloat(account?.balance) -
      parseFloat(args.playerbetInput.betAmount) +
      lessbonusamount;
    account.bonusredeemed = true;
    account.totalbetamount =
      parseFloat(account?.totalbetamount) +
      parseFloat(args.playerbetInput.betAmount);
    await account.save();
  } else {
    account.balance =
      parseFloat(account?.balance) - parseFloat(args.playerbetInput.betAmount);
    account.totalbetamount =
      parseFloat(account?.totalbetamount) +
      parseFloat(args.playerbetInput.betAmount);
    await account.save();
  }
}

module.exports = {
  updatePlayerAc,
  handleKaribuBonusAndBalance,
};
