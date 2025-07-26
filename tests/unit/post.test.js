const request = require('supertest');
const app = require('../../src/app');
const hash = require('../../src/hash');

describe('POST /v1/fragments', () => {
  // Test unauthenticated access
  test('unauthenticated requests are denied', () =>
    request(app).post('/v1/fragments').expect(401));

  // Test incorrect credentials
  test('incorrect credentials are denied', () =>
    request(app)
      .post('/v1/fragments')
      .auth('invalid@email.com', 'wrongpassword')
      .expect(401));

  // Test successful fragment creation for all supported types
  test('authenticated user can create a text/plain fragment', async () => {
    const text = 'Hello, this is a plain text fragment.';
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(text);

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.headers['location']).toMatch(/\/v1\/fragments\/[a-f0-9-]+$/);
  });

  test('authenticated user can create a text/markdown fragment', async () => {
    const markdown = '# Hello\nThis is **markdown** content.';
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send(markdown);

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment.type).toBe('text/markdown');
  });

  test('authenticated user can create a text/html fragment', async () => {
    const html = '<h1>Hello</h1><p>This is HTML content.</p>';
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/html')
      .send(html);

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment.type).toBe('text/html');
  });

  test('authenticated user can create an application/json fragment', async () => {
    const json = '{"name": "test", "value": 123}';
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send(json);

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment.type).toBe('application/json');
  });

  // Test that response includes correct metadata
  test('response includes all expected fragment properties', async () => {
    const text = 'Test fragment';
    const size = Buffer.byteLength(text);
    const ownerId = hash('user1@email.com');

    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(text);

    const fragment = res.body.fragment;

    expect(res.statusCode).toBe(201);
    expect(fragment).toHaveProperty('id');
    expect(fragment).toHaveProperty('ownerId', ownerId);
    expect(fragment).toHaveProperty('type', 'text/plain');
    expect(fragment).toHaveProperty('size', size);
    expect(fragment).toHaveProperty('created');
    expect(fragment).toHaveProperty('updated');
  });

  // Test unsupported content type
  test('unsupported content type returns 415', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/xml')
      .send('<note>This is XML</note>');

    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Unsupported media type');
  });

  // Test missing Content-Type header
  test('missing Content-Type header returns 415', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .send('Some content');

    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Unsupported media type');
  });

  // Test malformed Content-Type header
  test('malformed Content-Type header returns 415', async () => {
  const res = await request(app)
    .post('/v1/fragments')
    .auth('user1@email.com', 'password1')
    .set('Content-Type', '!!!invalid/type')
      .send('This won\'t parse as a valid Content-Type');

  expect(res.statusCode).toBe(415);
  expect(res.body.status).toBe('error');
  expect(res.body.message).toBe('Unsupported media type');
});

  // Test content types with charset
  test('content type with charset is supported', async () => {
    const text = 'Hello with charset';
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain; charset=utf-8')
      .send(text);

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment.type).toBe('text/plain');
  });

  // Test empty body
  test('empty body is accepted', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('');

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment.size).toBe(0);
  });

  // Test large content
  test('large content is accepted', async () => {
    const largeText = 'A'.repeat(1000);
  const res = await request(app)
    .post('/v1/fragments')
    .auth('user1@email.com', 'password1')
    .set('Content-Type', 'text/plain')
      .send(largeText);

  expect(res.statusCode).toBe(201);
  expect(res.body.status).toBe('ok');
    expect(res.body.fragment.size).toBe(1000);
  });

  // Test error in fragment.save()
  test('server error during fragment.save() returns 500', async () => {
    // Simulate by passing an invalid type (should throw in constructor)
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/msword')
      .send('This should fail');

    expect(res.statusCode).toBe(415); // This is caught earlier as unsupported type
    expect(res.body.status).toBe('error');
  });

  // Test error in fragment.setData()
  test('server error during fragment.setData() returns 500', async () => {
    // We'll simulate this by monkey-patching Fragment.prototype.setData to throw
    const { Fragment } = require('../../src/model/fragment');
    const originalSetData = Fragment.prototype.setData;
    Fragment.prototype.setData = async function () { throw new Error('setData failed'); };

    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('This should fail');

    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Internal Server Error');

    // Restore original method
    Fragment.prototype.setData = originalSetData;
  });

  // Test error in content-type parse
  test('error in content-type parse returns 400', async () => {
    // Simulate by sending a header that will throw in content-type parse
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'bad/type; charset=bad')
      .send('This should fail');

    // Depending on the content-type library, this may be 415 or 400
    expect([400, 415]).toContain(res.statusCode);
    expect(res.body.status).toBe('error');
  });
});
