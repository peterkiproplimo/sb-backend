const { merge } = require('lodash');

const authResolvers = require('../src/controllers/authController');
const userResolvers = require('../src/controllers/userController');

const resolvers = merge(authResolvers,userResolvers);

module.exports = resolvers;