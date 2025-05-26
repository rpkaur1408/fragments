// src/app.js

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const passport = require('passport');
const authenticate = require('./auth');

// author and version from our package.json file
// TODO: make sure you have updated your name in the `author` section
// const { author, version } = require('../package.json'); // Commenting to solve ESlint variable not used issue

const logger = require('./logger');
const pino = require('pino-http')({
  // Use our default logger instance, which is already configured
  logger,
});

// Create an express app instance we can use to attach middleware and HTTP routes
const app = express();

const {  createErrorResponse } = require('../src/response');


// Use pino logging middleware
app.use(pino);

// Use helmetjs security middleware
app.use(helmet());

// Use CORS middleware so we can make requests across origins
app.use(cors());

// Use gzip/deflate compression middleware
app.use(compression());

passport.use(authenticate.strategy());
app.use(passport.initialize());

// Define a simple health check route. If the server is running
// we'll respond with a 200 OK.  If not, the server isn't healthy.
app.use('/', require('./routes'));

// Add 404 middleware to handle any requests for resources that can't be found
// Add 404 middleware
app.use((req, res) => {
  res.status(404).json(createErrorResponse(404, 'not found'));
});

// Add error-handling middleware to deal with anything else
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'unable to process request';

  if (status > 499) {
    logger.error({ err }, `Error processing request`);
  }

  res.status(status).json(createErrorResponse(status, message));
});

// Export our `app` so we can access it in server.js
module.exports = app;
