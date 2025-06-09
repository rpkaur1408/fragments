// tests/unit/memory.test.js

const {
  writeFragment,
  readFragment,
  writeFragmentData,
  readFragmentData,
} = require('../../src/model/data/memory/index.js');

describe('In-Memory Fragment Data Functions', () => {
  const ownerId = 'user@example.com';
  const fragmentId = 'frag123';
  const metadata = {
    id: fragmentId,
    ownerId,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    type: 'text/plain',
    size: 18,
  };

  const content = Buffer.from('This is a test.');

  test('writeFragment() stores metadata as JSON', async () => {
    await writeFragment(metadata);
    const result = await readFragment(ownerId, fragmentId);
    expect(result).toEqual(metadata);
  });

  test('readFragment() returns null for nonexistent entry', async () => {
    const result = await readFragment(ownerId, 'nonexistent');
    expect(result).toBeUndefined();
  });

  test('writeFragmentData() and readFragmentData() store and return a buffer', async () => {
    await writeFragmentData(ownerId, fragmentId, content);
    const result = await readFragmentData(ownerId, fragmentId);
    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result).toEqual(content);
  });

  test('readFragmentData() returns undefined for nonexistent data', async () => {
    const result = await readFragmentData(ownerId, 'nonexistent');
    expect(result).toBeUndefined();
  });
});
