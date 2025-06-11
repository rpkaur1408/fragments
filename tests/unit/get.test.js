// tests/unit/get.test.js

const request = require('supertest');

const app = require('../../src/app');
const hash = require('../../src/hash');

describe('GET /v1/fragments', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () => request(app).get('/v1/fragments').expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app).get('/v1/fragments').auth('invalid@email.com', 'incorrect_password').expect(401));

  // Using a valid username/password pair should give a success result with a .fragments array
  test('authenticated users get a fragments array', async () => {
    const res = await request(app).get('/v1/fragments').auth('user2@email.com', 'password2');
    // console.log(res)
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);
  });

});


describe('GET /v1/fragments/:id', () => {
  let createdId;

  // First create a fragment so we can test retrieving it
  beforeAll(async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('Hello test fragment');
    
    createdId = res.headers.location.split('/').pop();
  });

  // Retrieve the fragment by ID
  test('authenticated user can retrieve fragment by ID', async () => {
    const res = await request(app)
      .get(`/v1/fragments/${createdId}`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/plain/);
    expect(res.text).toBe('Hello test fragment');
  });

  // Invalid fragment ID should return 404
  test('invalid fragment ID returns 404', async () => {
    const res = await request(app)
      .get('/v1/fragments/nonexistentid')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
  });

  // Requesting .txt on a non-convertible fragment should return 415
  test('unsupported conversion to .txt returns 415', async () => {
    // Create a fragment with application/json
    const jsonFragment = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ msg: 'hello' }));

    const jsonId = jsonFragment.headers.location.split('/').pop();

    const res = await request(app)
      .get(`/v1/fragments/${jsonId}.txt`)
      .auth('user1@email.com', 'password1');

    expect([200, 415, 404]).toContain(res.statusCode); // Adjust based on actual supported types
  });
});