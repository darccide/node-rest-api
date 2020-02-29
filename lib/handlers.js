// Request handlers

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');
const config = require('./config');

// Define the handlers
let handlers = {};

// Users
handlers.users = function(data, callback) {
  let acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for the users submethods
handlers._users = {};

// Users - post
// Required data: zip, lastName, email, password, address, state, zip
// Optional data: role (NOTE: only optional to input)
// User does not have to specify role unless they want to add items
// If they do they need to try and input something
// Else they can leave the field blank
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

  let role = typeof(data.payload.role) == 'string'
  && data.payload.role !== ''
  && data.payload.role !== 'customer'
  ? 'employee' : 'customer';

  if (firstName && lastName && email && password
    && address && state && zip && role) {
    // Make sure the user doesn't already exist
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
            'zip': zip,
            'role': role
          };

          // Store the user
          _data.create('users', email, userObject, function(err) {
            if (!err) {
              callback(200);
            } else {
              console.log(err);
              callback(500, {'Error': 'A user with that email already exists'});
            }
          });
        } else {
          callback(500, {'Error': 'Could not hash the user\'s password'});
        }
      } else {
        // Customer already exists
        callback(400, {'Error': 'A user with that email already exists'});
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
    // Get token from the headers
    let token = typeof(data.headers.token) == 'string'
    ? data.headers.token : false;

    // Verify that given token is valid for the email
    handlers._tokens.verifyToken(token, email, function(tokenIsValid) {
      if (tokenIsValid) {
        // Lookup the user
        _data.read('users', email, function(err, data) {
          if (!err && data) {
            // Remove the hashed password from user object before returning it
            delete data.hashedPassword;
            // Remove the role from user object before returning it
            delete data.role;
            callback(200, data);
          } else {
            callback(404);
          }
        });
      } else {
        callback(403, {'Error': 'Missing required token or its invalid'});
      }
    });
  } else {
    callback(400, {'Error': 'Missing required field'});
  }
};

// Users - put
// Required data: email
// Optional data: firstName, lastName, password, address, state, zip, role
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

  let role = typeof(data.payload.role) == 'string'
  && data.payload.role !== ''
  && data.payload.role !== 'customer'
  ? 'employee' : 'customer';

  // Error if the email is invalid
  if (email) {
    // Error if nothing is sent to update
    if (firstName || lastName || password || address || state || zip || role) {

      // Get token from the headers
      let token = typeof(data.headers.token) == 'string'
      ? data.headers.token : false;

      // Verify that given token is valid for the email
      handlers._tokens.verifyToken(token, email, function(tokenIsValid) {
        if (tokenIsValid) {
          // Lookup the user
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
              if (role) {
                if (userData.role == 'employee'
                  || userData.role == 'customer') {
                  userData.role = role;
                }
              }
              // Store the new updates
              _data.update('users', email, userData, function(err) {
                if (!err) {
                  callback(200);
                } else {
                  console.log(err);
                  callback(500, {'Error': 'Could not update the user'});
                }
              });
            } else {
              callback(400, {'Error': 'The specified user does not exist'});
            }
          });
        } else {
          callback(403, {'Error': 'Missing required token or its invalid'});
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
    // Get token from the headers
    let token = typeof(data.headers.token) == 'string'
    ? data.headers.token : false;

    // Verify that given token is valid for email
    handlers._tokens.verifyToken(token, email, function(tokenIsValid) {
      if (tokenIsValid) {
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
        callback(403, {'Error': 'Missing required token or its invalid'});
      }
    });
  } else {
    callback(400, {'Error': 'Missing required field'});
  }
};

// Tokens
handlers.tokens = function(data, callback) {
  let acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for all tokens methods
handlers._tokens = {};

// Tokens - post
// Required data: email, password
// Optional data: none
handlers._tokens.post = function(data, callback) {
  let email = typeof(data.payload.email) == 'string'
  && data.payload.email.trim().length > 6
  && data.payload.email.trim().includes('@')
  ? data.payload.email.trim() : false;

  let password = typeof(data.payload.password) == 'string'
  && data.payload.password.trim().length >= 6
  ? data.payload.password.trim() : false;

  if (email && password) {
    // Lookup user who matches email
    _data.read('users', email, function(err, userData) {
      if (!err && userData) {
        // Hash sent password, compare it to stored user password
        let hashedPassword = helpers.hash(password);
        if (hashedPassword == userData.hashedPassword) {
          // If valid create new token with random name
          let tokenId = helpers.createRandomString(20);
          // Set expiration date 1 hour in the future
          let expires = Date.now() + 1000 * 60 * 60;
          let tokenObject = {
            'email': email,
            'id': tokenId,
            'expires': expires
          };

          // Store the token
          _data.create('tokens', tokenId, tokenObject, function(err) {
            if (!err) {
              callback(200, tokenObject);
            } else {
              callback(500, {'Error': 'Could not create new token'});
            }
          });
        } else {
          callback(400, {'Error': 'Password did not match stored password'});
        }
      } else {
        callback(400, {'Error': 'Could not find the specified user'});
      }
    });
  } else {
    callback(400, {'Error': 'Missing required field(s)'});
  }
};

// Tokens - get
// Required data: id
// Optional data: none
handlers._tokens.get = function(data, callback) {
  // Check that id is valid
  let id = typeof(data.queryStringObject.id) == 'string'
  && data.queryStringObject.id.trim().length == 20
  ? data.queryStringObject.id.trim() : false;

  if (id) {
    // Lookup token
    _data.read('tokens', id, function(err, tokenData) {
      if (!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, {'Error': 'Missing required field'});
  }
};

// Tokens - put
// Required data: id, extend
// Optional data: none
handlers._tokens.put = function(data, callback) {
  let id = typeof(data.payload.id) == 'string'
  && data.payload.id.trim().length == 20
  ? data.payload.id.trim() : false;

  let extend = typeof(data.payload.extend) == 'boolean'
  && data.payload.extend == true ? true : false;

  if (id && extend) {
    // Lookup the token
    _data.read('tokens', id, function(err, tokenData) {
      if (!err && tokenData) {
        // Check to make sure token hasn't already expired
        if (tokenData.expires > Date.now()) {
          // Set the expiration an hour from now
          tokenData.expires = Date.now() + 100 * 60 * 60;

          // Store the new updates
          _data.update('tokens', id, tokenData, function(err) {
            if (!err) {
              callback(200);
            } else {
              callback(500, {'Error': 'Could not update token\'s expiration'});
            }
          });
        } else {
          callback(400, {'Error': 'The token expired and cannot be extended'});
        }
      } else {
        callback(400, {'Error': 'Specified token does not exist'});
      }
    });
  } else {
    callbacck(400, {'Error': 'Required field(s) are missing or invalid'})
  }
};

// Tokens - delete
// Required data: id
// Optional data: none
handlers._tokens.delete = function(data, callback) {
  // Check that id is valid
  let id = typeof(data.queryStringObject.id) == 'string'
  && data.queryStringObject.id.trim().length == 20
  ? data.queryStringObject.id.trim() : false;

  if (id) {
    // Lookup the token
    _data.read('tokens', id, function(err, data) {
      if (!err && data) {
        _data.delete('tokens', id, function(err) {
          if (!err) {
            callback(200);
          } else {
            callback(500, {'Error': 'Could not delete specified token'});
          }
        });
      } else {
        callback(400, {'Error': 'Could not find specified token'});
      }
    });
  } else {
    callback(400, {'Error': 'Missing required field'});
  }
};

// Carts
handlers.carts = function(data, callback) {
  let acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._items[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for the carts submethods
handlers._carts = {};

// Carts - post
// Required data: email, itemName
// Optional data: none
handlers._carts.post = function(id, item, callback) {
  _carts.get = function(id, (err, data)) {
    if (!err && data) {
      if (!data.items.find(cart => cart.id === item.id)) {
        data.items.push(item);
      }
      _data.update('carts', `cart#${id}`, data, function(err) {
        if (!err) {
          callback(false);
        } else {
            callback(err);
        }
      });
    } else {
        callback({'Error': 'Unable to create cart'});
    }
  };
};

handlers._carts.get = function(id, callback) {
  const cartName = `cart#${id}`;
  // Lookup the cart
  _data.read('carts', cartName, function(err, data) {
    if (!err && data) {
      callback(false, data);
    } else {
      const cart = {
        id,
        items: []
      };
      _data.create('carts', cartName, cart, function(err) {
        if (!err) {
          callback(false, cart);
        } else {
            callback({'Error': 'Unable to create cart file'});
        }
      });
    }
  });
};

// Container for the order submethods
handlers._orders = {};

// Orders - get
// Required data: email
// Optional data: none
handlers._orders.get = function(data, callback) {
  // Check that email is valid
  let email = typeof(data.payload.email) == 'string'
  && data.payload.email.trim().length > 6
  && data.payload.email.trim().includes('@')
  ? data.payload.email.trim() : false;

  // Get token from the headers
  let token = typeof(data.headers.token) == 'string'
  ? data.headers.token : false;

  // Verify that given token is valid for the email
  handlers._tokens.verifyToken(token, email, function(tokenIsValid) {
    if (tokenIsValid) {
      callback(200, { items: handlers._menuItems });
    } else {
      callback(403, {'Error': 'Missing required token or its invalid'});
    }
  });
};

// Orders - post
// Required data: email, items
// Optional data: none
handlers._orders.post = function(data, callback) {
  // Check email is valid
  let email = typeof(data.payload.email) == 'string'
  && data.payload.email.trim().length > 6
  && data.payload.email.trim().includes('@')
  ? data.payload.email.trim() : false;

  let items = typeof(data.payload.items) == 'object'
  && data.payload.items instanceof Array
  && data.payload.items.length > 0
  && !data.payload.items
    .find( item => !item['id']
      || !_delivery.menuItems.find(menuItem => menuItem.id === item['id'])
    ))
  ? data.payload.items : false;

  if (items) {
    // Get token from the headers
    var token = typeof(data.headers.token) == 'string'
    ? data.headers.token : false;

    // Verify that given token is valid for email
    handlers._tokens.verifyToken(token, email, function(tokenIsValid) {
      if (tokenIsValid) {
        // Make sure the order doesn't already exist
        items.forEach(item => {
          const pick = handlers._menuItems.find(menuItem => menuItem.id === item.id);
          handlers._carts.post(token, pick, function(err) {
            if (!err) {
              callback(200);
            } else {
              callback(500, {'Error': err});
            }
          });
        });
      } else {
        callback(403, {'Error': 'Missing required token or its invalid'});
      }
    });
  } else {
      callback(400, {'Error': 'Missing required field(s)'});
  }
};

// Create an order
handlers._createOrder = (data, callback) => {
  // Get the token from the headers
  const token = typeof data.headers.token === 'string' ? data.headers.token : false;

  // Verify that the given token is valid
  tokens.verifyToken(token, isValid => {
    if (isValid) {
      // Get the cart
      handlers._carts.get = function(token, (err, cartData) => {
        if (!err && cartData) {
          if (cartData.items.length > 0) {
            // Calculate the amount value
            const amount = cartData.items.reduce((acc, curr) => acc + curr.value, 0) * 100;
            // Send the payment request via Stripe
            helpers.sendStripePayment(amount, (err, stripeData) => {
              if (!err && stripeData) {
                // Send the receipt to the client via Mailgun
                const receiptUrl =
                  stripeData['charges'] &&
                  stripeData['charges']['data'] &&
                  stripeData['charges']['data'].length > 0 &&
                  typeof stripeData['charges']['data'][0]['receipt_url'] === 'string' &&
                  stripeData['charges']['data'][0]['receipt_url'].trim().length > 0
                    ? stripeData['charges']['data'][0]['receipt_url']
                    : false;

                if (receiptUrl) {
                  // Load the token file to get the user's email
                  _data.read('tokens', token, (err, tokenData) => {
                    if (!err && tokenData) {
                      // Get the destination email
                      const customer = tokenData.email;
                      helpers.sendMail(
                        customer,
                        'Your Order',
                        `Your order for Delivery: ${receiptUrl}`,
                        err => {
                          if (!err) {
                            callback(false);
                          } else {
                            callback(500, {'Error': 'Issue sending order details'});
                          }
                        }
                      );
                    } else {
                      callback(500, {'Error': 'Could not find the token file'});
                    }
                  });
                } else {
                  callback(500, {'Error': 'The receipt URL was not found'});
                }
              } else {
                console.log(err);
                callback(500, {'Error': 'Could not create and confirm the payment at Stripe'});
              }
            });
          } else {
            callback(400, {'Error': 'There are not any items in the cart'});
          }
        } else {
          callback(500, { 'Error': 'Could not get the cart' });
        }
      });
    } else {
      callback(403, {'Error': 'Missing required token or its invalid'});
    }
  });
};


// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = function(id, email, callback) {
  // Lookup token
  _data.read('tokens', id, function(err, tokenData) {
    if (!err && tokenData) {
      // Check that token is for given user and has not expired
      if (tokenData.email == email && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

handlers._menuItems = [
  { id: 1, name: 'Pepperoni', price: 8 },
  { id: 2, name: 'Bulgogi', price: 10 },
  { id: 3, name: 'Spicy Chicken', price 12}
];

// Not found handler
handlers.notFound = function(data, callback) {
  callback(404);
};

// Export the module
module.exports = handlers;
