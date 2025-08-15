const { Fragment } = require('../../src/model/fragment');

describe('Fragment supported types', () => {
  // Valid owner and basic properties for testing
  const validFragment = {
    ownerId: 'user1@example.com',
    type: 'text/plain',
    size: 0
  };

  describe('text types', () => {
    test('supports text/plain', () => {
      expect(Fragment.isSupportedType('text/plain')).toBe(true);
      expect(() => new Fragment({ ...validFragment, type: 'text/plain' })).not.toThrow();
    });

    test('supports text/markdown', () => {
      expect(Fragment.isSupportedType('text/markdown')).toBe(true);
      expect(() => new Fragment({ ...validFragment, type: 'text/markdown' })).not.toThrow();
    });

    test('supports text/html', () => {
      expect(Fragment.isSupportedType('text/html')).toBe(true);
      expect(() => new Fragment({ ...validFragment, type: 'text/html' })).not.toThrow();
    });

    test('supports text/csv', () => {
      expect(Fragment.isSupportedType('text/csv')).toBe(true);
      expect(() => new Fragment({ ...validFragment, type: 'text/csv' })).not.toThrow();
    });
  });

  describe('data types', () => {
    test('supports application/json', () => {
      expect(Fragment.isSupportedType('application/json')).toBe(true);
      expect(() => new Fragment({ ...validFragment, type: 'application/json' })).not.toThrow();
    });

    test('supports application/yaml', () => {
      expect(Fragment.isSupportedType('application/yaml')).toBe(true);
      expect(() => new Fragment({ ...validFragment, type: 'application/yaml' })).not.toThrow();
    });
  });

  describe('image types', () => {
    test('supports image/png', () => {
      expect(Fragment.isSupportedType('image/png')).toBe(true);
      expect(() => new Fragment({ ...validFragment, type: 'image/png' })).not.toThrow();
    });

    test('supports image/jpeg', () => {
      expect(Fragment.isSupportedType('image/jpeg')).toBe(true);
      expect(() => new Fragment({ ...validFragment, type: 'image/jpeg' })).not.toThrow();
    });

    test('supports image/webp', () => {
      expect(Fragment.isSupportedType('image/webp')).toBe(true);
      expect(() => new Fragment({ ...validFragment, type: 'image/webp' })).not.toThrow();
    });

    test('supports image/avif', () => {
      expect(Fragment.isSupportedType('image/avif')).toBe(true);
      expect(() => new Fragment({ ...validFragment, type: 'image/avif' })).not.toThrow();
    });

    test('supports image/gif', () => {
      expect(Fragment.isSupportedType('image/gif')).toBe(true);
      expect(() => new Fragment({ ...validFragment, type: 'image/gif' })).not.toThrow();
    });
  });

  describe('unsupported types', () => {
    test('rejects video/mp4', () => {
      expect(Fragment.isSupportedType('video/mp4')).toBe(false);
      expect(() => new Fragment({ ...validFragment, type: 'video/mp4' })).toThrow();
    });

    test('rejects audio/mp3', () => {
      expect(Fragment.isSupportedType('audio/mp3')).toBe(false);
      expect(() => new Fragment({ ...validFragment, type: 'audio/mp3' })).toThrow();
    });

    test('rejects application/pdf', () => {
      expect(Fragment.isSupportedType('application/pdf')).toBe(false);
      expect(() => new Fragment({ ...validFragment, type: 'application/pdf' })).toThrow();
    });
  });

  describe('content-type with charset', () => {
    test('supports text/plain with charset', () => {
      expect(Fragment.isSupportedType('text/plain; charset=utf-8')).toBe(true);
      expect(() => new Fragment({ ...validFragment, type: 'text/plain; charset=utf-8' })).not.toThrow();
    });

    test('supports application/json with charset', () => {
      expect(Fragment.isSupportedType('application/json; charset=utf-8')).toBe(true);
      expect(() => new Fragment({ ...validFragment, type: 'application/json; charset=utf-8' })).not.toThrow();
    });
  });
});
