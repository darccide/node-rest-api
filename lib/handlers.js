// Request handlers

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');
const config = require('./config');

// Define the handlers
let handlers = {};

// Users (customers)
handlers.users = function(data, callback) {
  let acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for the customers submethods
handlers._users = {};

// Users - post
// Required data: zip, lastName, email, password, address, state, zip
// Optional data: none
handlers._users.post = function(data, callback) {
  // Check all required fields are filled out
  let firstName = typeof(data.payload.firstName) == 'string'
  && data.payload.firstName.trim().length > 0
  ? data.payload.firstName.trim() : false;

  let lastName = typeof(data.payload.lastName) == 'string'
  && data.payload.lastName.trim().length > 0
  ? data.payload.lastName.trim() : false;

  let email = typeof(data.payload.email) == 'string'
  && data.payload.email.trim().length > 6
  && data.payload.email.trim().includes('@')
  ? data.payload.email.trim() : false;

  let password = typeof(data.payload.password) == 'string'
  && data.payload.password.trim().length > 6
  ? data.payload.password.trim() : false;

  let address = typeof(data.payload.address) == 'string'
  && data.payload.address.trim().length > 0
  ? data.payload.address.trim() : false;

  let state = typeof(data.payload.state) == 'string'
  && data.payload.state.trim().length == 2
  ? data.payload.state.trim() : false;

  let zip = typeof(data.payload.zip) == 'string'
  && data.payload.zip.trim().length == 5
  && data.payload.zip.trim().match(/^[0-9]+$/)
  ? data.payload.zip.trim() : false;

  if (firstName && lastName && email && password && address && state && zip) {
    // Make sure the customer doesn't already exist
    _data.read('users', email, function(err, data) {
      if (err) {
        // has password
        let hashedPassword = helpers.hash(password);

        // Create user object
        if (hashedPassword) {
          let userObject = {
            'firstName': firstName,
            'lastName': lastName,
            'email': email,
            'hashedPassword': hashedPassword,
            'address': address,
            'state': state,
            'zip': zip
          };

          // Store the customer
          _data.create('users', email, userObject, function(err) {
            if (!err) {
              callback(200);
            } else {
              console.log(err);
              callback(500, {'Error': 'A customer with that email already exists'});
            }
          });
        } else {
          callback(500, {'Error': 'Could not hash the customer\'s password'});
        }
      } else {
        // Customer already exists
        callback(400, {'Error': 'A customer with that email already exists'});
      }
    });
  } else {
    callback(400, {'Error': 'Missing required fields'});
  }
};

// Users - get
// Required data: email
// Optional data: none
handlers._users.get = function(data, callback) {
  // Check email is valid
  let email = typeof(data.queryStringObject.email) == 'string'
  && data.queryStringObject.email.trim().length > 6
  && data.queryStringObject.email.trim().includes('@')
  ? data.queryStringObject.email.trim() : false;

  if (email) {
    // Lookup the customer
    _data.read('users', email, function(err, data) {
      if (!err && data) {
        // Remove the hashed password from customer object before returning it
        delete data.hashedPassword;
        callback(200, data);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, {'Error': 'Missing required field'});
  }
};

// Users - put
// Required data: email
// Optional data: firstName, lastName, password, address, state, zip
// Note: At least one field of optional data must be specified
handlers._users.put = function(data, callback) {
  // Check for required field
  let email = typeof(data.payload.email) == 'string'
  && data.payload.email.trim().length > 6
  && data.payload.email.trim().includes('@')
  ? data.payload.email.trim() : false;

  // Check for optional fields
  let firstName = typeof(data.payload.firstName) == 'string'
  && data.payload.firstName.trim().length > 0
  ? data.payload.firstName.trim() : false;

  let lastName = typeof(data.payload.lastName) == 'string'
  && data.payload.lastName.trim().length > 0
  ? data.payload.lastName.trim() : false;

  let password = typeof(data.payload.password) == 'string'
  && data.payload.password.trim().length >= 6
  ? data.payload.password.trim() : false;

  let address = typeof(data.payload.address) == 'string'
  && data.payload.address.trim().length > 0
  ? data.payload.address.trim() : false;

  let state = typeof(data.payload.state) == 'string'
  && data.payload.state.trim().length == 2
  ? data.payload.state.trim() : false;

  let zip = typeof(data.payload.zip) == 'string'
  && data.payload.zip.trim().length == 5
  ? data.payload.zip.trim() : false;

  // Error if the email is invalid
  if (email) {
    // Error if nothing is sent to update
    if (firstName || lastName || password || address || state || zip) {
      // Lookup the customer
      _data.read('users', email, function(err, userData) {
        if (!err && userData) {
          // Update the fields necessary
          if (firstName) {
            userData.firstName = firstName;
          }
          if (lastName) {
            userData.lastName = lastName;
          }
          if (password) {
            userData.hashedPassword = helpers.hash(password);
          }
          if (address) {
            userData.address = address;
          }
          if (state) {
            userData.state = state;
          }
          if (zip) {
            userData.zip = zip;
          }
          // Store the new updates
          _data.update('users', email, userData, function(err) {
            if (!err) {
              callback(200);
            } else {
              console.log(err);
              callback(500, {'Error': 'Could not update the customer'});
            }
          });
        } else {
          callback(400, {'Error': 'The specified customer does not exist'});
        }
      });
    } else {
      callback(400, {'Error': 'Missing fields to update'});
    }
  } else {
    callback(400, {'Error': 'Missing required field'});
  }
};

// Users - delete
// Required field: email
handlers._users.delete = function(data, callback) {
  // Check that the email is valid
  let email = typeof(data.queryStringObject.email) == 'string'
  && data.queryStringObject.email.trim().length > 6
  && data.queryStringObject.email.trim().includes('@')
  ? data.queryStringObject.email.trim() : false;

  if (email) {
    // Lookup the user
    _data.read('users', email, function(err, userData) {
      if (!err && userData) {
        _data.delete('users', email, function(err) {
          if (!err) {
            callback(200);
          } else {
            callback(500, {'Error': 'Could not delete the specified user'});
          }
        });
      } else {
        callback(400, {'Error': 'Could not find the specified user'});
      }
    });
  } else {
    callback(400, {'Error': 'Missing required field'});
  }
};

// Not found handler
handlers.notFound = function(data, callback) {
  callback(404);
};

// Export the module
module.exports = handlers;
