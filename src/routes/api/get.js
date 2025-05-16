// // src/routes/api/get.js

// const { getFragments } = require('../../model/data');

// /**
//  * Get a list of fragments for the current user
//  */
// module.exports = async (req, res) => {
//   try {
//     // Ensure the user is authenticated
//     const user = req.user;

//     if (!user || !user.email) {
//       return res.status(401).json({
//         status: 'error',
//         message: 'Unauthorized',
//       });
//     }


//     // Get fragments for the user
//     const fragments = await getFragments(user.email, expand);

//     // Respond with the user's fragments
//     res.status(200).json({
//       status: 'ok',
//       fragments,
//     });
//   } catch (err) {
//     console.error('Error getting fragments:', err);
//     res.status(500).json({
//       status: 'error',
//       message: 'Server error while retrieving fragments',
//     });
//   }
// };


// src/routes/api/get.js

/**
 * Get a list of fragments for the current user
 */
module.exports = (req, res) => {
  // TODO: this is just a placeholder. To get something working, return an empty array...
  res.status(200).json({
    status: 'ok',
    // TODO: change me
    fragments: [],
  });
};
