const { merge } = require('lodash');

const authResolvers = require('../src/controllers/authController');
const userResolvers = require('../src/controllers/userController');
const bustResolvers = require('../src/controllers/bustController');

const resolvers = merge(authResolvers,userResolvers,bustResolvers);

module.exports = resolvers;