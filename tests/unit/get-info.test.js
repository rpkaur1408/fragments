const request = require('supertest');
const app = require('../../src/app');
const hash = require('../../src/hash');
const { Fragment } = require('../../src/model/fragment');

describe('GET /v1/fragments/:id/info', () => {
  let fragmentId;
  let ownerId;
  let fragmentMeta;

  beforeEach(async () => {
    ownerId = hash('user1@email.com');
    // Create a test fragment
    const fragment = new Fragment({
      ownerId,
      type: 'text/plain',
      size: 0,
    });
    await fragment.save();
    await fragment.setData(Buffer.from('Meta test fragment!'));
    fragmentId = fragment.id;
    fragmentMeta = fragment;
  });

  test('unauthenticated requests are denied', () =>
    request(app).get(`/v1/fragments/${fragmentId}/info`).expect(401));

  test('incorrect credentials are denied', () =>
    request(app)
      .get(`/v1/fragments/${fragmentId}/info`)
      .auth('invalid@email.com', 'wrongpassword')
      .expect(401));

  test('authenticated user gets fragment metadata', async () => {
    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}/info`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment).toMatchObject({
      id: fragmentMeta.id,
      ownerId: fragmentMeta.ownerId,
      type: fragmentMeta.type,
      size: fragmentMeta.size,
    });
    expect(res.body.fragment).toHaveProperty('created');
    expect(res.body.fragment).toHaveProperty('updated');
  });

  test('non-existent fragment returns 404', async () => {
    const fakeId = '12345678-1234-1234-1234-123456789012';
    const res = await request(app)
      .get(`/v1/fragments/${fakeId}/info`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toContain('No fragment with ID');
  });

  test('user cannot access another user\'s fragment metadata', async () => {
    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}/info`)
      .auth('user2@email.com', 'password2');

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
  });
}); 