// src/routes/api/v1/post.js
const { Fragment } = require('../../../model/fragment');
const contentType = require('content-type');

module.exports = async (req, res) => {
  // Get the owner/user ID from the authenticated request
  const ownerId = req.user;

  let type;
  try {
    ({ type } = contentType.parse(req));
  } catch (err) {
    console.error('Invalid Content-Type:', err.message);
    return res.status(415).json({ error: 'Invalid or missing Content-Type' });
  }

  if (!Buffer.isBuffer(req.body) || !Fragment.isSupportedType(type)) {
    return res.status(415).json({ error: 'Unsupported content type or empty body' });
  }

  try {
    const fragment = new Fragment({
      ownerId,
      type,
      size: req.body.length,
    });

    await fragment.save();
    await fragment.setData(req.body);

    const baseUrl = process.env.API_URL || `http://${req.headers.host}`;
    const location = new URL(`/v1/fragments/${fragment.id}`, baseUrl);

    res.setHeader('Location', location.href);
    res.status(201).json({
      status: 'ok',
      fragment: {
        id: fragment.id,
        type: fragment.type,
        size: fragment.size,
        ownerId: fragment.ownerId,
        created: fragment.created,
        updated: fragment.updated,
      },
    });
  } catch (err) {
    console.error('Error saving fragment:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
