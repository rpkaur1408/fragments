// src/routes/api/index.js

/**
 * The main entry-point for the API.
 */
const express = require('express');

// Create a router
const router = express.Router();

// Mount versioned routes at /v1
router.use('/v1', require('./v1'));

module.exports = router;
