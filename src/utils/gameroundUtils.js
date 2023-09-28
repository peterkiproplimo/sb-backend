let nextGameroundID = ""; // Initialize with an empty string
let emitNextRound = false;
let emitOngoingRound = false;
let emitEndRound = false;
let bustpoint = 0;

function getnextRound() {
  return nextGameroundID;
}

function setNextRound(GameroundID) {
  nextGameroundID = GameroundID;
}

function setemitNextRound(next) {
  emitNextRound = next;
}

function setemitOngoingRound(ongoing) {
  emitOngoingRound = ongoing;
}
function setemitEndRound(endround, value) {
  emitEndRound = endround;
  bustpoint = value;
}

function getemitNextRound() {
  return emitNextRound;
}

function getendValue() {
  return bustpoint;
}

function getemitOngoingRound() {
  return emitOngoingRound;
}

function getemitEndRound() {
  return emitEndRound;
}

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

module.exports = {
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
};
