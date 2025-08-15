const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const { createErrorResponse } = require('../../response');
const contentType = require('content-type');

/**
 * PUT /fragments/:id
 * Allows the authenticated user to update (i.e., replace) the data for their existing fragment with the specified id.
 */
module.exports = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ownerId = req.user;

    logger.debug({ ownerId, fragmentId: id }, 'Attempting to update fragment');

    // Check if Content-Type header is present
    if (!req.headers['content-type']) {
      logger.warn({ ownerId, fragmentId: id }, 'Missing Content-Type header');
      return res.status(400).json(
        createErrorResponse(400, 'Content-Type header is required')
      );
    }

    // Parse and validate Content-Type
    let type;
    try {
      const parsed = contentType.parse(req.headers['content-type']);
      type = parsed.type;
    } catch (error) {
      logger.warn({ ownerId, fragmentId: id, contentType: req.headers['content-type'] }, 'Invalid Content-Type header');
      return res.status(400).json(
        createErrorResponse(400, 'Invalid Content-Type header')
      );
    }

    // Check if the type is supported
    if (!Fragment.isSupportedType(type)) {
      logger.warn({ ownerId, fragmentId: id, type }, 'Unsupported Content-Type');
      return res.status(415).json(
        createErrorResponse(415, `Unsupported Content-Type: ${type}`)
      );
    }

    // Check if fragment exists and belongs to the user
    let existingFragment;
    try {
      existingFragment = await Fragment.byId(ownerId, id);
    } catch (error) {
      if (error.message === 'Fragment not found') {
        logger.warn({ ownerId, fragmentId: id }, 'Fragment not found for update');
        return res.status(404).json(
          createErrorResponse(404, 'The requested fragment does not exist or does not belong to you')
        );
      }
      throw error;
    }

    // Check if the Content-Type matches the existing fragment's type
    const existingType = contentType.parse(existingFragment.type).type;
    if (type !== existingType) {
      logger.warn({ 
        ownerId, 
        fragmentId: id, 
        requestType: type, 
        existingType 
      }, 'Content-Type mismatch - cannot change fragment type');
      return res.status(400).json(
        createErrorResponse(400, `Fragment type cannot be changed. Expected: ${existingType}, received: ${type}`)
      );
    }

    // Validate request body
    if (!req.body || req.body.length === 0) {
      logger.warn({ ownerId, fragmentId: id }, 'Empty request body');
      return res.status(400).json(
        createErrorResponse(400, 'Request body cannot be empty')
      );
    }

    // Update the fragment data
    existingFragment.size = req.body.length;
    existingFragment.updated = new Date().toISOString();

    // Save metadata and data
    await existingFragment.save();
    await existingFragment.setData(req.body);

    logger.info({ 
      ownerId, 
      fragmentId: id, 
      size: existingFragment.size 
    }, 'Fragment updated successfully');

    // Return success response with updated metadata
    res.status(200).json({
      status: 'ok',
      fragment: {
        id: existingFragment.id,
        ownerId: existingFragment.ownerId,
        created: existingFragment.created,
        updated: existingFragment.updated,
        type: existingFragment.type,
        size: existingFragment.size,
      }
    });

  } catch (error) {
    logger.error({ 
      error: error.message, 
      ownerId: req.user, 
      fragmentId: req.params.id 
    }, 'Error updating fragment');
    next(error);
  }
};
