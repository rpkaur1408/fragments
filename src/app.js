const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const passport = require('passport');
const authenticate = require('./auth');
const logger = require('./logger');
const pino = require('pino-http')({ logger });
const { createErrorResponse } = require('./response');

// Create an express app instance
const app = express();

// Structured logging middleware (Pino)
app.use(pino);
logger.info('Pino HTTP logger initialized');

// Use helmet.js to add security headers
app.use(helmet());
logger.info('Helmet security middleware configured');

// Enable CORS for all routes
app.use(cors());
logger.info('CORS middleware enabled');

// Enable gzip/deflate compression
app.use(compression());
logger.info('Compression middleware enabled');

// Initialize Passport.js with our authentication strategy
passport.use(authenticate.strategy());
app.use(passport.initialize());
logger.info('Passport authentication initialized');

// Define our main routes
app.use('/', require('./routes'));
logger.info('Main routes mounted');

// 404 middleware to handle any unknown routes
app.use((req, res) => {
  logger.warn({ path: req.originalUrl }, '404 - Route not found');
  res.status(404).json(createErrorResponse(404, 'Not Found'));
});

// General error-handling middleware
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'unable to process request';

  // Log server errors with context
  if (status > 499) {
    logger.error({ err, path: req.originalUrl, method: req.method }, '500 - Server error');
  } else {
    logger.warn({ err, path: req.originalUrl, method: req.method }, 'Handled client error');
  }

  res.status(status).json(createErrorResponse(status, message));
});

// Export the app
logger.info('Express app configured and ready');
module.exports = app;
