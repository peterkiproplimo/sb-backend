const connectToDatabase = require("../../config/database");
let livePlayers = []; // SHOULD BE GLOBAL
let winnerssetter = [];
let nextroundplayerssetter = [];
let ongoingroundplayersetter = [];

/*  I should get the results of different functions in different contexts of the application. 
but they should be running concurrently

getWinnersofRound - Data to be emmited at the end of a round.
getplayersbettingnextRound - Data to be emmited shortly after the bust point
getwinnersOrlosersinOngoingRound - Data to be emitted when the round is ongoing

*/
/* Set the bust point livedata
   Be checking for winners as the bustboint continues to grow and then append to the liveplayers array
*/
async function getWinnersofRound(bustboint, roundId) {
  try {
    const db = await connectToDatabase();

    // Fetch all player bets from the "Playerbets" collection
    const bets = await db.collection("playerbets").find().toArray();
    const winners = bets.filter((bet) => bet.bustpoint <= bustboint);

    livePlayers.push(...winners);
    return winners;
    // return bets;
  } catch (error) {
    console.error("Error checking bets:", error);
    throw error; // Rethrow the error to handle it at a higher level if needed
  }
}
/*/  Set the next round betting players livedata
   Be checking for the players who have bet the next round and update next round livedata array
*/
async function getplayersbettingnextRound(roundId) {
  try {
    const db = await connectToDatabase();

    // Fetch all player bets from the "Playerbets" collection

    const bets = await db
      .collection("playerbets")
      .find({ round: roundId })
      .toArray();

    // Append the player bets for the next round to the nextroundplayerssetter array
    livePlayers.push(...bets);

    return bets;
    // return bets;
  } catch (error) {
    console.error("Error checking bets:", error);
    throw error;
  }
}
/*/  Set the ongoing round live data
   Be checking for winners in the current round counter and update the ongoing round counter
*/
async function getwinnersOrlosersinOngoingRound(bustboint, roundId) {
  try {
    const db = await connectToDatabase();

    // Fetch all player bets from the "Playerbets" collection
    const bets = await db.collection("playerbets").find().toArray();

    const winners = bets.filter((bet) => bet.bustpoint <= bustpoint);
    const losers = bets.filter((bet) => bet.bustpoint > bustpoint);

    const result = [];

    // Append winners with bustpoint and losers with null to the result array
    winners.forEach((winner) => {
      result.push({ ...winner, bustpoint: winner.bustpoint });
    });

    losers.forEach((loser) => {
      result.push({ ...loser, bustpoint: null });
    });

    livePlayers.push(...result);

    return result;
  } catch (error) {
    console.error("Error checking bets:", error);
    throw error;
  }
}

function getLivedata() {
  return livePlayers;
}

module.exports = {
  getWinnersofRound,
  getplayersbettingnextRound,
  getwinnersOrlosersinOngoingRound,
  getLivedata,
};
