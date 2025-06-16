const { randomUUID } = require('crypto');
const contentType = require('content-type');
const logger = require('../logger');

const supportedTypes = ['text/plain', 'text/markdown', 'text/html', 'application/json'];

const {
  readFragment,
  writeFragment,
  readFragmentData,
  writeFragmentData,
  listFragments,
  deleteFragment,
} = require('./data');

class Fragment {
  constructor({ id, ownerId, created, updated, type, size = 0 }) {
    if (!ownerId) {
      logger.error('ownerId is required to create a Fragment');
      throw new Error('ownerId is required');
    }

    if (!type) {
      logger.error('type is required to create a Fragment');
      throw new Error('type is required');
    }

    if (!Fragment.isSupportedType(type)) {
      logger.error({ type }, 'Unsupported type passed to Fragment constructor');
      throw new Error('Unsupported type');
    }

    if (typeof size !== 'number' || size < 0) {
      logger.error({ size }, 'Invalid size passed to Fragment constructor');
      throw new Error('Invalid size');
    }

    this.id = id || randomUUID();
    this.ownerId = ownerId;
    this.type = type;
    this.size = size;
    this.created = created || new Date().toISOString();
    this.updated = updated || new Date().toISOString();

    logger.debug({ id: this.id, ownerId: this.ownerId, type: this.type }, 'Fragment created');
  }

  static async byUser(ownerId, expand = false) {
    logger.debug({ ownerId, expand }, 'Fetching fragments by user');

    const fragments = await listFragments(ownerId);
    if (!expand) return fragments;

    const results = await Promise.all(
      fragments.map((id) => Fragment.byId(ownerId, id))
    );

    return results;
  }

  static async byId(ownerId, id) {
    logger.debug({ ownerId, id }, 'Fetching fragment by ID');

    const metadata = await readFragment(ownerId, id);
    if (!metadata) {
      logger.warn({ ownerId, id }, 'Fragment not found');
      throw new Error('Fragment not found');
    }

    return new Fragment(metadata);
  }

  static delete(ownerId, id) {
    logger.info({ ownerId, id }, 'Deleting fragment');
    return deleteFragment(ownerId, id);
  }

  save() {
    this.updated = new Date().toISOString();
    logger.info({ id: this.id, ownerId: this.ownerId }, 'Saving fragment metadata');
    return writeFragment(this);
  }

  getData() {
    logger.debug({ id: this.id, ownerId: this.ownerId }, 'Getting fragment data');
    return readFragmentData(this.ownerId, this.id);
  }

  async setData(data) {
    if (!Buffer.isBuffer(data)) {
      logger.error('Attempted to set non-buffer data on fragment');
      throw new Error('Data must be a Buffer');
    }

    this.size = data.length;
    this.updated = new Date().toISOString();

    logger.info({ id: this.id, ownerId: this.ownerId, size: this.size }, 'Setting fragment data');
    await writeFragment(this);
    await writeFragmentData(this.ownerId, this.id, data);
  }

  get mimeType() {
    const { type } = contentType.parse(this.type);
    return type;
  }

  get isText() {
    return this.mimeType.startsWith('text/');
  }

  get formats() {
    return [this.mimeType];
  }

  static isSupportedType(value) {
    try {
      const { type } = contentType.parse(value);
      const isSupported = supportedTypes.includes(type);
      logger.debug({ value, parsedType: type, isSupported }, 'Checking supported type');
      return isSupported;
    } catch (err) {
      logger.warn({ value }, 'Failed to parse content-type');
      logger.debug({ err }, 'Error parsing content-type');
      return false;
    }
  }
}

module.exports.Fragment = Fragment;
