const { Fragment } = require('../../src/model/fragment');
const fs = require('fs');
const path = require('path');

describe('Fragment conversions', () => {
  const ownerId = 'user1@example.com';

  // Mock data for testing
  const testData = {
    text: 'Hello, world!',
    markdown: '# Hello\n\nThis is **bold** text.',
    html: '<h1>Hello</h1><p>This is <strong>bold</strong> text.</p>',
    json: JSON.stringify({ message: 'Hello', count: 42 }),
    yaml: 'message: Hello\ncount: 42\n',
    csv: 'name,age,city\nJohn,30,Toronto\nJane,25,Montreal\n'
  };

  describe('Text conversions', () => {
    test('text/plain to .txt returns same content', async () => {
      const fragment = new Fragment({
        ownerId,
        type: 'text/plain'
      });
      
      await fragment.setData(Buffer.from(testData.text));
      const converted = await fragment.getConvertedInto('.txt');
      
      expect(converted.toString()).toBe(testData.text);
    });

    test('text/markdown to .html converts to HTML', async () => {
      const fragment = new Fragment({
        ownerId,
        type: 'text/markdown'
      });
      
      await fragment.setData(Buffer.from(testData.markdown));
      const converted = await fragment.getConvertedInto('.html');
      const result = converted.toString();
      
      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('<h1>Hello</h1>');
      expect(result).toContain('<strong>bold</strong>');
    });

    test('text/markdown to .txt strips formatting', async () => {
      const fragment = new Fragment({
        ownerId,
        type: 'text/markdown'
      });
      
      await fragment.setData(Buffer.from(testData.markdown));
      const converted = await fragment.getConvertedInto('.txt');
      const result = converted.toString();
      
      expect(result).not.toContain('#');
      expect(result).not.toContain('**');
      expect(result).toContain('Hello');
      expect(result).toContain('bold');
    });

    test('text/html to .txt strips HTML tags', async () => {
      const fragment = new Fragment({
        ownerId,
        type: 'text/html'
      });
      
      await fragment.setData(Buffer.from(testData.html));
      const converted = await fragment.getConvertedInto('.txt');
      const result = converted.toString();
      
      expect(result).not.toContain('<h1>');
      expect(result).not.toContain('<strong>');
      expect(result).toContain('Hello');
      expect(result).toContain('bold');
    });

    test('text/plain to .html wraps in HTML structure', async () => {
      const fragment = new Fragment({
        ownerId,
        type: 'text/plain'
      });
      
      await fragment.setData(Buffer.from(testData.text));
      const converted = await fragment.getConvertedInto('.html');
      const result = converted.toString();
      
      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('<pre>');
      expect(result).toContain(testData.text);
    });
  });

  describe('Data conversions', () => {
    test('application/json to .yaml converts to YAML', async () => {
      const fragment = new Fragment({
        ownerId,
        type: 'application/json'
      });
      
      await fragment.setData(Buffer.from(testData.json));
      const converted = await fragment.getConvertedInto('.yaml');
      const result = converted.toString();
      
      expect(result).toContain('message: Hello');
      expect(result).toContain('count: 42');
    });

    test('application/yaml to .json converts to JSON', async () => {
      const fragment = new Fragment({
        ownerId,
        type: 'application/yaml'
      });
      
      await fragment.setData(Buffer.from(testData.yaml));
      const converted = await fragment.getConvertedInto('.json');
      const result = converted.toString();
      
      const parsed = JSON.parse(result);
      expect(parsed.message).toBe('Hello');
      expect(parsed.count).toBe(42);
    });

    test('text/csv to .json converts to JSON array', async () => {
      const fragment = new Fragment({
        ownerId,
        type: 'text/csv'
      });
      
      await fragment.setData(Buffer.from(testData.csv));
      const converted = await fragment.getConvertedInto('.json');
      const result = converted.toString();
      
      const parsed = JSON.parse(result);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].name).toBe('John');
      expect(parsed[1].name).toBe('Jane');
    });

    test('application/json to .csv converts array to CSV', async () => {
      const jsonArray = [
        { name: 'John', age: 30, city: 'Toronto' },
        { name: 'Jane', age: 25, city: 'Montreal' }
      ];
      
      const fragment = new Fragment({
        ownerId,
        type: 'application/json'
      });
      
      await fragment.setData(Buffer.from(JSON.stringify(jsonArray)));
      const converted = await fragment.getConvertedInto('.csv');
      const result = converted.toString();
      
      expect(result).toContain('name,age,city');
      expect(result).toContain('John,30,Toronto');
      expect(result).toContain('Jane,25,Montreal');
    });

    test('text/plain to .json wraps as JSON string', async () => {
      const fragment = new Fragment({
        ownerId,
        type: 'text/plain'
      });
      
      await fragment.setData(Buffer.from(testData.text));
      const converted = await fragment.getConvertedInto('.json');
      const result = converted.toString();
      
      const parsed = JSON.parse(result);
      expect(parsed).toBe(testData.text);
    });
  });

  describe('Conversion validation', () => {
    test('unsupported conversion throws error', async () => {
      const fragment = new Fragment({
        ownerId,
        type: 'text/plain'
      });
      
      await fragment.setData(Buffer.from(testData.text));
      
      await expect(fragment.getConvertedInto('.mp4')).rejects.toThrow();
    });

    test('invalid text-to-image conversion throws error', async () => {
      const fragment = new Fragment({
        ownerId,
        type: 'text/plain'
      });
      
      await fragment.setData(Buffer.from(testData.text));
      
      await expect(fragment.getConvertedInto('.png')).rejects.toThrow(/Cannot convert.*to image/);
    });

    test('conversion maintains data integrity', async () => {
      const fragment = new Fragment({
        ownerId,
        type: 'application/json'
      });
      
      await fragment.setData(Buffer.from(testData.json));
      const converted = await fragment.getConvertedInto('.json');
      
      expect(converted.toString()).toBe(testData.json);
    });
  });

  describe('Edge cases', () => {
    test('empty content conversions', async () => {
      const fragment = new Fragment({
        ownerId,
        type: 'text/plain'
      });
      
      await fragment.setData(Buffer.from(''));
      const converted = await fragment.getConvertedInto('.txt');
      
      expect(converted.toString()).toBe('');
    });

    test('special characters in conversions', async () => {
      const specialText = 'Hello "world" & <test>';
      const fragment = new Fragment({
        ownerId,
        type: 'text/plain'
      });
      
      await fragment.setData(Buffer.from(specialText));
      const converted = await fragment.getConvertedInto('.json');
      const result = JSON.parse(converted.toString());
      
      expect(result).toBe(specialText);
    });

    test('large content conversions', async () => {
      const largeText = 'Hello world! '.repeat(1000);
      const fragment = new Fragment({
        ownerId,
        type: 'text/plain'
      });
      
      await fragment.setData(Buffer.from(largeText));
      const converted = await fragment.getConvertedInto('.html');
      
      expect(converted.toString()).toContain(largeText);
      expect(converted.toString()).toContain('<!DOCTYPE html>');
    });
  });
});
