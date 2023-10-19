"use strict";
const express = require("express");
require("dotenv").config();
const { graphqlHTTP } = require("express-graphql");
var schedule = require("node-schedule");
const http = require("http");
const app = express();
const server = http.createServer(app);
const socketAuth = require("./src/middleware/socketAuth");
const schema = require("./src/schema");
const resolvers = require("./src/resolvers");
//import the midleware to check for every incoming request if user is authenticated
const isAuth = require("./src/middleware/is-auth");
const house = require("./src/models/house");
const Account = require("./src/models/Account");
const Transaction = require("./src/models/transactions");
// Update the path if needed
const cors = require("cors");

const Player = require("./src/models/Player");
const connectToDatabase = require("./config/database");
// Get Socket io manenos
const { socketIO } = require("./src/socket/socketio");
const { connection } = require("./src/socket/gameHandler");
const {
  getnextRound,
  setNextRound,
  setemitNextRound,
  setemitOngoingRound,
  setemitEndRound,
  getemitNextRound,
  getemitOngoingRound,
  getemitEndRound,
  generateRandomID,
  getendValue,
  getCurrentRound,
  setCurrentRound,
} = require("./src/utils/gameroundUtils");

const { getLiveChat } = require("./src/utils/livechatUtils");
const {
  generateFakePlayersAndBets,
  setFakePlayers,
  getFakePlayers,
} = require("./src/utils/fakePlayerUtils");
const {
  checkBetsForWinsAndLosses,
  updatePlayedField,
  getRoundFromDatabase,
  getCurrentRoundFromDatabase,
  saveRoundIndB,
  saveCurrentRound,
  updateRound,
  setWinners,
  getEndResults,
  createHistory,
} = require("./src/utils/playgamedboperations");

const { updatePlayerAc } = require("./src/utils/playerAccountHandler");

const corsOptions = {
  origin: "*",
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};

app.use(express.json());
app.use(isAuth);
app.use((req, res, next) => {
  const allowedOrigins = [
    "https://safaribust.techsavanna.technology",
    "http://localhost:3001",
    "https://sbadmin.techsavanna.technology",
    "http://localhost:5173",
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

const io = socketIO(server);

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
        transaction.status = "cancelled";
        await transaction.save();
      } catch (error) {
        console.error("Error updating transaction (cancellation):", error);
      }
    } else if (mpesaCallbackData.Body.stkCallback.ResultCode == 0) {
      // Update the transaction with the data from the response body
      try {
        transaction.status = "successfull";
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

        const playeraccount = await Account.findOne({ user: transaction.user });

        console.log(playeraccount);
        updatePlayerAc(playeraccount, transaction);
      } catch (error) {
        console.error("Error updating transaction (success):", error);
      }
    }
  } else {
    console.log("Transaction not found in the database.");
  }

  // Perform any necessary processing based on the callback data
  // ...

  // Respond to the M-Pesa API with an appropriate response (e.g., a success message)
  res.json({ result: "Callback received and processed successfully" });
});

app.post("/mpesa-result", (req, res) => {
  // Handle the incoming M-Pesa callback data here
  const mpesaCallbackData = req.body;
  console.log("Received M-Pesa callback:", mpesaCallbackData);

  // Perform any necessary processing based on the callback data
  // ...

  // Respond to the M-Pesa API with an appropriate response (e.g., a success message)
  res.json({ result: "Callback received and processed successfully" });
});

app.post("/mpesa-timeout", (req, res) => {
  // Handle the incoming M-Pesa callback data here
  const mpesaCallbackData = req.body;
  console.log("Received M-Pesa callback:", mpesaCallbackData);

  // Perform any necessary processing based on the callback data
  // ...

  // Respond to the M-Pesa API with an appropriate response (e.g., a success message)
  res.json({ result: "Callback received and processed successfully" });
});

let timerPaused = false; // Flag t
let currentMultiplierBatch = []; // Array to store the current batch of multipliers
let batchIndex = 0;
let value = 1.0;
const incrementInterval = 40; // milliseconds
const incrementStep = 0.01; // Step to achieve 1 decimal place
let targetValueIndex = 0;

let BET_MULTIPLIERVALUE = 0;
let currentRound = null;

setemitNextRound(false);
setemitOngoingRound(false);
setemitEndRound(false);
fetchMultipliersBatch();

//  Fetch batch multipliers from the database
async function fetchMultipliersBatch() {
  try {
    const db = await connectToDatabase();
    const collection = db.collection("gameResults"); // Replace with your collection name

    // Fetch a batch of 100 multipliers and store them in currentMultiplierBatch
    currentMultiplierBatch = await collection
      .find({ played: 0 })
      .limit(10)
      .toArray();

    if (currentMultiplierBatch.length === 0) {
      // Handle the case when there are no more multipliers in the database
      // console.log("No more multipliers available in the database.");
      return;
    }

    batchIndex = 0; // Reset the batch index to start from the beginning
  } catch (error) {
    console.error("Error fetching multipliers:", error);
  }
}

async function updateTimerWithMultipliers(multiplier) {
  setemitOngoingRound(true);
  setemitEndRound(false);
  setemitNextRound(false);
  if (value < multiplier.bustpoint && !timerPaused) {
    // Increment the value by incrementStep
    setMultiplierValue((value += incrementStep));
    // console.log("value" + value);
    io.emit("updateTimer", value.toFixed(2)); // Emit the updated value to all connected clients
  } else {
    if (value >= multiplier.bustpoint) {
      timerPaused = true;
      io.emit("updateTimer", "");
      io.emit("loadwinners", "");

      io.emit("successMessage", multiplier.bustpoint);

      setemitEndRound(true, multiplier.bustpoint);
      setemitOngoingRound(false);
      setemitNextRound(false);

      const currentroundId = await getCurrentRoundFromDatabase();
      // const currentroundId = multiplier.round;
      // console.log("current round id", multiplier);

      const playerBets = await getEndResults(
        currentroundId,
        multiplier.bustpoint,
        "endresults"
      );

      io.emit("livedata", playerBets);

      const historybets = await updatePlayedField(multiplier);

      io.emit("historybets", historybets);

      // Update win/ lose in database

      // Generate fake players for the next round here

      const numPlayersToGenerate = 20;
      const fakePlayers = generateFakePlayersAndBets(numPlayersToGenerate);
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
      updateTimerWithMultipliers(multiplier);
    }, incrementInterval);
  }
}

async function waitCount() {
  setemitNextRound(true);
  setemitOngoingRound(false);
  setemitEndRound(false);
  const currentRound = await getRoundFromDatabase();
  await saveCurrentRound(currentRound);

  timerPaused = true;
  // Set the initial countdown value
  let countdownValue = 10.0;

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
        // Start the timer with the next multiplier

        await updateTimerWithMultipliers(nextMultiplier);
      } else {
        // Handle the case when there are no more multipliers
        console.log("No more multipliers available.");
      }
    }
  }, decrementInterval);
}

async function getNextMultiplier() {
  const nextGameroundID = await generateRandomID(32);
  setNextRound(nextGameroundID);
  setemitOngoingRound(true);

  currentRound = getnextRound();

  //  Save next round in database
  io.emit("nextround", nextGameroundID);
  await saveRoundIndB(nextGameroundID);

  if (batchIndex < currentMultiplierBatch.length) {
    const nextMultiplier = currentMultiplierBatch[batchIndex];
    batchIndex++;
    await updateRound(nextMultiplier, nextGameroundID);
    return nextMultiplier;
  } else {
    // If the batch is exhausted, fetch a new batch
    fetchMultipliersBatch();

    return getNextMultiplier();
  }
}

//  Start the game
async function startGame() {
  await waitCount();
}

//  Start server and Game

server.listen(3002, async () => {
  // await startGame();
  // getMultiplierValue();

  console.log(`listening on 3002`);
});

// Helper functions

function setMultiplierValue(value) {
  BET_MULTIPLIERVALUE = value;
  return getMultiplierValue();
}
function getMultiplierValue() {
  return BET_MULTIPLIERVALUE;
}

// Function to emit the live data

// setInterval(async () => {
//   try {
//     if (getemitNextRound()) {
//       const currentroundId = await getCurrentRoundFromDatabase();
//       console.log("Waiting for next round", currentroundId);
//       const playerBets = await checkBetsForWinsAndLosses(
//         currentroundId,
//         "waitingnext",
//         0
//       );

//       io.emit("livedata", playerBets);
//     } else if (getemitOngoingRound()) {
//       const multvalue = getMultiplierValue();

//       const currentroundId = await getCurrentRoundFromDatabase();

//       console.log("current running round", currentroundId);
//       // setCurrentRound(currentroundId);

//       await setWinners(multvalue, currentroundId);
//       const playerBets = await checkBetsForWinsAndLosses(
//         currentroundId,
//         "ongoing",
//         multvalue
//       );
//       // console.log(playerBets);
//       io.emit("livedata", playerBets);
//     } else if (getemitEndRound()) {
//       // Generate fake players for the next round

//       const endvalue = getendValue();
//       const currentroundId = getCurrentRound();
//     } else {
//       console.log("Ok3");
//     }
//     // Perform actions with player bets here
//   } catch (error) {
//     // Handle the error here
//     console.error("An error occurred while checking bets:", error);
//   }

//   //  Function to perform the live chat
//   const livechat = await getLiveChat();

//   io.emit("livechat", livechat);
// }, 300);

module.exports = { io };
