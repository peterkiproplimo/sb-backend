"use strict";
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const { graphqlHTTP } = require("express-graphql");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

var schedule = require("node-schedule");
const moment = require("moment");
const otpGenerator = require("otp-generator");
var request = require("request");
const axios = require("axios");
const formatDate = require("./src/utils/formatDate");
// const { WebSocketServer } = require('ws');
const http = require("http");
const app = express();
const server = http.createServer(app);
var mysql = require("mysql");
const socketAuth = require("./src/middleware/socketAuth");
//importing mongoose models

const Account = require("./src/models/Account");
const Bet = require("./src/models/Bet");
const Transaction = require("./src/models/transactions");
const Logs = require("./src/models/logs");
const BetHistory = require("./src/models/bethistory");
// const Game = require("./src/models/gamedata");
const OTP = require("./src/models/verifier");
const Admin = require("./src/models/admins");
const AdminLog = require("./src/models/adminlogs");
// Import the resolvers and the schema

const schema = require("./src/schema");
const resolvers = require("./src/resolvers");
//import the midleware to check for every incoming request if user is authenticated
const isAuth = require("./src/middleware/is-auth");
const house = require("./src/models/house");

const connectToDatabase = require("./config/database"); // Update the path if needed

const Actives = require("./src/models/activeusers");

const cors = require("cors");

// Get Socket io manenos
const { socketIO, socketCON } = require("./src/socket/socketio");
const { connection } = require("./src/socket/gameHandler");

const corsOptions = {
  origin: "*",
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(isAuth);
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

let betsLive = [];

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

let _multipliers = [];
let timerPaused = false; // Flag t
let currentMultiplierBatch = []; // Array to store the current batch of multipliers
let batchIndex = 0;
let value = 1.0;
const incrementInterval = 60; // milliseconds
const incrementStep = 0.01; // Step to achieve 1 decimal place
let targetValueIndex = 0;
let gameround = 1;

async function fetchMultipliersBatch() {
  try {
    const db = await connectToDatabase();
    const collection = db.collection("gameResults"); // Replace with your collection name

    // Fetch a batch of 100 multipliers and store them in currentMultiplierBatch
    currentMultiplierBatch = await collection
      .find({ played: 0 })
      .limit(100)
      .toArray();

    if (currentMultiplierBatch.length === 0) {
      // Handle the case when there are no more multipliers in the database
      console.log("No more multipliers available in the database.");
      return;
    }

    batchIndex = 0; // Reset the batch index to start from the beginning
  } catch (error) {
    console.error("Error fetching multipliers:", error);
  }
}

function getNextMultiplier() {
  gameround++;

  io.emit("nextround", gameround);

  if (batchIndex < currentMultiplierBatch.length) {
    const nextMultiplier = currentMultiplierBatch[batchIndex];
    batchIndex++;
    return nextMultiplier;
  } else {
    // If the batch is exhausted, fetch a new batch
    fetchMultipliersBatch();
    return getNextMultiplier();
  }
}

fetchMultipliersBatch();

function updateTimerWithMultipliers(multiplier) {
  if (value < multiplier.bustpoint && !timerPaused) {
    // Increment the value by incrementStep
    value += incrementStep;

    io.emit("updateTimer", value.toFixed(2)); // Emit the updated value to all connected clients
  } else {
    if (value >= multiplier.bustpoint) {
      timerPaused = true;
      io.emit("successMessage", "Busted @" + multiplier.bustpoint);
      updatePlayedField(multiplier);
      io.emit("updateTimer", "");
      io.emit("loadwinners", "");

      setTimeout(() => {
        io.emit("successMessage", ""); // Clear the "Busted" message
        waitCount();
      }, 2000);

      value = 1.0;
    }
  }

  // Continue updating the timer if it's not paused
  if (!timerPaused) {
    setTimeout(() => {
      // const nextMultiplier = getNextMultiplier();
      updateTimerWithMultipliers(multiplier);
    }, incrementInterval);
  }
}

function waitCount() {
  // console.log('Waiting before moving to the next multiplier:', multiplier[targetValueIndex]);
  timerPaused = true;
  // Set the initial countdown value
  let countdownValue = 5.0;

  // Set the decrement interval and step
  const decrementInterval = 99; // 100 milliseconds
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
      // io.emit('successMessage', ''); // Clear the "Busted" message
      targetValueIndex++;

      const nextMultiplier = getNextMultiplier();

      if (nextMultiplier) {
        // Start the timer with the next multiplier

        updateTimerWithMultipliers(nextMultiplier);
      } else {
        // Handle the case when there are no more multipliers
        console.log("No more multipliers available.");
      }
      // getMultipliersFromDatabase(); // Continue with the next multiplier
    }
  }, decrementInterval);
}

async function startGame() {
  // Start the game by waiting for the initial countdown
  await waitCount();
}

async function updatePlayedField(multiplier) {
  try {
    const db = await connectToDatabase();
    const collection = db.collection("gameResults");

    // Update the "played" field to 1 for the current multiplier
    await collection.updateOne(
      { _id: multiplier._id },
      { $set: { played: 1 } }
    );

    console.log(
      `Updated "played" field for multiplier with _id ${multiplier._id}`
    );
  } catch (error) {
    console.error("Error updating played field:", error);
  }
}

// Start the database connection and then start the server
// connectToDatabase()
//   .then(() => {
// Start the Express server
// const port = process.env.PORT || 8000;
// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });

server.listen(3001, async () => {
  startGame();
  // StartBust();
  console.log(`listening on 3001`);
});

// })
// .catch((error) => {
//   console.error("Error connecting to the database:", error);
// });
