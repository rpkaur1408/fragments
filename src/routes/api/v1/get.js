// src/routes/api/v1/get.js
const { Fragment } = require('../../../model/fragment');

module.exports = async (req, res) => {
  try {
    const ownerId = req.user;
    const fragments = await Fragment.byUser(ownerId);
    res.status(200).json({ status: 'ok', fragments });
  } catch (err) {
    console.error('Error in GET /fragments:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
