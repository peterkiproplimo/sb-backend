"use strict";
const express = require("express");
require("dotenv").config();
const { graphqlHTTP } = require("express-graphql");
var schedule = require("node-schedule");
const http = require("http");
const app = express();
const httpServer = http.createServer(app);
const socketAuth = require("./src/middleware/socketAuth");
const schema = require("./src/schema");
const resolvers = require("./src/resolvers");
//import the midleware to check for every incoming request if user is authenticated
const AuthHandler = require("./src/middleware/authHandler");
// const authenticateToken = require("./src/utils/authenticationHandler"); delete this unused import
const house = require("./src/models/house");
const Game = require("./src/models/Game");
const Account = require("./src/models/Account");
const Transaction = require("./src/models/transactions");
const { ApolloServer } = require("apollo-server-express");

// Update the path if needed
const cors = require("cors");

const Player = require("./src/models/Player");
const connectToDatabase = require("./config/database");
// Get Socket io manenos
const { socketIO } = require("./src/socket/socketio");
const { connection } = require("./src/socket/gameHandler");
const {
  setemitNextRound,
  setemitOngoingRound,
  setemitEndRound,
  getemitNextRound,
  getemitOngoingRound,
  getemitEndRound,
  generateRandomID,
  getMultipliers,
  setMultipliers,
} = require("./src/utils/gameroundUtils");

const { getLiveChat, fetchPlayersData } = require("./src/utils/livechatUtils");
const {
  generateFakePlayersAndBets,
  setFakePlayers,
  getFakePlayers,
  saveFakePlayers,
  deletePlayersByUsernames,
} = require("./src/utils/fakePlayerUtils");
const {
  checkBetsForWinsAndLosses,
  setGameHasBeenPlayed,
  setWinners,
  getEndResults,
  setAllNextRoundPlayersWithRoundId,
  getPlayersWaitingForNextRound,
  getHistory,
} = require("./src/utils/playgamedboperations");

const { updatePlayerAc } = require("./src/utils/playerAccountHandler");

const corsOptions = {
  origin: "*",
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};

// disabled this function

const server = new ApolloServer({
  schema,
  context: ({ req }) => ({
    user: req.user, // Pass authenticated user from middleware to GraphQL context
  }),
});

app.use(express.json());

app.use(AuthHandler); // Apply the middleware to authenticate JWT for all incoming requests

app.use((req, res, next) => {
  const allowedOrigins = [
    "https://safaribust.techsavanna.technology",
    "http://localhost:3001",
    "https://sbadmin.techsavanna.technology",
    "http://localhost:5173",
    "https://crash.safaribust.co.ke",
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, UPDATE"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
    "Origin, X-Requested-With, Accept"
  );
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.get("/remove", (req, res, next) => {
  betsLive = [];
  next();
});

//scheduler 0mim 0hour
schedule.scheduleJob("0 0 * * *", async function () {
  const houseAccount = await house.findOne({
    user: "62fb898a4a4d42002392750d",
  });
  (houseAccount.houseTotal = 0), console.log("dones");
  await houseAccount.save();
});

app.use(
  "/graphql",
  graphqlHTTP({
    schema: schema,
    rootValue: resolvers,
    graphiql: true,
  })
);

async function startApolloServer() {
  await server.start();

  // Apply Apollo Server middleware to the app after the server has started
  server.applyMiddleware({ app });

  // Start the server
  httpServer.listen(3002, async () => {
    await connectToDatabase();
    await startGame();
    await getMultiplierValue();

    console.log(`listening on 3002`);
  });
}

startApolloServer().catch((err) => {
  console.error("Error starting Apollo Server:", err);
});

const io = socketIO(httpServer);

const onConnection = (socket) => {
  connection(io, socket);
};

io.on("connection", onConnection);
io.use(socketAuth);
app.use(cors());

app.post("/mpesa-callback", async (req, res) => {
  // Handle the incoming M-Pesa callback data here
  const mpesaCallbackData = req.body;
  console.log("Received M-Pesa callback:", mpesaCallbackData);
  const transaction = await Transaction.findOne({
    MerchantRequestID: mpesaCallbackData.Body.stkCallback.MerchantRequestID,
    CheckoutRequestID: mpesaCallbackData.Body.stkCallback.CheckoutRequestID,
  });

  if (transaction) {
    if (mpesaCallbackData.Body.stkCallback.ResultCode == 1032) {
      try {
        // Transaction canceled by the user
        transaction.status = 2; //cancelled
        await transaction.save();
      } catch (error) {
        console.error("Error updating transaction (cancellation):", error);
      }
    } else if (mpesaCallbackData.Body.stkCallback.ResultCode == 0) {
      // Update the transaction with the data from the response body
      try {
        transaction.status = 1; // successfull
        transaction.amount =
          mpesaCallbackData.Body.stkCallback.CallbackMetadata.Item.find(
            (item) => item.Name === "Amount"
          ).Value;
        transaction.mpesaReceiptNumber =
          mpesaCallbackData.Body.stkCallback.CallbackMetadata.Item.find(
            (item) => item.Name === "MpesaReceiptNumber"
          ).Value;
        transaction.transactionDate =
          mpesaCallbackData.Body.stkCallback.CallbackMetadata.Item.find(
            (item) => item.Name === "TransactionDate"
          ).Value;
        transaction.phone =
          mpesaCallbackData.Body.stkCallback.CallbackMetadata.Item.find(
            (item) => item.Name === "PhoneNumber"
          ).Value;

        // Save the updated transaction
        await transaction.save();

        // Find the player AC
        const playeraccount = await Account.findOne({ user: transaction.user });

        await updatePlayerAc(playeraccount, transaction);

        const currentbalance = await Account.findOne({
          user: transaction.user,
        });

        const balance = currentbalance.balance;

        const totalbalance3 =
          parseFloat(currentbalance.balance) +
          parseFloat(currentbalance.karibubonus);
        console.log("User doing deposit", currentbalance.user);

        // io.emit(currentbalance.user, balance);

        await emitToUser(currentbalance.user, totalbalance3);
      } catch (error) {
        console.error("Error updating transaction (success):", error);
      }
    }
  } else {
    console.log("Transaction not found in the database.");
  }

  // Respond to the M-Pesa API with an appropriate response (e.g., a success message)
  res.json({ result: "Callback received and processed successfully" });
});

app.post("/mpesa-result", async (req, res) => {
  // Handle the incoming M-Pesa callback data here
  const mpesaCallbackData = req.body;
  console.log("Received M-Pesa callback:", mpesaCallbackData);

  const transaction = await Transaction.findOne({
    OriginatorConversationID: mpesaCallbackData.Result.OriginatorConversationID,
    ConversationID: mpesaCallbackData.Result.ConversationID,
  });

  if (transaction) {
    if (mpesaCallbackData.Result.ResultCode == 1) {
      try {
        // Insuficient balance
        transaction.status = 0; //failed
        transaction.ResultDesc = mpesaCallbackData.Result.ResultDesc;
        await transaction.save();
      } catch (error) {
        console.error("Error updating transaction (cancellation):", error);
      }
    } else if (mpesaCallbackData.Result.ResultCode == 0) {
      try {
        // Successfull
        transaction.status = 1; // success
        transaction.ResultDesc = mpesaCallbackData.Result.ResultDesc;

        // Get the user account
        const account = await Account.findOne({
          user: transaction.user,
        });

        const totalbalance =
          parseFloat(account?.balance) + parseFloat(account?.karibubonus);

        // Emit the current account balance to the frontend
        await emitToUser(transaction?.user, totalbalance);

        await transaction.save();
      } catch (error) {
        console.error("Error updating transaction (cancellation):", error);
      }
    }
  }

  // Respond to the M-Pesa API with an appropriate response (e.g., a success message)
  res.json({ result: "Callback received and processed successfully" });
});

/*
Check the socket ID based on the user id from the database
Emit the account balance to the socket ID
*/

app.post("/confirmcompletedtrans", (req, res) => {
  // Handle the incoming M-Pesa callback data here
  const mpesaCallbackData = req.body;
  console.log("Received M-Pesa callback:", mpesaCallbackData);

  res.json({ result: "Callback received and processed successfully" });
});

app.post("/validatecompletedtrans", (req, res) => {
  // Handle the incoming M-Pesa callback data here
  const mpesaCallbackData = req.body;
  console.log("Received M-Pesa callback:", mpesaCallbackData);

  res.json({ result: "Callback received and processed successfully" });
});

app.post("/mpesa-timeout", (req, res) => {
  // Handle the incoming M-Pesa callback data here
  const mpesaCallbackData = req.body;
  console.log("Received M-Pesa callback:", mpesaCallbackData);

  res.json({ result: "Callback received and processed successfully" });
});

let timerPaused = false; // Flag t
let currentMultiplierBatch = []; // Array to store the current batch of multipliers
let batchIndex = 0;
let value = 1.0;
const incrementInterval = 60; // milliseconds
const incrementStep = 0.01; // Step to achieve 1 decimal place
let targetValueIndex = 0;

let BET_MULTIPLIERVALUE = 0;

setemitNextRound(false);
setemitOngoingRound(false);
setemitEndRound(false);
await fetchMultipliersBatch();

// io.to('socket#id').emit('hey')

//  Fetch batch multipliers from the database
async function fetchMultipliersBatch() {
  try {
    // Fetch a batch of 100 multipliers and store them in currentMultiplierBatch
    currentMultiplierBatch = await Game.find({ played: 0 }).limit(1000);

    if (currentMultiplierBatch.length === 0) {
      console.log("no multipliers");
      // Handle the case when there are no more multipliers in the database
      return;
    }

    batchIndex = 0; // Reset the batch index to start from the beginning
  } catch (error) {
    console.error("Error fetching multipliers:", error);
  }
}

async function getNextMultiplier() {
  const nextGameroundID = await generateRandomID(32);

  //  Save next round in database
  io.emit("nextround", nextGameroundID);
  setemitOngoingRound(true);
  setemitEndRound(false);
  setemitNextRound(false);
  if (batchIndex < currentMultiplierBatch.length) {
    const nextMultiplier = currentMultiplierBatch[batchIndex];

    setMultipliers(nextMultiplier);
    batchIndex++;
    return nextMultiplier;
  } else {
    // If the batch is exhausted, fetch a new batch
    await fetchMultipliersBatch();

    return await getNextMultiplier();
  }
}

async function runMultiplierTimer(multiplier) {
  setemitOngoingRound(true);
  setemitEndRound(false);
  setemitNextRound(false);
  if (value < multiplier.bustpoint && !timerPaused) {
    // Increment the value by incrementStep
    setMultiplierValue((value += incrementStep));

    io.emit("updateTimer", value.toFixed(2));
  } else {
    if (value >= multiplier.bustpoint) {
      timerPaused = true;
      io.emit("updateTimer", "");
      io.emit("loadwinners", "");

      io.emit("successMessage", multiplier.bustpoint);

      setemitEndRound(true, multiplier.bustpoint);
      setemitOngoingRound(false);
      setemitNextRound(false);

      // Update winners/ losers
      // console.log("Get end Results");
      const playerBets = await getEndResults(multiplier, "endresults");

      //Emit player balances to frontend here

      io.emit("livedata", playerBets);
      await emitBalances(playerBets);

      // console.log("Update game has been played");/
      await setGameHasBeenPlayed(multiplier);

      // Generate fake players for the next round

      const kenyannames = require("./src/utils/keyannames.json");

      const fakePlayers = generateFakePlayersAndBets(kenyannames);
      setFakePlayers(fakePlayers);

      setTimeout(async () => {
        io.emit("successMessage", ""); // Clear the "Busted" message
        await waitCount();
      }, 2000);

      value = 1.0;
    }
  }

  // Continue updating the timer if it's not paused
  if (!timerPaused) {
    setTimeout(() => {
      runMultiplierTimer(multiplier);
    }, incrementInterval);
  }
}

async function waitCount() {
  setemitNextRound(true);
  setemitOngoingRound(false);
  setemitEndRound(false);

  timerPaused = true;
  // Set the initial countdown value
  let countdownValue = 5.0;

  // Set the decrement interval and step
  const decrementInterval = 100; // 100 milliseconds
  const decrementStep = 0.1;

  const intervalId = setInterval(async () => {
    // Emit the countdown value to clients
    countdownValue -= decrementStep;
    io.emit("countDown", "Next Round in " + countdownValue.toFixed(2));

    if (countdownValue <= 0.1) {
      clearInterval(intervalId);

      // After the countdown, resume the timer and continue to the next multiplier
      timerPaused = false;
      io.emit("countDown", "");
      targetValueIndex++;

      const nextMultiplier = await getNextMultiplier();

      if (nextMultiplier) {
        // Update all the players with the curent game id
        const setro = await setAllNextRoundPlayersWithRoundId(nextMultiplier);
        // Start the timer with the next multiplier

        if (setro) {
          await runMultiplierTimer(nextMultiplier);
        }
      } else {
        // Handle the case when there are no more multipliers
        // console.log("No more multipliers available.");
      }
    }
  }, decrementInterval);
}

//  Start the game
async function startGame() {
  // console.log("game started successfully");
  await waitCount();
}

//  Start server and Game

// Helper functions

function setMultiplierValue(value) {
  BET_MULTIPLIERVALUE = value;
  return getMultiplierValue();
}

function getMultiplierValue() {
  return BET_MULTIPLIERVALUE;
}

async function emitBalances(playerBets) {
  try {
    for (const bet of playerBets) {
      const userId = bet.userId._id;

      // Find the user's account using the userId
      const account = await Account.findOne({ user: userId });

      // console.log(userId);
      if (account) {
        const userBalance = account.balance; // Assuming 'balance' is the field in the account schema

        const totalbalance2 =
          parseFloat(account.balance) + parseFloat(account.karibubonus);
        await emitToUser(userId, totalbalance2);

        console.log(
          `Emitted balance (${userBalance}) for user ID: ${userId} through WebSocket`
        );
      } else {
        console.log(`Account not found for user ID: ${userId}`);
      }
    }
  } catch (error) {
    console.error("Error emitting balances:", error);
    // Handle errors if any occurred during the process
  }
}

async function emitToUser(userId, value) {
  io.emit(userId, value);
}
// Function to emit the live data

setInterval(async () => {
  try {
    if (getemitNextRound()) {
      const playerBets = await getPlayersWaitingForNextRound("waitingnext", 0);

      io.emit("livedata", playerBets);
    } else if (getemitOngoingRound()) {
      const multvalue = getMultiplierValue();
      const multipliers = getMultipliers();

      await setWinners(multvalue, multipliers);
      const playerBets = await checkBetsForWinsAndLosses(
        multipliers,
        "ongoing",
        multvalue
      );

      io.emit("livedata", playerBets);
    } else if (getemitEndRound()) {
      // emit player balances
      // Generate fake players for the next round
    } else {
      // console.log("Ok3");
    }
    // Perform actions with player bets here
  } catch (error) {
    // Handle the error here
    console.error("An error occurred while checking bets:", error);
  }

  //  Function to perform the live chat
}, 1500);

//  Get online / playing players
setInterval(async () => {
  const onlineorplaying = await fetchPlayersData();

  io.emit("onlineorplaying", onlineorplaying);
}, 5000);

//  Get live chat
setInterval(async () => {
  const livechat = await getLiveChat();

  io.emit("livechat", livechat);
}, 300);

//  For history
setInterval(async () => {
  const historybets = await getHistory();

  io.emit("historybets", historybets);
}, 300);

// saveFakePlayers();

module.exports = { io };
