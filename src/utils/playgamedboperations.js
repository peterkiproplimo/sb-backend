// importScripts
const connectToDatabase = require("../../config/database"); // Update the path if needed
const Player = require("../models/Player");
const Playerbet = require("../models/PlayerBet");
const { ObjectId } = require("mongodb");
const Account = require("../models/Account");
const History = require("../models/history");
const { getFakePlayers, setFakePlayers } = require("../utils/fakePlayerUtils");

async function checkBetsForWinsAndLosses(multipliers, gamestatus, multvalue) {
  try {
    // Fetch all player bets from the "Playerbets" collection
    // const bets = await db.collection("playerbets").find().toArray();
    const bets = await Playerbet.find({
      roundid: multipliers._id,
      played: 1,
      completed: 0,
    });

    // Use populate to include player details for each bet
    const betsWithDetails = await Playerbet.populate(bets, {
      path: "userId", // Match this with the field name in Playerbet model that references User model
      model: Player, // Reference the User model
    });

    const fakeplayers = getFakePlayers().map((fakeplayer) => {
      if (fakeplayer.point <= multvalue) {
        fakeplayer.win = true;
        fakeplayer.busted = false;
      }
      return fakeplayer;
    });

    const sortedWinners = fakeplayers.sort((a, b) =>
      a.win === b.win ? 0 : a.win ? -1 : 1
    );

    // Set the new updated list of fake players
    // setFakePlayers(sortedWinners);

    const betsFinalResponse = betsWithDetails.map((bet) => ({
      ...bet.toObject(), // Convert the Mongoose document to a plain JavaScript object
      gamestatus: gamestatus, // Add the gamestatus property
    }));

    // Iterate through each object in fakeplayers and add the gamestatus property
    const fakeplayersFinalResponse = sortedWinners.map((fakeplayer) => ({
      ...fakeplayer,
      gamestatus: gamestatus,
    }));

    // Combine both arrays into a single finalResponse array
    const finalResponse = [...betsFinalResponse, ...fakeplayersFinalResponse];

    return finalResponse;
    // return bets;
  } catch (error) {
    console.error("Error checking bets:", error);
    throw error; // Rethrow the error to handle it at a higher level if needed
  }
}

async function getPlayersWaitingForNextRound(gamestatus, multvalue) {
  try {
    // Fetch all player bets from the "Playerbets" collection

    const bets = await Playerbet.find({ played: 0, completed: 0 });

    // Use populate to include player details for each bet
    const betsWithDetails = await Playerbet.populate(bets, {
      path: "userId", // Match this with the field name in Playerbet model that references User model
      model: Player, // Reference the User model
    });

    const fakeplayers = getFakePlayers().map((fakeplayer) => {
      if (fakeplayer.point <= multvalue) {
        fakeplayer.win = true;
        fakeplayer.busted = false;
      }
      return fakeplayer;
    });

    const sortedWinners = fakeplayers.sort((a, b) =>
      a.win === b.win ? 0 : a.win ? -1 : 1
    );

    // Set the new updated list of fake players
    // setFakePlayers(sortedWinners);

    const betsFinalResponse = betsWithDetails.map((bet) => ({
      ...bet.toObject(), // Convert the Mongoose document to a plain JavaScript object
      gamestatus: gamestatus, // Add the gamestatus property
    }));

    // Iterate through each object in fakeplayers and add the gamestatus property
    const fakeplayersFinalResponse = sortedWinners.map((fakeplayer) => ({
      ...fakeplayer,
      gamestatus: gamestatus,
    }));

    // Combine both arrays into a single finalResponse array
    const finalResponse = [...betsFinalResponse, ...fakeplayersFinalResponse];

    return finalResponse;
    // return bets;
  } catch (error) {
    console.error("Error checking bets:", error);
    throw error; // Rethrow the error to handle it at a higher level if needed
  }
}

async function getEndResults(nextMultiplier, gamestatus) {
  try {
    // Fetch all player bets from the "Playerbets" collection
    const bets = await Playerbet.find({
      roundid: nextMultiplier._id,
      completed: 0,
    });

    // console.log(`Total to update, ${bets.length}`);

    let winAmount = 0;

    const houseAccount = await Account.findById("6555e4028e89bb00288767eb");
    // Iterate through the bets and update the "win" field based on the condition
    //  Define array here i.e const Payer
    // Find a way to update account balance automatically
    for (const bet of bets) {
      await Playerbet.updateOne({ _id: bet._id }, { $set: { completed: 1 } });

      if (bet.point <= nextMultiplier.bustpoint) {
        winAmount += bet.betAmount;
        // If the condition is met, set win to true
        await Playerbet.updateOne(
          { _id: bet._id, roundid: nextMultiplier._id },
          { $set: { busted: false, win: true } }
        );

        const account = await Account.findOne({
          user: bet.userId,
        });

        account.balance =
          parseFloat(account?.balance) + parseFloat(bet.possibleWin);

        await account.save();

        const updatedAc = await Account.findOne({
          user: bet.userId,
        });

        // Get User Id, get the Balance the put in array

        houseAccount.balance =
          parseFloat(houseAccount?.balance) - parseFloat(bet.possibleWin);
        await houseAccount.save();
      }
    }

    const fakeplayers = getFakePlayers().map((fakeplayer) => {
      if (fakeplayer.point <= nextMultiplier.bustboint) {
        fakeplayer.win = true;
        fakeplayer.busted = false;
      }
      return fakeplayer;
    });

    setFakePlayers(fakeplayers);
    // Fetch and return the updated bets from the database

    const updatedBets = await Playerbet.find({
      roundid: nextMultiplier._id,
    });

    const betsWithDetails = await Playerbet.populate(updatedBets, {
      path: "userId", // Match this with the field name in Playerbet model that references User model
      model: Player, // Reference the User model
    });

    const betsFinalResponse = betsWithDetails.map((bet) => ({
      ...bet.toObject(), // Convert the Mongoose document to a plain JavaScript object
      gamestatus: gamestatus, // Add the gamestatus property
    }));

    // Iterate through each object in fakeplayers and add the gamestatus property
    const fakeplayersFinalResponse = fakeplayers.map((fakeplayer) => ({
      ...fakeplayer,
      gamestatus: gamestatus,
    }));

    // Combine both arrays into a single finalResponse array
    const finalResponse = [...betsFinalResponse, ...fakeplayersFinalResponse];

    return finalResponse;

    // const finalResponse = [...betsWithDetails, ...fakeplayers];

    // return betsWithDetails;
  } catch (error) {
    console.error("Error checking bets:", error);
    throw error; // Rethrow the error to handle it at a higher level if needed
  }
}

async function setGameHasBeenPlayed(multiplier) {
  try {
    const db = await connectToDatabase();
    const collection = db.collection("games");

    // Update the "played" field to 1 for the current multiplier
    await collection.updateOne(
      { _id: multiplier._id },
      { $set: { played: 1 } }
    );

    historybets = await createHistory(multiplier);
    // return historybets;
  } catch (error) {
    console.error("Error updating played field:", error);
  }
}

async function createHistory(multiplier) {
  const history = new History({
    hash: multiplier.seedeed,
    point: multiplier.bustpoint,
    round: multiplier._id,
  });
  await history.save();

  const historybets = await History.find().sort({ createdAt: -1 }).limit(10);
  // console.log(historybets);
  return historybets;
}

async function getHistory() {
  const historybets = await History.find().sort({ createdAt: -1 }).limit(10);
  // console.log(historybets);
  // console.log(historybets);
  return historybets;
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
async function saveNextRoundID(randomID) {
  const { db } = await connectToDatabase();
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
async function setSavedNextRoundAsCurrentRound(currentRound) {
  const { db } = await connectToDatabase();
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
async function updateMultiplierSetRoundId(multiplier, gameround) {
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
async function setWinners(bustboint, multipliers) {
  try {
    // Update all documents where bustpoint is <= bustboint
    const result = await Playerbet.updateMany(
      { point: { $lte: bustboint }, roundid: multipliers._id }, // Filter criteria
      { $set: { win: true } } // Update operation
    );

    const fakeplayers = getFakePlayers().map((fakeplayer) => {
      if (fakeplayer.point <= bustboint) {
        fakeplayer.win = true;
        fakeplayer.busted = false;
      }
      return fakeplayer;
    });

    const sortedWinners = fakeplayers.sort((a, b) =>
      a.win === b.win ? 0 : a.win ? -1 : 1
    );

    // Set the new updated list of fake players
    setFakePlayers(sortedWinners);

    // console.log(fakeplayers);
    // Check if the update was successful
    if (result.modifiedCount > 0) {
      // Fetch the updated documents if needed

      const winners = await Playerbet.find().toArray();

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

async function setAllNextRoundPlayersWithRoundId(nextMultiplier) {
  try {
    // const db = await connectToDatabase();

    // Update all documents where bustpoint is <= bustboint
    await Playerbet.updateMany(
      { played: 0 }, // Filter criteria
      { $set: { roundid: nextMultiplier._id, played: 1 } } // Update operation
    );

    // Fetch the updated documents if needed
    return true;
  } catch (error) {
    console.error("Error checking bets:", error);
    throw error; // Rethrow the error to handle it at a higher level if needed
  }
}

module.exports = {
  checkBetsForWinsAndLosses,
  setGameHasBeenPlayed,
  getRoundFromDatabase,
  getCurrentRoundFromDatabase,
  saveNextRoundID,
  setSavedNextRoundAsCurrentRound,
  updateMultiplierSetRoundId,
  setWinners,
  getEndResults,
  createHistory,
  setAllNextRoundPlayersWithRoundId,
  getPlayersWaitingForNextRound,
  getHistory,
};
