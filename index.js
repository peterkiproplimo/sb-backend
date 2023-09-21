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
const Chat = require("./src/models/Chat");
const connectToDatabase = require("./config/database"); // Update the path if needed
const cors = require("cors");
const Player = require("./src/models/Player");
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
} = require("./src/utils/gameroundUtils");
const {
  checkBetsForWinsAndLosses,
  updatePlayedField,
  getRoundFromDatabase,
  getCurrentRoundFromDatabase,
  saveRoundIndB,
  saveCurrentRound,
  updateRound,
  setWinners,
} = require("./src/utils/playgamedboperations");

const corsOptions = {
  origin: "*",
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};

app.use(express.json());
app.use(isAuth);
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3001");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, UPDATE"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
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

let timerPaused = false; // Flag t
let currentMultiplierBatch = []; // Array to store the current batch of multipliers
let batchIndex = 0;
let value = 1.0;
const incrementInterval = 40; // milliseconds
const incrementStep = 0.01; // Step to achieve 1 decimal place
let targetValueIndex = 0;

let BET_MULTIPLIERVALUE = 0;

setemitNextRound(false);
setemitOngoingRound(false);
setemitEndRound(false);

let currentRound = null;

async function fetchMultipliersBatch() {
  try {
    const db = await connectToDatabase();
    const collection = db.collection("gameResults"); // Replace with your collection name

    // Fetch a batch of 100 multipliers and store them in currentMultiplierBatch
    currentMultiplierBatch = await collection
      .find({ played: 0 })
      .limit(2000)
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

fetchMultipliersBatch();

async function updateTimerWithMultipliers(multiplier) {
  setemitOngoingRound(true);
  setemitEndRound(false);
  setemitNextRound(false);
  if (value < multiplier.bustpoint && !timerPaused) {
    // Increment the value by incrementStep
    setMultiplierValue((value += incrementStep));

    io.emit("updateTimer", value.toFixed(2)); // Emit the updated value to all connected clients
  } else {
    if (value >= multiplier.bustpoint) {
      timerPaused = true;
      io.emit("successMessage", "Busted @" + multiplier.bustpoint);
      setemitEndRound(true);
      setemitOngoingRound(false);
      setemitNextRound(false);
      console.log("Ok");
      updatePlayedField(multiplier);
      io.emit("updateTimer", "");
      io.emit("loadwinners", "");

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

async function startGame() {
  await waitCount();
}

//  Start server and Game

server.listen(3002, async () => {
  await startGame();
  getMultiplierValue();

  console.log(`listening on 3002`);
});

// Helper functions

async function getNextMultiplier() {
  const nextGameroundID = await generateRandomID(32);
  setNextRound(nextGameroundID);
  setemitOngoingRound(true);

  currentRound = getnextRound();

  io.emit("nextround", nextGameroundID);
  await saveRoundIndB(nextGameroundID);
  console.log("next game round", getnextRound());
  if (batchIndex < currentMultiplierBatch.length) {
    const nextMultiplier = currentMultiplierBatch[batchIndex];
    batchIndex++;
    updateRound(nextMultiplier, nextGameroundID);
    return nextMultiplier;
  } else {
    // If the batch is exhausted, fetch a new batch
    fetchMultipliersBatch();

    return getNextMultiplier();
  }
}

function setMultiplierValue(value) {
  BET_MULTIPLIERVALUE = value;
  return getMultiplierValue();
}
function getMultiplierValue() {
  return BET_MULTIPLIERVALUE;
}

// Function to emit the live data

setInterval(async () => {
  try {
    if (getemitNextRound()) {
      const currentroundId = await getCurrentRoundFromDatabase();

      const playerBets = await checkBetsForWinsAndLosses(currentroundId);
      io.emit("livedata", playerBets);
    } else if (getemitOngoingRound()) {
      const multvalue = getMultiplierValue();
      const currentroundId = await getCurrentRoundFromDatabase();
      await setWinners(multvalue, currentroundId);
      console.log(currentroundId);
      const playerBets = await checkBetsForWinsAndLosses(currentroundId);
      io.emit("livedata", playerBets);
    } else if (getemitEndRound()) {
      console.log("Ok2");
      const currentroundId = await getCurrentRoundFromDatabase();
      const playerBets = await checkBetsForWinsAndLosses(currentroundId);
      io.emit("livedata", playerBets);
    } else {
      console.log("Ok3");
    }
    // Perform actions with player bets here
  } catch (error) {
    // Handle the error here
    console.error("An error occurred while checking bets:", error);
  }

  const latestChats = await Chat.find({})
    .sort({ createdAt: -1 }) // Sort by createdAt in descending order (most recent first)
    .limit(20);
  // Limit the result to 20 messages
  const chatsWithDetails = await Chat.populate(latestChats, {
    path: "user", // Match this with the field name in Playerbet model that references User model
    model: Player, // Reference the User model
  });
  // Reverse the order to have the latest messages at the end of the array
  const latestChatsReversed = chatsWithDetails.reverse();
  io.emit("livechat", latestChatsReversed);
}, 300);

// Update the players win/lose as the counter continue's with the counting

//  Get the next game round id

async function generateRandomID(length) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomID = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomID += characters.charAt(randomIndex);
  }

  return randomID;
}

module.exports = { io };
