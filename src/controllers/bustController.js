const connectToDatabase = require("../../config/database");

const crypto = require("crypto");
const mongoXlsx = require("mongo-xlsx");
const fs = require("fs");
const Game = require("../models/Game");

const axios = require("axios");

const bustResolvers = {
  generateSHA512: (_, { inputString = "DefaultString" }) => {
    const hash = crypto.createHash("sha256").update(inputString).digest("hex");
    return hash;
  },

  veryfyGame: async (
    _,
    { inputString = "11faeb189a4fa6177cde227273b67cea9460d21be8e25e5d16" }
  ) => {
    try {
      const hash = inputString; // You can adjust the length as needed

      let bust = gameVerifier(hash);
      return {
        bust,
        hash,
      };
    } catch (error) {
      throw new Error("Error generating salted SHA-256 hash.");
    }
  },

  generateSaltedSHA256: async () => {
    try {
      const blockHeight = await getCurrentBlockHeight();
      // const blockHex = await getBlockHex(blockHeight);
      const blockHex =
        "000000000000000000025807140ca8759beab23b6ff8fc5c68f94d640fc85a13";

      const salt = blockHex;

      const inputString = crypto.randomBytes(32).toString("hex"); // You can adjust the length as needed

      const saltedHash = generateSaltedSHA256Hash(inputString, salt);
      //return saltedHash;

      const result = gameResult(saltedHash);

      // return result;
      return result;
    } catch (error) {
      throw new Error("Error generating salted SHA-256 hash.");
    }
  },

  generateServerSeed: () => crypto.randomBytes(256).toString("hex"),

  generateClientSeed: () => crypto.randomBytes(64).toString("hex"),
};

async function getCurrentBlockHeight() {
  const response = await axios.get("https://blockchain.info/q/getblockcount");
  return parseInt(response.data);
}

async function getBlockHex(blockHeight) {
  const response = await axios.get(
    `https://blockchain.info/block-height/${blockHeight}?format=json`
  );
  return response.data.blocks[0].hash;
}

function generateSaltedSHA256Hash(inputString, salt) {
  const saltedInput = inputString + salt;
  const hash = crypto.createHash("sha256").update(saltedInput).digest("hex");
  return hash;
}

function gameResult(seed) {
  const nBits = 200; // number of most significant bits to use

  const salt =
    "000000000000000000025807140ca8759beab23b6ff8fc5c68f94d640fc85a13";
  // 1. HMAC_SHA256(key=salt, message=seed)
  const hmac = crypto.createHmac("sha256", salt);
  hmac.update(seed);
  seed = hmac.digest("hex");

  // 2. r = 52 most significant bits
  seed = seed.slice(0, nBits / 4);
  const r = parseInt(seed, 16);

  // 3. X = r / 2^52
  let X = r / Math.pow(2, nBits); // uniformly distributed in [0; 1)

  // 4. X = 99 / (1-X)
  X = 99 / (1 - X);

  // 5. return max(trunc(X), 100)
  const result = Math.floor(X);

  const bust = Math.max(1, result / 100);

  return {
    bustpoint: bust,
    seedeed: seed,
  };
}

function gameVerifier(seed) {
  const nBits = 200; // number of most significant bits to use

  const r = parseInt(seed, 16);

  // 3. X = r / 2^52
  let X = r / Math.pow(2, nBits); // uniformly distributed in [0; 1)

  // 4. X = 99 / (1-X)
  X = 99 / (1 - X);

  // 5. return max(trunc(X), 100)
  const result = Math.floor(X);
  return Math.max(1, result / 100);
}

async function deleteGamesWithPlayedZero() {
  try {
    await connectToDatabase();

    const deletionResult = await Game.deleteMany({
      bustpoint: { $gt: 20 },
    });

    console.log(`${deletionResult.deletedCount} games deleted.`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // await client.close();
  }
}

// Call the function to delete games where played is 0
// deleteGamesWithPlayedZero();
async function generateAndSaveGameResults() {
  const maxGameId = await Game.findOne({}, { gameId: 1 }).sort({ gameId: -1 });

  let gameIdCounter = maxGameId ? maxGameId.gameId + 1 : 1; // Start the counter from the maximum gameId + 1 or 1 if no gameId exists

  console.log(gameIdCounter);
  try {
    await connectToDatabase();
    const results = [];

    for (let i = 0; i < 10; i++) {
      const inputString = crypto.randomBytes(32).toString("hex");
      const saltedHash = gameResult(inputString);

      if (saltedHash.bustpoint <= 20) {
        results.push({
          bustpoint: saltedHash.bustpoint,
          seedeed: inputString,
          played: 0,
          gameId: gameIdCounter++,
        });
      }
    }
    // console.log(results);
    if (results.length > 0) {
      await Game.create(results); // Insert the results into the "Game" collection
      // console.log("Game results saved to MongoDB");
    } else {
      console.log("No eligible results to save.");
    }

    // console.log("Connection to MongoDB closed");
  } catch (error) {
    console.error("Error:", error);
  }
}

async function updateSetPlayed() {
  try {
    const db = await connectToDatabase();
    const collection = db.collection("gameResults");

    // Update 'played' field to 0 for all game results
    await collection.updateMany({}, { $set: { played: 0 } });

    // res
    //   .status(200)
    //   .json({ message: "Updated played field for all game results" });
  } catch (error) {
    console.error("Error:", error);
    // res.status(500).json({ error: "Internal Server Error" });
  }
}
// updateSetPlayed();
async function exportToExcel() {
  try {
    const db = await connectToDatabase();
    const collection = db.collection("mygameResults"); // Replace with your collection name

    const data = await collection.find().toArray();

    const model = mongoXlsx.buildDynamicModel(data);
    const excelData = mongoXlsx.mongoData2Xlsx(data, model);

    const filePath = "bustpoints.xlsx";
    fs.writeFileSync(filePath, excelData);
  } catch (error) {
    console.error("Error:", error);
  }
}

async function updateGameIds() {
  try {
    await connectToDatabase();

    let counter = 1; // Initialize the counter
    const games = await Game.find({}).sort({ createdAt: 1 }); // Retrieve all games, sorted by createdAt field or any other suitable order

    for (const game of games) {
      game.gameId = counter++;
      await game.save(); // Save the updated gameId
    }

    console.log("Game IDs updated successfully.");
  } catch (error) {
    console.error("Error:", error);
  }
}

// updateGameIds();

// exportToExcel();

// setInterval(async () => {
//   generateAndSaveGameResults();
// }, 2000);
// setInterval(async () => {
//   generateAndSaveGameResults();
// }, 2000);

module.exports = bustResolvers;
