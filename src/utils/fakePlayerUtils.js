const { faker } = require("@faker-js/faker");

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

// Function to generate fake players and bets
function generateFakePlayersAndBets(numPlayers) {
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

    const fakeBet = {
      win: false,
      busted: true,
      _id: faker.string.uuid(24),
      betAmount: parseFloat(faker.finance.amount(1, 1000, 2)),
      point: parseFloat(faker.finance.amount(1, 20, 2)),
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
      possibleWin: parseFloat(faker.finance.amount(1, 10000, 2)),
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
};
