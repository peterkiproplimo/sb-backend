// importScripts
const connectToDatabase = require("../../config/database"); // Update the path if needed
const Player = require("../models/Player");
const Playerbet = require("../models/PlayerBet");
const { ObjectId } = require("mongodb");

const {
  generateFakePlayers,
  generateFakePlayersAndBets,
} = require("../utils/fakePlayerUtils");

async function checkBetsForWinsAndLosses(roundId) {
  try {
    const db = await connectToDatabase();

    // Fetch all player bets from the "Playerbets" collection
    // const bets = await db.collection("playerbets").find().toArray();
    const bets = await Playerbet.find({ round: roundId });

    // Use populate to include player details for each bet
    const betsWithDetails = await Playerbet.populate(bets, {
      path: "userId", // Match this with the field name in Playerbet model that references User model
      model: Player, // Reference the User model
    });

    const fakeplayers = generateFakePlayersAndBets(10);

    const finalResponse = [...betsWithDetails, ...fakeplayers];

    return finalResponse;
    // return bets;
  } catch (error) {
    console.error("Error checking bets:", error);
    throw error; // Rethrow the error to handle it at a higher level if needed
  }
}

async function getEndResults(roundId, endValue) {
  try {
    const db = await connectToDatabase();

    // Fetch all player bets from the "Playerbets" collection
    const bets = await Playerbet.find({ round: roundId });

    // Iterate through the bets and update the "win" field based on the condition
    for (const bet of bets) {
      if (bet.point <= endValue) {
        // If the condition is met, set win to true
        await Playerbet.updateOne(
          { _id: bet._id },
          { $set: { busted: false, win: true } }
        );
      } else {
        // If the condition is not met, set win to false
        await Playerbet.updateOne(
          { _id: bet._id },
          { $set: { busted: true, win: false } }
        );
      }
    }
    const fakeplayers = generateFakePlayersAndBets(20);
    // Fetch and return the updated bets from the database
    const updatedBets = await Playerbet.find({ round: roundId });
    const betsWithDetails = await Playerbet.populate(updatedBets, {
      path: "userId", // Match this with the field name in Playerbet model that references User model
      model: Player, // Reference the User model
    });

    const finalResponse = [...betsWithDetails, ...fakeplayers];

    return finalResponse;
  } catch (error) {
    console.error("Error checking bets:", error);
    throw error; // Rethrow the error to handle it at a higher level if needed
  }
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
  } catch (error) {
    console.error("Error updating played field:", error);
  }
}

// Get the next round from the database
async function getRoundFromDatabase() {
  const { db } = await connectToDatabase();
  const collection = db.collection("rounds");

  const filter = { _id: ObjectId("650c09f928c9ea52fe0460eb") };

  try {
    // Find the document in the collection
    const document = await collection.findOne(filter);

    if (document) {
      // console.log(document);
      // Document found, return it
      return document.randomID;
    } else {
      // console.log(`Document with ID "${id}" not found.`);
      return null; // Indicates document not found
    }
  } catch (error) {
    // console.error(`Error retrieving document with ID "${id}":`, error);
    throw error; // Rethrow the error to handle it at a higher level if needed
  }
}

//  Get the current round from the database
async function getCurrentRoundFromDatabase() {
  const { db } = await connectToDatabase();
  const collection = db.collection("rounds");

  const filter = { _id: ObjectId("650c14608d91665b395e22f9") };

  try {
    // Find the document in the collection
    const document = await collection.findOne(filter);

    if (document) {
      return document.currentRound;
    } else {
      return null; // Indicates document not found
    }
  } catch (error) {
    throw error; // Rethrow the error to handle it at a higher level if needed
  }
}

//  Save the next round
async function saveRoundIndB(randomID) {
  const { client, db } = await connectToDatabase();
  const collection = db.collection("rounds");

  const filter = { _id: ObjectId("650c09f928c9ea52fe0460eb") };

  // Define the update operation
  const updateOperation = {
    $set: { randomID },
  };

  // Update the document in the collection
  await collection.updateOne(filter, updateOperation);
}

// Save the current round
async function saveCurrentRound(currentRound) {
  const { client, db } = await connectToDatabase();
  const collection = db.collection("rounds");

  const filter = { _id: ObjectId("650c14608d91665b395e22f9") };

  // Define the update operation
  const updateOperation = {
    $set: { currentRound },
  };

  // Update the document in the collection
  await collection.updateOne(filter, updateOperation);
}

//  Update the round id of the game
async function updateRound(multiplier, gameround) {
  try {
    const db = await connectToDatabase();
    const collection = db.collection("gameResults");

    // Update the "played" field to 1 for the current multiplier
    await collection.updateOne(
      { _id: multiplier._id },
      { $set: { round: gameround } }
    );
  } catch (error) {
    console.error("Error updating played field:", error);
  }
}
//  Update winners as the multiplier continues
async function setWinners(bustboint) {
  try {
    const db = await connectToDatabase();

    // Update all documents where bustpoint is <= bustboint
    const result = await db.collection("playerbets").updateMany(
      { point: { $lte: bustboint } }, // Filter criteria
      { $set: { win: true } } // Update operation
    );

    // Check if the update was successful
    if (result.modifiedCount > 0) {
      // Fetch the updated documents if needed
      const winners = await db
        .collection("playerbets")
        .find({ win: true })
        .toArray();
      console.log(winners);
      return winners;
    } else {
      // console.log("No winners found.");
      return [];
    }
  } catch (error) {
    console.error("Error checking bets:", error);
    throw error; // Rethrow the error to handle it at a higher level if needed
  }
}

module.exports = {
  checkBetsForWinsAndLosses,
  updatePlayedField,
  getRoundFromDatabase,
  getCurrentRoundFromDatabase,
  saveRoundIndB,
  saveCurrentRound,
  updateRound,
  setWinners,
  getEndResults,
};
