const request = require('supertest');
const app = require('../../src/app');
const { Fragment } = require('../../src/model/fragment');

describe('PUT /v1/fragments/:id', () => {
  // Create a valid user for testing
  const validUser = 'user1@email.com';

  beforeEach(async () => {
    // Clean up any existing fragments
    await Fragment.delete(validUser, 'test-id').catch(() => {});
  });

  test('authenticated user can update existing fragment with same content type', async () => {
    // First create a fragment
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(validUser, 'password1')
      .set('Content-Type', 'text/plain')
      .send('Original content');

    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;

    // Now update it
    const putRes = await request(app)
      .put(`/v1/fragments/${fragmentId}`)
      .auth(validUser, 'password1')
      .set('Content-Type', 'text/plain')
      .send('Updated content');

    expect(putRes.statusCode).toBe(200);
    expect(putRes.body.status).toBe('ok');
    expect(putRes.body.fragment).toEqual({
      id: fragmentId,
      ownerId: expect.any(String),
      created: expect.any(String),
      updated: expect.any(String),
      type: 'text/plain',
      size: 15 // 'Updated content'.length
    });

    // Verify updated timestamp is different
    expect(putRes.body.fragment.updated).not.toBe(postRes.body.fragment.updated);

    // Verify the content was actually updated
    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth(validUser, 'password1');

    expect(getRes.statusCode).toBe(200);
    expect(getRes.text).toBe('Updated content');
  });

  test('returns 404 for non-existent fragment', async () => {
    const res = await request(app)
      .put('/v1/fragments/non-existent-id')
      .auth(validUser, 'password1')
      .set('Content-Type', 'text/plain')
      .send('Some content');

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toMatch(/does not exist/);
  });

  test('returns 400 when trying to change fragment type', async () => {
    // Create a text/plain fragment
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(validUser, 'password1')
      .set('Content-Type', 'text/plain')
      .send('Original content');

    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;

    // Try to update with different content type
    const putRes = await request(app)
      .put(`/v1/fragments/${fragmentId}`)
      .auth(validUser, 'password1')
      .set('Content-Type', 'application/json')
      .send('{"key": "value"}');

    expect(putRes.statusCode).toBe(400);
    expect(putRes.body.status).toBe('error');
    expect(putRes.body.error.message).toMatch(/type cannot be changed/);
  });

  test('returns 415 for missing Content-Type header', async () => {
    // Create a fragment first
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(validUser, 'password1')
      .set('Content-Type', 'text/plain')
      .send('Original content');

    const fragmentId = postRes.body.fragment.id;

    // Try to update without Content-Type header - Express middleware rejects this with 415
    const putRes = await request(app)
      .put(`/v1/fragments/${fragmentId}`)
      .auth(validUser, 'password1')
      .send('Updated content');

    expect(putRes.statusCode).toBe(415);
    expect(putRes.body.status).toBe('error');
  });

  test('returns 415 for unsupported Content-Type', async () => {
    // Create a fragment first
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(validUser, 'password1')
      .set('Content-Type', 'text/plain')
      .send('Original content');

    const fragmentId = postRes.body.fragment.id;

    // Try to update with unsupported content type
    const putRes = await request(app)
      .put(`/v1/fragments/${fragmentId}`)
      .auth(validUser, 'password1')
      .set('Content-Type', 'video/mp4')
      .send('some binary data');

    expect(putRes.statusCode).toBe(415);
    expect(putRes.body.status).toBe('error');
    expect(putRes.body.error.message).toMatch(/Unsupported Content-Type/);
  });

  test('returns 400 for empty request body', async () => {
    // Create a fragment first
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(validUser, 'password1')
      .set('Content-Type', 'text/plain')
      .send('Original content');

    const fragmentId = postRes.body.fragment.id;

    // Try to update with empty body
    const putRes = await request(app)
      .put(`/v1/fragments/${fragmentId}`)
      .auth(validUser, 'password1')
      .set('Content-Type', 'text/plain')
      .send('');

    expect(putRes.statusCode).toBe(400);
    expect(putRes.body.status).toBe('error');
    expect(putRes.body.error.message).toMatch(/cannot be empty/);
  });

  test('returns 401 for unauthenticated requests', async () => {
    const res = await request(app)
      .put('/v1/fragments/some-id')
      .set('Content-Type', 'text/plain')
      .send('Some content');

    expect(res.statusCode).toBe(401);
  });

  test('can update JSON fragment', async () => {
    const originalData = { message: 'original' };
    const updatedData = { message: 'updated', count: 42 };

    // Create JSON fragment
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(validUser, 'password1')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(originalData));

    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;

    // Update JSON fragment
    const putRes = await request(app)
      .put(`/v1/fragments/${fragmentId}`)
      .auth(validUser, 'password1')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(updatedData));

    expect(putRes.statusCode).toBe(200);
    expect(putRes.body.fragment.size).toBe(JSON.stringify(updatedData).length);

    // Verify content was updated
    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth(validUser, 'password1');

    expect(getRes.statusCode).toBe(200);
    expect(JSON.parse(getRes.text)).toEqual(updatedData);
  });
});
