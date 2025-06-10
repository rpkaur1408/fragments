const { Fragment } = require('../../model/fragment');
const contentType = require('content-type');
const logger = require('../../logger');

/**
 * POST /v1/fragments
 * Creates a new fragment (text/plain only) for the current authenticated user
 */
module.exports = async (req, res) => {
  let type;

  // Parse the Content-Type header
  try {
    ({ type } = contentType.parse(req));
  } catch (err) {
    logger.error('Missing or invalid Content-Type header');
    return res.status(400).json({ status: 'error', message: 'Invalid Content-Type header' });
  }

  logger.debug(`Content-Type: ${type}`);

  // Check that body is a Buffer
  if (!Buffer.isBuffer(req.body)) {
    logger.error('Request body is not a buffer');
    return res.status(415).json({ status: 'error', message: 'Unsupported media type' });
  }

  // Check that the type is supported (we're only doing text/plain)
  if (!Fragment.isSupportedType(type)) {
    logger.warn(`Unsupported content-type: ${type}`);
    return res.status(415).json({ status: 'error', message: 'Unsupported content type' });
  }

  // Create and save the fragment
  const fragment = new Fragment({
    ownerId: req.user,
    type,
    size: req.body.length,
  });

  await fragment.save();
  await fragment.setData(req.body);

  const location = `${req.protocol}://${req.headers.host}/v1/fragments/${fragment.id}`;

  // Send success response
  res.status(201).location(location).json({
    status: 'ok',
    fragment: {
      id: fragment.id,
      ownerId: fragment.ownerId,
      created: fragment.created,
      updated: fragment.updated,
      type: fragment.type,
      size: fragment.size,
    },
  });
};
