const { createSuccessResponse, createErrorResponse } = require('../../response');
const logger = require('../../logger');
const { Fragment } = require('../../model/fragment');

/**
 * 4.4 GET /fragments - Get all fragments for the current user
 */
const getFragments = async (req, res) => {
  logger.debug({ user: req.user, query: req.query }, 'Fetching all fragments for user');

  try {
    // Check for expand=1 in the query string
    const expand = req.query.expand === '1';
    const fragments = await Fragment.byUser(req.user, expand);
    logger.info({ user: req.user, count: fragments.length, expand }, 'Fragments fetched successfully');
    res.status(200).json(createSuccessResponse({ fragments }));
  } catch (error) {
    logger.error({ user: req.user, err: error.message }, 'Failed to fetch fragments');
    res.status(500).json(createErrorResponse(500, 'Internal Server Error'));
  }
};

/**
 * 4.5 GET /fragments/:id - Get a fragment by ID with optional format conversion
 */
const getFragmentById = async (req, res) => {
  const { id } = req.params;
  logger.debug({ user: req.user, id }, 'Fetching fragment by ID');

  try {
    // Extract extension and fragment ID
    const extensionMatch = id.match(/\.([^.]+)$/);
    const extension = extensionMatch ? `.${extensionMatch[1]}` : null;
    const fragmentId = extension ? id.replace(extension, '') : id;

    const fragment = await Fragment.byId(req.user, fragmentId);
    logger.info({ user: req.user, id: fragmentId, extension }, 'Fragment metadata retrieved');

    // If extension is provided, attempt conversion
    if (extension) {
      try {
        const convertedData = await fragment.getConvertedInto(extension);
        
        // Set appropriate Content-Type based on extension
        let contentType;
        switch (extension.toLowerCase()) {
          case '.txt':
            contentType = 'text/plain';
            break;
          case '.html':
            contentType = 'text/html';
            break;
          case '.md':
            contentType = 'text/markdown';
            break;
          case '.json':
            contentType = 'application/json';
            break;
          default:
            logger.warn({ user: req.user, id: fragmentId, extension }, 'Unsupported extension');
            return res.status(415).json(
              createErrorResponse(415, `Unsupported conversion to ${extension}`)
            );
        }
        
        logger.debug({ user: req.user, id: fragmentId, extension }, `Returning ${extension} version of fragment`);
        return res.status(200).type(contentType).send(convertedData);
      } catch (conversionError) {
        logger.warn({ user: req.user, id: fragmentId, extension, error: conversionError.message }, 'Conversion failed');
        return res.status(415).json(
          createErrorResponse(415, `Fragment cannot be converted to ${extension}`)
        );
      }
    }

    // No extension provided, return original data
    const fragmentData = await fragment.getData();
    logger.debug({ user: req.user, id: fragmentId }, 'Returning original fragment data');
    res.status(200).type(fragment.mimeType).send(fragmentData);
  } catch (error) {
    logger.error({ user: req.user, id, err: error.message }, 'Fragment not found or error occurred');
    res.status(404).json(createErrorResponse(404, `No fragment with ID ${id} found`));
  }
};

/**
 * 4.7 GET /fragments/:id/info - Get a fragment's metadata
 */
const getFragmentInfo = async (req, res) => {
  const { id } = req.params;
  logger.debug({ user: req.user, id }, 'Fetching fragment metadata by ID');

  try {
    const fragment = await Fragment.byId(req.user, id);
    logger.info({ user: req.user, id }, 'Fragment metadata retrieved');
    res.status(200).json(createSuccessResponse({ fragment }));
  } catch (error) {
    logger.error({ user: req.user, id, err: error.message }, 'Fragment not found or error occurred');
    res.status(404).json(createErrorResponse(404, `No fragment with ID ${id} found`));
  }
};

module.exports = {
  getFragments,
  getFragmentById,
  getFragmentInfo,
};
