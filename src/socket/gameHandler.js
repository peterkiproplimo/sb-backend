const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { placeBet } = require("../utils/bustgame");
const { stkpush } = require("../accounts/mpesa_c2b");
const Account = require("../models/Account");
const OperationClass = require("../accounts/transactionclass");
const { Userwithdraw } = require("../accounts/mpesa_b2c");

//connection definition
const connection = async (io, socket) => {
  // on connection function
  const onlineUsers = socket.conn.server.clientsCount;
  //console.log(`⚡: ${socket.id} user connected`);
  socket.emit("users_online", onlineUsers);
  socket.on("disconnection", () => {
    socket.emit("users_onlne", onlineUsers);
  });

  socket.on("user_login", async (callback) => {
    if (!socket.isAuth) {
      return callback({ user: null, isAuth: socket.isAuth });
    }
    const user = await User.findById(socket.user.id)
      .populate("account")
      .populate("bets");
    return callback({ user: user, isAuth: socket.isAuth });
  });
  // check auth token
  // authorize(socket);
  // socket play
  socket.on("bet_place", (data, callback) => {
    if (!socket.isAuth) {
      callback({ status: "unauthorized" });
    }
    // check user account balance
    User.findById(socket.user.id)
      .populate("account")
      .then((user) => {
        const account = user.account;
        const amount = data.amount;
        const rate = data.rate;
        // console.log(account);
        if (account.balance <= 0 || account.balance < amount || amount <= 0) {
          return callback({
            status: "error",
            message: "Insufficient funds on the account",
          });
        }
        // if user is  player, perform account transactions
        if (socket.user.role === "player") {
          const deductData = {
            amount: amount,
            account: account,
          };
          const recordTrans = new OperationClass();
          recordTrans.betplace(deductData);
        }
        account.balance -= amount;
        // console.log(account.balance);
        account.save();
        // console.log("user", user);
        const bet = placeBet(amount, rate, user).then((bet) => {
          return callback({
            status: "success",
            message: "Bet Placed Successfully",
          });
        });
      });
  });
  //chatting
  socket.on("chat_send", (data) => {
    //console.log(data);
  });

  // transactions
  socket.on("transaction_deposit", (data, callback) => {
    if (!socket.isAuth) {
      return callback({ status: "unauthorized" });
    }
    if (data.amount <= 50) {
      return callback({
        status: "error",
        message: "Failed. Invalid Amount",
      });
    }
    User.findById(socket.user.id)
      .populate("account")
      .then((user) => {
        const xDeposit = stkpush(data.amount, user).then((result) => {
          setTimeout(() => {
            //console.log(" res", result);
          }, 1000);
          // TO DO :  handle -- return response from stk call
          return callback({
            status: "success",
            message: "Check your phone and enter pin",
          });
        });
      });
  });

  socket.on("transaction_withdraw", (data, callback) => {
    if (!socket.isAuth) {
      return callback({ status: "unauthorized" });
    }
    if (data.amount + 20 <= 49) {
      return callback({
        status: "error",
        message: "Failed. Invalid Amount",
      });
    }
    User.findById(socket.user.id)
      .populate("account")
      .then((user) => {
        //console.log("useris", user.username);
        //console.log("balance", user.account.balance);
        //console.log("withdraw", data.amount);
        return Userwithdraw(data.amount, user).then((result) => {
          setTimeout(() => {
            //console.log(" res", result);
          }, 1000);
          // TO DO :  handle -- return response from stk call
          return callback({
            status: "success",
            message: "Request Accepted For Processing...",
          });
        });
      });
  });
};

module.exports = { connection };
