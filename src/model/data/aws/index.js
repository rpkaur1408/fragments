// XXX: temporary use of memory-db until we add DynamoDB
const MemoryDB = require('../memory/memory-db');
const logger = require('../../../logger');
const s3Client = require('./s3Client');
const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');

// Create two in-memory databases: one for fragment metadata and the other for raw data

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
// Writes a fragment's data to an S3 Object in a Bucket
// https://github.com/awsdocs/aws-sdk-for-javascript-v3/blob/main/doc_source/s3-example-creating-buckets.md#upload-an-existing-object-to-an-amazon-s3-bucket
async function writeFragmentData(ownerId, id, data) {
  // Create the PUT API params from our details
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    // Our key will be a mix of the ownerID and fragment id, written as a path
    Key: `${ownerId}/${id}`,
    Body: data,
  };

  // Create a PUT Object command to send to S3
  const command = new PutObjectCommand(params);

  try {
    // Use our client to send the command
    await s3Client.send(command);
  } catch (err) {
    // If anything goes wrong, log enough info that we can debug
    const { Bucket, Key } = params;
    logger.error({ err, Bucket, Key }, 'Error uploading fragment data to S3');
    throw new Error('unable to upload fragment data');
  }
}

/**
 * Read a fragment's data buffer from memory db
 * @param {string} ownerId
 * @param {string} id
 * @returns {Promise<Buffer>}
 */
// Convert a stream of data into a Buffer, by collecting
// chunks of data until finished, then assembling them together.
// We wrap the whole thing in a Promise so it's easier to consume.
const streamToBuffer = (stream) =>
  new Promise((resolve, reject) => {
    // As the data streams in, we'll collect it into an array.
    const chunks = [];

    // Streams have events that we can listen for and run
    // code.  We need to know when new `data` is available,
    // if there's an `error`, and when we're at the `end`
    // of the stream.

    // When there's data, add the chunk to our chunks list
    stream.on('data', (chunk) => chunks.push(chunk));
    // When there's an error, reject the Promise
    stream.on('error', reject);
    // When the stream is done, resolve with a new Buffer of our chunks
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });

// Reads a fragment's data from S3 and returns (Promise<Buffer>)
// https://github.com/awsdocs/aws-sdk-for-javascript-v3/blob/main/doc_source/s3-example-creating-buckets.md#getting-a-file-from-an-amazon-s3-bucket
async function readFragmentData(ownerId, id) {
  // Create the PUT API params from our details
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    // Our key will be a mix of the ownerID and fragment id, written as a path
    Key: `${ownerId}/${id}`,
  };

  // Create a GET Object command to send to S3
  const command = new GetObjectCommand(params);

  try {
    // Get the object from the Amazon S3 bucket. It is returned as a ReadableStream.
    const data = await s3Client.send(command);
    // Convert the ReadableStream to a Buffer
    return streamToBuffer(data.Body);
  } catch (err) {
    const { Bucket, Key } = params;
    logger.error({ err, Bucket, Key }, 'Error streaming fragment data from S3');
    throw new Error('unable to read fragment data');
  }
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
async function deleteFragment(ownerId, id) {
  logger.info({ ownerId, fragmentId: id }, 'Deleting fragment metadata and data');
  
  // Delete metadata from memory db
  const metadataPromise = metadata.del(ownerId, id);
  
  // Delete data from S3
  const s3Params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${ownerId}/${id}`,
  };
  
  const s3Command = new DeleteObjectCommand(s3Params);
  
  try {
    // Delete from S3
    await s3Client.send(s3Command);
    logger.debug({ ownerId, fragmentId: id }, 'Fragment data deleted from S3');
  } catch (err) {
    const { Bucket, Key } = s3Params;
    logger.error({ err, Bucket, Key }, 'Error deleting fragment data from S3');
    // Don't throw error here as we still want to delete metadata
    // S3 might return 404 if object doesn't exist, which is fine for deletion
  }
  
  // Wait for metadata deletion to complete
  await metadataPromise;
  
  logger.info({ ownerId, fragmentId: id }, 'Fragment metadata and data deleted successfully');
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
