// Helpers for tasks

// Dependencies
const crypto = require('crypto');
const config = require('./config');

// Helpers Container
const helpers = {};

// Create a SHA256 hash
helpers.hash = function(str) {
  if (typeof(str) == 'string' && str.length >= 6) {
    let hash = crypto.createHmac(
      'sha256',
      config.hashingSecret
    ).update(str).digest('hex');
    return hash;
  } else {
    return false;
  }
};

// Parse JSON string to object for all cases, without throwing
helpers.parseJsonToObject = function(str) {
  try {
    let obj = JSON.parse(str);
    return obj;
  } catch (e) {
    return {};
  }
};

// Create string of random alphanumeric characters, of given length
helpers.createRandomString = function(strLength) {
  strLength = typeof(strLength) == 'number'
  && strLength > 0
  ? strLength : false;

  if(strLength) {
    // Define all possible character that could go into a string
    let possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

    // Start final string
    let str = '';
    for (let i = 1; i <= strLength; i++) {
      // Get random character from possibleCharacters string
      let randcomCharacter = possibleCharacters.charAt(
          Math.floor(Math.random() * possibleCharacters.length)
      );
      // Append this character to the final string
      str += randcomCharacter;
    }

    // Return final string
    return str;
  } else {
    return false
  }
};

// Create string of random alphanumeric characters, of given length
helpers.createRandomString = function(strLength) {
  strLength = typeof(strLength) == 'number'
  && strLength > 0
  ? strLength : false;

  if(strLength) {
    // Define all possible character that could go into a string
    let possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

    // Start final string
    let str = '';
    for (let i = 1; i <= strLength; i++) {
      // Get random character from possibleCharacters string
      let randcomCharacter = possibleCharacters.charAt(
          Math.floor(Math.random() * possibleCharacters.length)
      );
      // Append this character to the final string
      str += randcomCharacter;
    }

    // Return final string
    return str;
  } else {
    return false
  }
};

// Export helpers
module.exports = helpers;
