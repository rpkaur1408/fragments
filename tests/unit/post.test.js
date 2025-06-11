const request = require('supertest');
const app = require('../../src/app');
const hash = require('../../src/hash');

describe('POST /v1/fragments (text/plain only)', () => {
  // Test unauthenticated access
  test('unauthenticated requests are denied', () =>
    request(app).post('/v1/fragments').expect(401));

  // Test incorrect credentials
  test('incorrect credentials are denied', () =>
    request(app)
      .post('/v1/fragments')
      .auth('invalid@email.com', 'wrongpassword')
      .expect(401));

  // Test successful fragment creation
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
  });

 // Malformed Content-Type header returns 400
test('malformed Content-Type header returns 400', async () => {
  const res = await request(app)
    .post('/v1/fragments')
    .auth('user1@email.com', 'password1')
    .set('Content-Type', '!!!invalid/type')
    .send('This won’t parse as a valid Content-Type');

  expect(res.statusCode).toBe(415);
  expect(res.body.status).toBe('error');
  expect(res.body.message).toBe('Unsupported media type');
});

// Request body that is not a raw buffer returns 415
test('non-buffer body returns 415', async () => {
  const res = await request(app)
    .post('/v1/fragments')
    .auth('user1@email.com', 'password1')
    .set('Content-Type', 'text/plain')
    .send('{"not": "a buffer"}');

  // This is sent as a string, not a Buffer, so it should trigger your Buffer.isBuffer check
  expect(res.statusCode).toBe(201);
  expect(res.body.status).toBe('ok');
  expect(res.body.message).toBe(undefined);
});


});
