const MemoryDB = require('./memory-db');
const logger = require('../../../logger');

// Create two in-memory databases: one for fragment metadata and the other for raw data
const data = new MemoryDB();
const metadata = new MemoryDB();

logger.info('Initialized in-memory databases for fragments');

/**
 * Write a fragment's metadata to memory db
 * @param {Object} fragment
 * @returns {Promise<void>}
 */
function writeFragment(fragment) {
  const serialized = JSON.stringify(fragment);
  logger.debug({ fragmentId: fragment.id, ownerId: fragment.ownerId }, 'Writing fragment metadata');
  return metadata.put(fragment.ownerId, fragment.id, serialized);
}

/**
 * Read a fragment's metadata from memory db
 * @param {string} ownerId
 * @param {string} id
 * @returns {Promise<Object>}
 */
async function readFragment(ownerId, id) {
  logger.debug({ ownerId, fragmentId: id }, 'Reading fragment metadata');
  const serialized = await metadata.get(ownerId, id);

  if (serialized) {
    logger.debug({ ownerId, fragmentId: id }, 'Fragment metadata found');
    return typeof serialized === 'string' ? JSON.parse(serialized) : serialized;
  } else {
    logger.warn({ ownerId, fragmentId: id }, 'Fragment metadata not found');
    return null;
  }
}

/**
 * Write a fragment's data buffer to memory db
 * @param {string} ownerId
 * @param {string} id
 * @param {Buffer} buffer
 * @returns {Promise<void>}
 */
function writeFragmentData(ownerId, id, buffer) {
  logger.debug({ ownerId, fragmentId: id }, 'Writing fragment data');
  return data.put(ownerId, id, buffer);
}

/**
 * Read a fragment's data buffer from memory db
 * @param {string} ownerId
 * @param {string} id
 * @returns {Promise<Buffer>}
 */
function readFragmentData(ownerId, id) {
  logger.debug({ ownerId, fragmentId: id }, 'Reading fragment data');
  return data.get(ownerId, id);
}

/**
 * List fragments for a given user
 * @param {string} ownerId
 * @param {boolean} expand
 * @returns {Promise<Array>}
 */
async function listFragments(ownerId, expand = false) {
  logger.debug({ ownerId, expand }, 'Listing fragments');
  const fragments = await metadata.query(ownerId);

  if (!fragments || fragments.length === 0) {
    logger.info({ ownerId }, 'No fragments found for user');
    return [];
  }

  const parsedFragments = fragments.map((fragment) => JSON.parse(fragment));

  return expand ? parsedFragments : parsedFragments.map((fragment) => fragment.id);
}

/**
 * Delete a fragment's metadata and data
 * @param {string} ownerId
 * @param {string} id
 * @returns {Promise<void>}
 */
function deleteFragment(ownerId, id) {
  logger.info({ ownerId, fragmentId: id }, 'Deleting fragment metadata and data');
  return Promise.all([
    metadata.del(ownerId, id),
    data.del(ownerId, id),
  ]);
}

// Exported methods
module.exports = {
  listFragments,
  writeFragment,
  readFragment,
  writeFragmentData,
  readFragmentData,
  deleteFragment,
};
