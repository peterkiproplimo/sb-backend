const { merge } = require("lodash");

const authResolvers = require("../src/controllers/authController");
const userResolvers = require("../src/controllers/userController");
const playerResolvers = require("../src/controllers/playerController");
const bustResolvers = require("../src/controllers/bustController");
const accountResolvers = require("../src/controllers/accountController");
const adminResolvers = require("../src/controllers/adminController");
const betsResolvers = require("../src/controllers/betsController");
const mpesaResolvers = require("../src/controllers/mpesaController");
const utilsResolvers = require("../src/controllers/utilsController");

// Account
// Admin
// bets
// mpesa
// util

const resolvers = merge(
  authResolvers,
  userResolvers,
  bustResolvers,
  accountResolvers,
  adminResolvers,
  betsResolvers,
  mpesaResolvers,
  utilsResolvers,
  playerResolvers
);

module.exports = resolvers;
