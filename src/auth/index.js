const logger = require('../logger');

// Validate environment variables to prevent conflicting configurations
const usingCognito =
  process.env.AWS_COGNITO_POOL_ID && process.env.AWS_COGNITO_CLIENT_ID;
const usingBasicAuth = process.env.HTPASSWD_FILE;

// Log environment mode and configuration intent
logger.debug(
  {
    NODE_ENV: process.env.NODE_ENV,
    usingCognito,
    usingBasicAuth,
  },
  'Initializing authentication module with environment configuration'
);

// Conflict: Both Cognito and Basic Auth are configured
if (usingCognito && usingBasicAuth) {
  logger.error(
    'Configuration conflict: Both AWS Cognito and HTTP Basic Auth are enabled. Only one is allowed.'
  );
  throw new Error(
    'env contains configuration for both AWS Cognito and HTTP Basic Auth. Only one is allowed.'
  );
}

console.log('usingCognito', usingCognito);
console.log('usingBasicAuth', usingBasicAuth);
console.log('process.env.NODE_ENV', process.env.NODE_ENV);


// Use Cognito if configured
if (usingCognito) {
  logger.info('Authentication strategy selected: AWS Cognito');
  module.exports = require('./cognito');
}
// Use Basic Auth if configured and not in production
else if (usingBasicAuth && process.env.NODE_ENV !== 'production') {
  logger.info('Authentication strategy selected: HTTP Basic Auth');
  module.exports = require('./basic-auth');
}
// No valid configuration found
else {
  logger.error('No valid authentication strategy found in environment variables');
  throw new Error('missing env vars: no authorization configuration found');
}
