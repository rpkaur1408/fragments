/**
 * The main entry-point for the API.
 */
const express = require('express');
const { Fragment } = require('../../model/fragment');
const contentType = require('content-type');
const logger = require('../../logger');

const { getFragments, getFragmentById, getFragmentInfo } = require('./get');

// Middleware to parse raw body for supported content types
const rawBody = () =>
  express.raw({
    inflate: true,
    limit: '5mb',
    type: (req) => {
      try {
        const { type } = contentType.parse(req);
        const isSupported = Fragment.isSupportedType(type);
        logger.debug({ path: req.path, contentType: type, supported: isSupported }, 'Checking content-type for rawBody parsing');
        return isSupported;
      } catch (err) {
        logger.warn({ path: req.path, err: err.message }, 'Invalid or unparsable content-type');
        return false;
      }
    },
  });

// Create a router
const router = express.Router();

// Route definitions with logging
router.get('/fragments', (req, res, next) => {
  logger.info({ method: 'GET', path: '/fragments' }, 'Received request');
  getFragments(req, res, next);
});

router.get('/fragments/:id', (req, res, next) => {
  logger.info({ method: 'GET', path: `/fragments/${req.params.id}` }, 'Received request');
  getFragmentById(req, res, next);
});

router.get('/fragments/:id/info', (req, res, next) => {
  logger.info({ method: 'GET', path: `/fragments/${req.params.id}/info` }, 'Received request');
  getFragmentInfo(req, res, next);
});

router.post('/fragments', rawBody(), (req, res, next) => {
  logger.info({ method: 'POST', path: '/fragments', contentLength: req.headers['content-length'] }, 'Received request');
  require('./post')(req, res, next);
});

router.delete('/fragments/:id', (req, res, next) => {
  logger.info({ method: 'DELETE', path: `/fragments/${req.params.id}` }, 'Received request');
  require('./delete')(req, res, next);
});

logger.info('API router initialized and routes mounted');

module.exports = router;