const crypto = require('crypto');
/**
 * Hashed a string
 * @param string
 * @returns {string}
 */
const sha512 = string =>
  crypto
    .createHash('sha512')
    .update(string)
    .digest('hex');
/**
 * Generate a 256 characters string
 * @returns {string}
 */
const generateServerSeed = () => crypto.randomBytes(256).toString('hex');
/**
 * Custom function for concatenating server-seed, client-seed and nonce.
 * @param serverSeed
 * @param clientSeed
 * @param nonce
 * @returns {*}
 */
const combine = (serverSeed, clientSeed, nonce) =>
  serverSeed + clientSeed + nonce;
/**
 * Converts a hex hash into a number between [0, 99]
 * @param hashedValue
 * @returns {*}
 */
const getResult = hashedValue => {
  // the offset of the interval
  let index = 0;
  // result variable
  let result;

  do {
    // get the decimal value from an interval of 5 hex letters
    result = parseInt(hashedValue.substring(index * 5, index * 5 + 5), 16);
    // increment the offset in case we will need to repeat the operation above
    index += 1;
    // if all the numbers were over 999999 and we reached the end of the string, we set that to a default value of 9999 (99 as a result)
    if (index * 5 + 5 > 129) {
      result = 9999;
      break;
    }
  } while (result >= 1e6);
  // the result is between 0-999999 and we need to convert if into a 4 digit number
  // we a apply a modulus of 1000 and the 4 digit number is further split into a 2 digit number with decimals
  return [result % 1e4] * 1e-2;
};

const randomString = length => {
    const availableChars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomString = '';
    for (let i = 0; i < length; i++) {
      randomString +=
        availableChars[Math.floor(Math.random() * availableChars.length)];
    }
    return randomString;
  };


const getCrashPoint = serverHash=>{
    const INSTANT_CRASH_PERCENTAGE = 6.66;
    
    var hash = crypto.createHmac('sha256', serverHash).digest('hex');
    var h = parseInt(hash.slice(0, 52 / 4), 16);
    var e = Math.pow(2, 52);
    const result = (100 * e - h) / (e - h);
    const houseEdgeModifier = 1 - INSTANT_CRASH_PERCENTAGE / 100;
    const endResult = Math.max(100, result * houseEdgeModifier);
    return Math.floor(endResult);
}


module.exports = { generateServerSeed, sha512, combine, getResult,randomString, getCrashPoint };
