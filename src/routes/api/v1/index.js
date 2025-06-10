// // src/routes/api/v1/index.js
// const express = require('express');
// const router = express.Router();
// const rawBody = require('./rawBody');
// const post = require('./post');
// const { authenticate } = require('../../../auth');

// router.post('/fragments', authenticate, rawBody(), post);

// module.exports = router;

// src/routes/api/v1/index.js
const express = require('express');
const router = express.Router();
const rawBody = require('./rawBody');
const post = require('./post');

const passport = require('passport');
router.post('/fragments', passport.authenticate('basic', { session: false }), rawBody(), post);



module.exports = router;
