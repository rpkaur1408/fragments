const { createSuccessResponse, createErrorResponse } = require('../../response');
const logger = require('../../logger');
const { Fragment } = require('../../model/fragment');

/**
 * 4.4 GET /fragments - Get all fragments for the current user
 */
const getFragments = async (req, res) => {
  logger.debug({ user: req.user }, 'Fetching all fragments for user');

  try {
    const fragments = await Fragment.byUser(req.user, false);
    logger.info({ user: req.user, count: fragments.length }, 'Fragments fetched successfully');
    res.status(200).json(createSuccessResponse({ fragments }));
  } catch (error) {
    logger.error({ user: req.user, err: error.message }, 'Failed to fetch fragments');
    res.status(500).json(createErrorResponse(500, 'Internal Server Error'));
  }
};

/**
 * 4.5 GET /fragments/:id - Get a fragment by ID (plain text version)
 */
const getFragmentById = async (req, res) => {
  const { id } = req.params;
  logger.debug({ user: req.user, id }, 'Fetching fragment by ID');

  try {
    const isTextRequest = id.endsWith('.txt');
    const fragmentId = isTextRequest ? id.replace('.txt', '') : id;

    const fragment = await Fragment.byId(req.user, fragmentId);
    logger.info({ user: req.user, id: fragmentId }, 'Fragment metadata retrieved');

    if (isTextRequest) {
      if (!fragment.formats.includes('text/plain')) {
        logger.warn({ user: req.user, id: fragmentId }, 'Fragment cannot be converted to plain text');
        return res.status(415).json(
          createErrorResponse(415, 'Fragment cannot be converted to plain text')
        );
      }

      const textData = await fragment.getConvertedInto('.txt');
      logger.debug({ user: req.user, id: fragmentId }, 'Returning .txt version of fragment');
      return res.status(200).type('text/plain').send(textData);
    }

    const fragmentData = await fragment.getData();
    logger.debug({ user: req.user, id: fragmentId }, 'Returning original fragment data');
    res.status(200).type(fragment.mimeType).send(fragmentData);
  } catch (error) {
    logger.error({ user: req.user, id, err: error.message }, 'Fragment not found or error occurred');
    res.status(404).json(createErrorResponse(404, `No fragment with ID ${id} found`));
  }
};

module.exports = {
  getFragments,
  getFragmentById
};
