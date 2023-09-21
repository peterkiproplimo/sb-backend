let nextGameroundID = ""; // Initialize with an empty string
let emitNextRound = false;
let emitOngoingRound = false;
let emitEndRound = false;
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
function setemitEndRound(endround) {
  emitEndRound = endround;
}

function getemitNextRound() {
  return emitNextRound;
}

function getemitOngoingRound() {
  return emitOngoingRound;
}

function getemitEndRound() {
  return emitEndRound;
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
};
