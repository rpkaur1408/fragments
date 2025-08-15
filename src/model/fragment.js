const { randomUUID } = require('crypto');
const contentType = require('content-type');
const logger = require('../logger');
const MarkdownIt = require('markdown-it');
const sharp = require('sharp');
const yaml = require('js-yaml');
const { parse: csvParse } = require('csv-parse/sync');
const { stringify: csvStringify } = require('csv-stringify/sync');

const supportedTypes = [
  // Text types
  'text/plain', 
  'text/markdown', 
  'text/html', 
  'text/csv',
  // Data types
  'application/json',
  'application/yaml',
  // Image types
  'image/png',
  'image/jpeg', 
  'image/webp',
  'image/avif',
  'image/gif'
];

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

  static async delete(ownerId, id) {
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
   * @param {string} extension - The file extension (e.g., '.txt', '.html', '.md', '.png', etc.)
   * @returns {Promise<Buffer>} - The converted data
   */
  async getConvertedInto(extension) {
    const data = await this.getData();
    const ext = extension.toLowerCase();
    
    logger.debug({ from: this.mimeType, to: ext }, 'Converting fragment');
    
    try {
      switch (ext) {
        // TEXT CONVERSIONS
        case '.txt':
          return this._convertToText(data);
          
        case '.html':
          return this._convertToHtml(data);
          
        case '.md':
          return this._convertToMarkdown(data);
          
        // DATA CONVERSIONS
        case '.json':
          return this._convertToJson(data);
          
        case '.yaml':
        case '.yml':
          return this._convertToYaml(data);
          
        case '.csv':
          return this._convertToCsv(data);
          
        // IMAGE CONVERSIONS
        case '.png':
          return this._convertToImage(data, 'png');
          
        case '.jpg':
        case '.jpeg':
          return this._convertToImage(data, 'jpeg');
          
        case '.webp':
          return this._convertToImage(data, 'webp');
          
        case '.gif':
          return this._convertToImage(data, 'gif');
          
        case '.avif':
          return this._convertToImage(data, 'avif');
          
        default:
          throw new Error(`Unsupported conversion to ${extension}`);
      }
    } catch (error) {
      logger.error({ error: error.message, from: this.mimeType, to: ext }, 'Conversion failed');
      throw error;
    }
  }

  // TEXT CONVERSION HELPERS
  _convertToText(data) {
    switch (this.mimeType) {
      case 'text/plain':
        return data;
      
      case 'text/markdown':
      case 'text/html':
      case 'text/csv':
        // Strip markup/formatting for plain text
        const content = data.toString('utf8');
        const cleanText = content.replace(/<[^>]*>/g, '').replace(/[*_`#]/g, '');
        return Buffer.from(cleanText, 'utf8');
      
      case 'application/json':
        const jsonString = data.toString('utf8');
        const parsed = JSON.parse(jsonString);
        return Buffer.from(JSON.stringify(parsed, null, 2), 'utf8');
      
      case 'application/yaml':
        const yamlString = data.toString('utf8');
        const yamlParsed = yaml.load(yamlString);
        return Buffer.from(JSON.stringify(yamlParsed, null, 2), 'utf8');
      
      default:
        throw new Error(`Cannot convert ${this.mimeType} to text`);
    }
  }

  _convertToHtml(data) {
    switch (this.mimeType) {
      case 'text/html':
        return data;
      
      case 'text/markdown':
        const md = new MarkdownIt();
        const markdownContent = data.toString('utf8');
        const htmlContent = md.render(markdownContent);
        return Buffer.from(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Converted Content</title>
</head>
<body>
${htmlContent}
</body>
</html>`, 'utf8');
      
      case 'text/plain':
        const textContent = data.toString('utf8');
        const htmlText = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Plain Text</title>
</head>
<body>
  <pre>${textContent}</pre>
</body>
</html>`;
        return Buffer.from(htmlText, 'utf8');
      
      case 'application/json':
        const jsonString = data.toString('utf8');
        const parsed = JSON.parse(jsonString);
        const formattedJson = JSON.stringify(parsed, null, 2);
        const jsonHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>JSON Data</title>
</head>
<body>
  <pre>${formattedJson}</pre>
</body>
</html>`;
        return Buffer.from(jsonHtml, 'utf8');
      
      default:
        throw new Error(`Cannot convert ${this.mimeType} to HTML`);
    }
  }

  _convertToMarkdown(data) {
    switch (this.mimeType) {
      case 'text/markdown':
        return data;
      
      case 'text/plain':
      case 'text/html':
        // Basic conversion - wrap in code block
        const content = data.toString('utf8');
        const cleanContent = content.replace(/<[^>]*>/g, '');
        return Buffer.from(`\`\`\`\n${cleanContent}\n\`\`\``, 'utf8');
      
      default:
        throw new Error(`Cannot convert ${this.mimeType} to Markdown`);
    }
  }

  _convertToJson(data) {
    switch (this.mimeType) {
      case 'application/json':
        return data;
      
      case 'text/csv':
        const csvString = data.toString('utf8');
        const records = csvParse(csvString, { columns: true });
        return Buffer.from(JSON.stringify(records, null, 2), 'utf8');
      
      case 'application/yaml':
        const yamlString = data.toString('utf8');
        const yamlData = yaml.load(yamlString);
        return Buffer.from(JSON.stringify(yamlData, null, 2), 'utf8');
      
      case 'text/plain':
      case 'text/markdown':
      case 'text/html':
        // Wrap text content as JSON string
        const textContent = data.toString('utf8');
        return Buffer.from(JSON.stringify(textContent), 'utf8');
      
      default:
        throw new Error(`Cannot convert ${this.mimeType} to JSON`);
    }
  }

  _convertToYaml(data) {
    switch (this.mimeType) {
      case 'application/yaml':
        return data;
      
      case 'application/json':
        const jsonString = data.toString('utf8');
        const jsonData = JSON.parse(jsonString);
        const yamlOutput = yaml.dump(jsonData);
        return Buffer.from(yamlOutput, 'utf8');
      
      case 'text/plain':
      case 'text/markdown':
      case 'text/html':
        // Wrap text content as YAML string
        const textContent = data.toString('utf8');
        const yamlText = yaml.dump({ content: textContent });
        return Buffer.from(yamlText, 'utf8');
      
      default:
        throw new Error(`Cannot convert ${this.mimeType} to YAML`);
    }
  }

  _convertToCsv(data) {
    switch (this.mimeType) {
      case 'text/csv':
        return data;
      
      case 'application/json':
        const jsonString = data.toString('utf8');
        const jsonData = JSON.parse(jsonString);
        
        // Handle array of objects
        if (Array.isArray(jsonData) && jsonData.length > 0 && typeof jsonData[0] === 'object') {
          const csvOutput = csvStringify(jsonData, { header: true });
          return Buffer.from(csvOutput, 'utf8');
        }
        
        // Handle single object
        if (typeof jsonData === 'object' && !Array.isArray(jsonData)) {
          const csvOutput = csvStringify([jsonData], { header: true });
          return Buffer.from(csvOutput, 'utf8');
        }
        
        throw new Error('JSON data must be an object or array of objects for CSV conversion');
      
      case 'text/plain':
        // Convert plain text to simple CSV
        const lines = data.toString('utf8').split('\n');
        const csvData = lines.map(line => [line]);
        const csvOutput = csvStringify(csvData);
        return Buffer.from(csvOutput, 'utf8');
      
      default:
        throw new Error(`Cannot convert ${this.mimeType} to CSV`);
    }
  }

  async _convertToImage(data, format) {
    // Only allow image-to-image conversions
    if (!this.mimeType.startsWith('image/')) {
      throw new Error(`Cannot convert ${this.mimeType} to image format`);
    }

    try {
      const convertedBuffer = await sharp(data)
        .toFormat(format)
        .toBuffer();
      
      return convertedBuffer;
    } catch (error) {
      throw new Error(`Failed to convert image to ${format}: ${error.message}`);
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
