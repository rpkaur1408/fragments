const { randomUUID } = require('crypto');
const contentType = require('content-type');
const logger = require('../logger');
const MarkdownIt = require('markdown-it');

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

  /**
   * Convert fragment to a different format based on file extension
   * @param {string} extension - The file extension (e.g., '.txt', '.html', '.md')
   * @returns {Promise<Buffer>} - The converted data
   */
  async getConvertedInto(extension) {
    const data = await this.getData();
    
    switch (extension.toLowerCase()) {
      case '.txt':
        if (this.mimeType === 'text/plain') {
          return data;
        }
        if (this.mimeType === 'text/markdown') {
          // For now, just return the raw data as text
          // In a real implementation, you might want to strip markdown formatting
          return data;
        }
        if (this.mimeType === 'text/html') {
          // Strip HTML tags for plain text conversion
          const htmlString = data.toString('utf8');
          const textContent = htmlString.replace(/<[^>]*>/g, '');
          return Buffer.from(textContent, 'utf8');
        }
        if (this.mimeType === 'application/json') {
          // Convert JSON to readable text
          const jsonString = data.toString('utf8');
          const parsed = JSON.parse(jsonString);
          return Buffer.from(JSON.stringify(parsed, null, 2), 'utf8');
        }
        throw new Error('Cannot convert to plain text');
        
      case '.html':
        if (this.mimeType === 'text/html') {
          return data;
        }
        if (this.mimeType === 'text/markdown') {
          // Use markdown-it for proper Markdown to HTML conversion
          const md = new MarkdownIt();
          const markdownContent = data.toString('utf8');
          const htmlContent = md.render(markdownContent);
          const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Converted Markdown</title>
</head>
<body>
${htmlContent}
</body>
</html>`;
          return Buffer.from(fullHtml, 'utf8');
        }
        if (this.mimeType === 'text/plain') {
          // Convert plain text to HTML
          const textContent = data.toString('utf8');
          const htmlContent = `<html><body><pre>${textContent}</pre></body></html>`;
          return Buffer.from(htmlContent, 'utf8');
        }
        if (this.mimeType === 'application/json') {
          // Convert JSON to formatted HTML
          const jsonString = data.toString('utf8');
          const parsed = JSON.parse(jsonString);
          const formattedJson = JSON.stringify(parsed, null, 2);
          const htmlContent = `<html><body><pre>${formattedJson}</pre></body></html>`;
          return Buffer.from(htmlContent, 'utf8');
        }
        throw new Error('Cannot convert to HTML');
        
      case '.md':
        if (this.mimeType === 'text/markdown') {
          return data;
        }
        if (this.mimeType === 'text/plain') {
          // Convert plain text to markdown (just wrap in code block)
          const textContent = data.toString('utf8');
          const markdownContent = `\`\`\`\n${textContent}\n\`\`\``;
          return Buffer.from(markdownContent, 'utf8');
        }
        if (this.mimeType === 'text/html') {
          // Convert HTML to markdown (basic conversion)
          const htmlString = data.toString('utf8');
          const textContent = htmlString.replace(/<[^>]*>/g, '');
          const markdownContent = `\`\`\`\n${textContent}\n\`\`\``;
          return Buffer.from(markdownContent, 'utf8');
        }
        throw new Error('Cannot convert to Markdown');
        
      case '.json':
        if (this.mimeType === 'application/json') {
          return data;
        }
        if (this.mimeType === 'text/plain') {
          // Try to parse as JSON, if it fails, wrap in quotes
          const textContent = data.toString('utf8');
          try {
            JSON.parse(textContent);
            return data; // Already valid JSON
          } catch {
            // Wrap in quotes to make it a valid JSON string
            return Buffer.from(JSON.stringify(textContent), 'utf8');
          }
        }
        if (this.mimeType === 'text/markdown' || this.mimeType === 'text/html') {
          // Convert to JSON by wrapping content in quotes
          const content = data.toString('utf8');
          return Buffer.from(JSON.stringify(content), 'utf8');
        }
        throw new Error('Cannot convert to JSON');
        
      default:
        throw new Error(`Unsupported conversion to ${extension}`);
    }
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
