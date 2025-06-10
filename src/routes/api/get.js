// src/routes/api/get.js
const { createSuccessResponse} = require('../../response');
const { Fragment } = require('../../model/fragment');

/**
 * Get a list of fragments for the current user
 */
// module.exports = (req, res) => {
//   const fragments = await Fragment.byUser(req.user);

//   res.status(200).json(createSuccessResponse({
//     status: 'ok',
//     fragments: [],
//   }));
// };

module.exports = async (req, res) => {
  // Get all fragments metadata for the authenticated user
  const fragments = await Fragment.byUser(req.user);

  res.status(200).json({
    status: 'ok',
    fragments,
  });
};