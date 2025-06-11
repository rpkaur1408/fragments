// // src/routes/api/get.js
// const { Fragment } = require('../../model/fragment');

// /**
//  * Get a list of fragments for the current user
//  */
// // module.exports = (req, res) => {
// //   const fragments = await Fragment.byUser(req.user);

// //   res.status(200).json(createSuccessResponse({
// //     status: 'ok',
// //     fragments: [],
// //   }));
// // };

// module.exports = async (req, res) => {
//   // Get all fragments metadata for the authenticated user
//   const fragments = await Fragment.byUser(req.user);

//   res.status(200).json({
//     status: 'ok',
//     fragments,
//   });
// };


const { createSuccessResponse, createErrorResponse } = require('../../response');
const logger = require('../../logger');



const { Fragment } = require('../../model/fragment');

/**
 * 4.4 GET /fragments - Get all fragments for the current user
 */
const getFragments = async (req, res) => {
  logger.debug(`Get all fragments for user ${req.user}`);
  try {
    const fragments = await Fragment.byUser(req.user, false);
        console.log(`Found fragment: ${fragments}`);
    res.status(200).json(createSuccessResponse({ fragments: fragments }));
  } catch (error) {
    logger.error(`Failed to get fragments for user ${req.user}, Error: ${error}`);
    res.status(500).json(createErrorResponse(500, 'Internal Server Error'));
  }
};

/**
 * 4.5 GET /fragments/:id - Get a fragment by ID (plain text version)
 */
const getFragmentById = async (req, res) => {
  const { id } = req.params;
  logger.debug(`Get fragment by ID ${id}`);
  
  try {
    // Check if ID includes .txt extension
    const isTextRequest = id.endsWith('.txt');
    const fragmentId = isTextRequest ? id.replace('.txt', '') : id;
    
    const fragment = await Fragment.byId(req.user, fragmentId);
    
    if (isTextRequest) {
      // If requesting .txt version, verify fragment can be converted to plain text
      if (!fragment.formats.includes('text/plain')) {
        return res.status(415).json(
          createErrorResponse(415, 'Fragment cannot be converted to plain text')
        );
      }
      
      // Get and return the plain text version
      const textData = await fragment.getConvertedInto('.txt');
      return res.status(200).type('text/plain').send(textData);
    }
    
    // For regular request, return the original fragment data
    const fragmentData = await fragment.getData();
    res.status(200).type(fragment.mimeType).send(fragmentData);
  } catch (error) {
    logger.error(`No fragment with ID ${id} found. Error: ${error}`);
    res.status(404).json(createErrorResponse(404, `No fragment with ID ${id} found`));
  }
};

module.exports = {
  getFragments,
  getFragmentById
};