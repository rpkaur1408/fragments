const passport = require('passport');

const { createErrorResponse } = require('../response');
const hash = require('../hash');
const logger = require('../logger');

/**
 * @param {'bearer' | 'http'} strategyName - the passport strategy to use
 * @returns {Function} - the middleware function to use for authentication
 */
module.exports = (strategyName) => {
  return function (req, res, next) {
    logger.info({ strategy: strategyName, path: req.path }, 'Authenticating request');

    /**
     * Define a custom callback to run after the user has been authenticated
     * where we can modify the way that errors are handled, and hash emails.
     * @param {Error} err - an error object
     * @param {string} email - an authenticated user's email address
     */
    function callback(err, email) {
      if (err) {
        logger.error({ err, path: req.path }, 'Error authenticating user');
        return next(createErrorResponse(500, 'Unable to authenticate user'));
      }

      if (!email) {
        logger.warn({ path: req.path }, 'Unauthorized access attempt');
        return res.status(401).json(createErrorResponse(401, 'Unauthorized'));
      }

      req.user = hash(email);
      logger.debug({ email, hash: req.user, path: req.path }, 'Authenticated user');

      next();
    }

    passport.authenticate(strategyName, { session: false }, callback)(req, res, next);
  };
};
