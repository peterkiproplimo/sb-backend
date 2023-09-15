let nextGameroundID = ""; // Initialize with an empty string

function getnextRound() {
  return nextGameroundID;
}

function setNextRound(GameroundID) {
  nextGameroundID = GameroundID;
}

module.exports = { getnextRound, setNextRound };
