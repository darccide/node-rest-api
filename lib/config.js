// Create and export config variables

// Container for all the environments
const environments = {};

// Stating (default) environment
environments.staging = {
  'httpPort': 3030,
  'httpsPort': 3031,
  'envName': 'staging',
  'hashingSecret': 'pizzaSecret',
  stripe: {
    secret: 'sk_test_gtGgFujIT0DJws1HfGxoRvvQ',
    currency: 'usd',
    source: 'tok_visa',
    description: 'Chingu Pizza Test Charge'
  },
  mailgun: {
    user: 'api',
    key: '6b709e7397ced12fe5a921122e33938a-9dda225e-aa542cdb',
    from: 'sandboxaa47ab2fef554b09a4f3d3c886c7a006.mailgun.org'
  }
};

// Production environment
environments.production = {
  'httpPort': 5050,
  'httpsPort': 5051,
  'envName': 'production',
  'hashingSecret': 'pizzaSecretToo',
  stripe: {
    secret: 'sk_test_gtGgFujIT0DJws1HfGxoRvvQ',
    currency: 'usd',
    source: 'tok_visa',
    description: 'Chingu Pizza Test Charge'
  },
  mailgun: {
    key: '6b709e7397ced12fe5a921122e33938a-9dda225e-aa542cdb',
    from: '	sandboxaa47ab2fef554b09a4f3d3c886c7a006.mailgun.org'
  }
};





// Determine environment based on command-line argument
let currentEnvironment = typeof(process.env.NODE_ENV) == 'string'
    ? process.env.NODE_ENV.toLowerCase() : '';

// Check current environment is one from above, if not, default to staging
let environmentToExport = typeof(environments[currentEnvironment]) == 'object'
    ? environments[currentEnvironment] : environments.staging;

// Export the module
module.exports = environmentToExport;
