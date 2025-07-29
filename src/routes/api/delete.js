const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const { createErrorResponse } = require('../../response');

/**
 * DELETE /fragments/:id
 * Allows the authenticated user to delete one of their existing fragments with the given id.
 */
module.exports = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ownerId = req.user;

    logger.debug({ ownerId, fragmentId: id }, 'Attempting to delete fragment');

    // Check if fragment exists and belongs to the user
    try {
      await Fragment.byId(ownerId, id);
    } catch (error) {
      if (error.message === 'Fragment not found') {
        logger.warn({ ownerId, fragmentId: id }, 'Fragment not found for deletion');
        return res.status(404).json(
          createErrorResponse(404, 'The requested fragment does not exist or does not belong to you')
        );
      }
      throw error;
    }

    // Delete the fragment
    await Fragment.delete(ownerId, id);

    logger.info({ ownerId, fragmentId: id }, 'Fragment deleted successfully');

    // Return success response
    res.status(200).json({
      status: 'ok'
    });

  } catch (error) {
    logger.error({ error: error.message, ownerId: req.user, fragmentId: req.params.id }, 'Error deleting fragment');
    next(error);
  }
};
