// API entry point and primary file

// Dependencies
const server = require('./lib/server');

// Declare the app
const app = {};

// Init function
app.init = function() {
  // Start the server
  server.init();

  // @TODO start the workers
};

// Execute app
app.init();

// Export the app
module.exports = app;
