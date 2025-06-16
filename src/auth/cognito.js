// Configure a JWT token strategy for Passport based on
// Identity Token provided by Cognito. The token will be
// parsed from the Authorization header (i.e., Bearer Token).
const authorize = require('./auth-middleware');
const BearerStrategy = require('passport-http-bearer').Strategy;
const { CognitoJwtVerifier } = require('aws-jwt-verify');

const logger = require('../logger');

// Validate required environment variables
if (!(process.env.AWS_COGNITO_POOL_ID && process.env.AWS_COGNITO_CLIENT_ID)) {
  logger.error('Missing AWS_COGNITO_POOL_ID or AWS_COGNITO_CLIENT_ID environment variable');
  throw new Error('missing expected env vars: AWS_COGNITO_POOL_ID, AWS_COGNITO_CLIENT_ID');
}

// Log that Cognito is being used
logger.info('Using AWS Cognito for auth');

// Create Cognito JWT verifier
logger.debug(
  {
    userPoolId: process.env.AWS_COGNITO_POOL_ID,
    clientId: process.env.AWS_COGNITO_CLIENT_ID,
  },
  'Initializing Cognito JWT verifier'
);

const jwtVerifier = CognitoJwtVerifier.create({
  userPoolId: process.env.AWS_COGNITO_POOL_ID,
  clientId: process.env.AWS_COGNITO_CLIENT_ID,
  tokenUse: 'id',
});

// Hydrate JWKS cache at startup
jwtVerifier
  .hydrate()
  .then(() => {
    logger.info('Cognito JWKS cached successfully');
  })
  .catch((err) => {
    logger.error({ err }, 'Unable to cache Cognito JWKS at startup');
 });

// Define Bearer strategy
module.exports.strategy = () =>
  new BearerStrategy(async (token, done) => {
    try {
      const user = await jwtVerifier.verify(token);
      logger.debug({ user }, 'Successfully verified Cognito token');
      done(null, user.email);
    } catch (err) {
      logger.warn({ err: err.message, token }, 'Failed to verify Cognito token');
      done(null, false);
    }
  });

// Export authenticate middleware
module.exports.authenticate = () => authorize('bearer');
