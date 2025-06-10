const express = require('express');
const router = express.Router();
const rawBody = require('./rawBody');
const post = require('./post');
const get = require('./get');
const passport = require('passport');

// POST /v1/fragments
router.post('/fragments', passport.authenticate('basic', { session: false }), rawBody(), post);

// GET /v1/fragments
router.get('/fragments', passport.authenticate('basic', { session: false }), get);

module.exports = router;
