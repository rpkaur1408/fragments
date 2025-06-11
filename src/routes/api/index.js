// src/routes/api/index.js

/**
 * The main entry-point for the API.
 */
const express = require('express');
const { Fragment } = require('../../model/fragment');
const contentType = require('content-type');

const { getFragments, getFragmentById } = require('./get');

const rawBody = () =>
  express.raw({
    inflate: true,
    limit: '5mb',
    type: (req) => {
      // See if we can parse this content type. If we can, `req.body` will be
      // a Buffer (e.g., `Buffer.isBuffer(req.body) === true`). If not, `req.body`
      // will be equal to an empty Object `{}` and `Buffer.isBuffer(req.body) === false`
      const { type } = contentType.parse(req);
      return Fragment.isSupportedType(type);
    },
  });
// Create a router
const router = express.Router();

// Mount versioned routes at /v1
// router.use('/v1', require('./v1-9'));
router.get("/fragments",getFragments);
router.get('/fragments/:id', getFragmentById);
router.post('/fragments', rawBody(), require('./post'));

module.exports = router;
