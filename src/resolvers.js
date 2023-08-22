const { merge } = require('lodash');

const authResolvers = require('../src/controllers/authController');

const resolvers = merge(authResolvers);

module.exports = resolvers;