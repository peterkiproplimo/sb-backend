const connectToDatabase = require('../../config/database');
// const User = require('../models/Player');
const User = require("../models/users");
const Admin = require("../models/admins");
const crypto = require("crypto")
const CryptoJS = require('crypto-js');

const axios = require('axios');


const bustResolvers = {

   gameResult: () => {
  
    const seed = "ojoajofjaofjo"
    const salt = "909041"
    const nBits = 52 // number of most significant bits to use
  
    // 1. HMAC_SHA256(key=salt, message=seed)
    const hmac = crypto.createHmac("sha256", salt)
    hmac.update(seed)
    seed = hmac.digest("hex")
  
    // 2. r = 52 most significant bits
    seed = seed.slice(0, nBits/4)
    const r = parseInt(seed, 16)
  
    // 3. X = r / 2^52
    let X = r / Math.pow(2, nBits) // uniformly distributed in [0; 1)
  
    // 4. X = 99 / (1-X)
    X = 99 / (1 - X)
  
    // 5. return max(trunc(X), 100)
    const result = Math.floor(X)
    return Math.max(1, result / 100)
  },

  generateSHA512: (_, { inputString = "DefaultString" }) => {
    const hash = crypto.createHash('sha256').update(inputString).digest('hex');
    return hash;
  },

  veryfyGame: async (_, {inputString="0eb5b78124c2fe6880106a5629313a7c22b13c01ab1e671ed7"} ) => {
    try {
      
      const hash = inputString; // You can adjust the length as needed

      // const result =// gameVerifiedResult(hash);

      let bust = gameVerifier(hash);
      return {
        bust,
        hash
      };
    } catch (error) {
      throw new Error('Error generating salted SHA-256 hash.');
    }
  },

  generateSaltedSHA256: async () => {
    try {
      const blockHeight = await getCurrentBlockHeight();
      // const blockHex = await getBlockHex(blockHeight);
      const blockHex = "000000000000000000025807140ca8759beab23b6ff8fc5c68f94d640fc85a13";

      const salt = blockHex;

      const inputString = crypto.randomBytes(32).toString('hex'); // You can adjust the length as needed

      const saltedHash = generateSaltedSHA256Hash(inputString, salt);
      //return saltedHash;

      const result = gameResult(saltedHash);

      // return result;
      return {
         result,
        hash: saltedHash,
        blockHeight: blockHex
      };
    } catch (error) {
      throw new Error('Error generating salted SHA-256 hash.');
    }
  },

  generateServerSeed: () => crypto.randomBytes(256).toString('hex'),

  generateClientSeed: () => crypto.randomBytes(64).toString('hex'),


}

async function getCurrentBlockHeight() {
  const response = await axios.get('https://blockchain.info/q/getblockcount');
  return parseInt(response.data);
}


async function getBlockHex(blockHeight) {
  const response = await axios.get(`https://blockchain.info/block-height/${blockHeight}?format=json`);
  return response.data.blocks[0].hash;
}

function generateSaltedSHA256Hash(inputString, salt) {
  const saltedInput = inputString + salt;
  const hash = crypto.createHash('sha256').update(saltedInput).digest('hex');
  return hash;
}


function gameResult(seed) {
  const nBits = 200 // number of most significant bits to use

  const salt = "000000000000000000025807140ca8759beab23b6ff8fc5c68f94d640fc85a13";
  // 1. HMAC_SHA256(key=salt, message=seed)
  const hmac = crypto.createHmac("sha256", salt)
  hmac.update(seed)
  seed = hmac.digest("hex")

  // 2. r = 52 most significant bits
  seed = seed.slice(0, nBits/4)
  const r = parseInt(seed, 16)

  // 3. X = r / 2^52
  let X = r / Math.pow(2, nBits) // uniformly distributed in [0; 1)

  // 4. X = 99 / (1-X)
  X = 99 / (1 - X)

  // 5. return max(trunc(X), 100)
  const result = Math.floor(X)
   
  const bust = Math.max(1, result / 100)

  return {
    bustpoint:bust,
    seedeed: seed
  }
}


function gameVerifier(seed) {

  const nBits = 200; // number of most significant bits to use

  const r = parseInt(seed, 16);

  // 3. X = r / 2^52
  let X = r / Math.pow(2, nBits); // uniformly distributed in [0; 1)

  // 4. X = 99 / (1-X)
  X = 99 / (1 - X);

  // 5. return max(trunc(X), 100)
  const result = Math.floor(X);
  return Math.max(1, result / 100);
};

module.exports = bustResolvers;