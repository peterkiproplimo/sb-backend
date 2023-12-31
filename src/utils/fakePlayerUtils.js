const { faker } = require("@faker-js/faker");
const Player = require("../models/Player");
const fs = require("fs");
const kenyannames = require("./keyannames.json");

function saveFakePlayers() {
  // const usernamesData = JSON.parse(kenyannames);

  kenyannames.forEach((username) => {
    const fakePlayerData = {
      type: "fake",
      username,
      password: faker.internet.password(),
      phone: generatePhoneNumber(),
      otp: "QWVK4",
      // Add other fields from the generateFakePlayers function as needed
    };

    const player = new Player(fakePlayerData);

    player.save((err, savedPlayer) => {
      if (err) {
        console.error(`Error saving player ${username}: ${err}`);
      } else {
        console.log(`Player ${savedPlayer.username} saved to the database.`);
      }
    });
  });
}

function deletePlayersByUsernames(usernames) {
  Player.deleteMany({ username: { $in: usernames } }, (err) => {
    if (err) {
      console.error(`Error deleting players: ${err}`);
    } else {
      console.log("Players deleted successfully.");
    }
  });
}
let fakePlayers = [];
function generatePhoneNumber() {
  // Generates a random 10-digit phone number
  const phoneNumber = faker.number.int({ min: 1000000000, max: 9999999999 });
  return `+254${phoneNumber}`;
}

// Function to generate fake players
function generateFakePlayers(numPlayers) {
  const fakePlayers = [];

  for (let i = 0; i < numPlayers; i++) {
    const fakePlayer = {
      type: "regular", // Adjust the player type as needed
      username: faker.internet.userName(6),
      active: true,
      phone: generatePhoneNumber(),
      online: true,
      password: faker.internet.password(),
      dataToken: faker.random.alphaNumeric(12),
      label: faker.number.int({ min: 1, max: 10 }).toString(),
      firstDeposit: faker.finance.amount(0, 1000, 2), // Adjust deposit range as needed
    };

    fakePlayers.push(fakePlayer);
  }

  return fakePlayers;
}

function generateFakePlayersAndBets(kenyannames) {
  const fakePlayersAndBets = [];

  const maxUsernameLength = 10;

  for (const username of kenyannames) {
    // Trim the username to the desired length
    const trimmedUsername = username.substr(0, maxUsernameLength);

    const fakePlayer = {
      type: "regular",
      username: trimmedUsername,
      active: true,
      phone: generatePhoneNumber(),
      online: false,
      password: faker.internet.password(),
      dataToken: faker.string.uuid(24),
      label: faker.number.int({ min: 1, max: 10 }).toString(),
      firstDeposit: parseFloat(faker.finance.amount(0, 1000, 2)),
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: faker.date.recent(),
    };

    const fakebetAmount = parseFloat(faker.finance.amount(1, 1000, 2));
    const fakePoint = parseFloat(faker.finance.amount(1, 20, 2));
    const fakePossibleWin = parseFloat((fakebetAmount * fakePoint).toFixed(2));

    const fakeBet = {
      win: false,
      busted: true,
      _id: faker.string.uuid(24),
      betAmount: fakebetAmount,
      point: fakePoint,
      userId: {
        playerbets: [],
        _id: faker.string.uuid(24),
        type: "regular",
        username: fakePlayer.username,
        active: true,
        phone: fakePlayer.phone,
        online: fakePlayer.online,
        password: fakePlayer.password,
        dataToken: fakePlayer.dataToken,
        label: fakePlayer.label,
        firstDeposit: fakePlayer.firstDeposit,
        createdAt: fakePlayer.createdAt,
        updatedAt: fakePlayer.updatedAt,
        __v: 0,
      },
      round: faker.string.uuid(24),
      possibleWin: fakePossibleWin,
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: faker.date.recent(),
      __v: 0,
    };

    fakePlayersAndBets.push({ ...fakeBet });
  }

  return fakePlayersAndBets;
}

// Function to generate fake players and bets
function generateFakePlayersAndBetsBackub(numPlayers) {
  const fakePlayersAndBets = [];

  const maxUsernameLength = 10;

  // Generate a username and trim it to the desired length

  for (let i = 0; i < numPlayers; i++) {
    const username = faker.internet.userName().substr(0, maxUsernameLength);

    const fakePlayer = {
      type: "regular",
      username,
      active: true,
      phone: generatePhoneNumber(),
      online: false,
      password: faker.internet.password(),
      dataToken: faker.string.uuid(24),
      label: faker.number.int({ min: 1, max: 10 }).toString(),
      firstDeposit: parseFloat(faker.finance.amount(0, 1000, 2)),
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: faker.date.recent(),
    };

    const fakebetAmount = parseFloat(faker.finance.amount(1, 1000, 2));
    const fakePoint = parseFloat(faker.finance.amount(1, 20, 2));
    const fakePossibleWin = parseFloat(
      (fakebetAmount * fakePoint).toFixed(2) // Calculate and round to 2 decimal places
    );
    const fakeBet = {
      win: false,
      busted: true,
      _id: faker.string.uuid(24),
      betAmount: fakebetAmount,
      point: fakePoint,
      userId: {
        playerbets: [],
        _id: faker.string.uuid(24),
        type: "regular",
        username: fakePlayer.username,
        active: true,
        phone: fakePlayer.phone,
        online: fakePlayer.online,
        password: fakePlayer.password,
        dataToken: fakePlayer.dataToken,
        label: fakePlayer.label,
        firstDeposit: fakePlayer.firstDeposit,
        createdAt: fakePlayer.createdAt,
        updatedAt: fakePlayer.updatedAt,
        __v: 0,
      },
      round: faker.string.uuid(24),
      possibleWin: fakePossibleWin,
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: faker.date.recent(),
      __v: 0,
    };

    fakePlayersAndBets.push({ ...fakeBet });
  }

  return fakePlayersAndBets;
}

function setFakePlayers(fakeplayers) {
  fakePlayers = fakeplayers;
}

function getFakePlayers() {
  return fakePlayers;
}
module.exports = {
  generateFakePlayers,
  generateFakePlayersAndBets,
  getFakePlayers,
  setFakePlayers,
  saveFakePlayers,
  deletePlayersByUsernames,
};
