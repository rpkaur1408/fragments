// tests/unit/get.test.js

const request = require('supertest');
const app = require('../../src/app');
const hash = require('../../src/hash');
const { Fragment } = require('../../src/model/fragment');


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
  let fragmentId;
  let ownerId;

  beforeEach(async () => {
    ownerId = hash('user1@email.com');
    
    // Create a test fragment
    const fragment = new Fragment({
      ownerId,
      type: 'text/plain',
      size: 0,
    });
    await fragment.save();
    await fragment.setData(Buffer.from('Hello, this is a test fragment!'));
    fragmentId = fragment.id;
  });

  // Test unauthenticated access
  test('unauthenticated requests are denied', () =>
    request(app).get(`/v1/fragments/${fragmentId}`).expect(401));

  // Test incorrect credentials
  test('incorrect credentials are denied', () =>
    request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('invalid@email.com', 'wrongpassword')
      .expect(401));

  // Test successful fragment retrieval without extension
  test('authenticated user can get fragment data without extension', async () => {
    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.text).toBe('Hello, this is a test fragment!');
  });

  // Test successful fragment retrieval with .txt extension
  test('authenticated user can get fragment as .txt', async () => {
    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}.txt`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.text).toBe('Hello, this is a test fragment!');
  });

  // Test successful fragment retrieval with .html extension
  test('authenticated user can get fragment as .html', async () => {
    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}.html`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('<html>');
    expect(res.text).toContain('Hello, this is a test fragment!');
  });

  // Test successful fragment retrieval with .json extension
  test('authenticated user can get fragment as .json', async () => {
    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}.json`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('application/json');
    expect(res.text).toBe('"Hello, this is a test fragment!"');
  });

  // Test non-existent fragment
  test('non-existent fragment returns 404', async () => {
    const fakeId = '12345678-1234-1234-1234-123456789012';
    const res = await request(app)
      .get(`/v1/fragments/${fakeId}`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toContain('No fragment with ID');
  });

  // Test unsupported extension
  test('unsupported extension returns 415', async () => {
    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}.png`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toContain('Fragment cannot be converted to .png');
  });

  // Test markdown to HTML conversion
  test('markdown fragment can be converted to HTML', async () => {
    // Create a markdown fragment
    const markdownFragment = new Fragment({
      ownerId,
      type: 'text/markdown',
      size: 0,
    });
    await markdownFragment.save();
    await markdownFragment.setData(Buffer.from('# Hello\nThis is **markdown**'));

    const res = await request(app)
      .get(`/v1/fragments/${markdownFragment.id}.html`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('<html>');
    expect(res.text).toContain('<h1>Hello</h1>');
    expect(res.text).toContain('<strong>markdown</strong>');
  });

  // Test markdown to markdown conversion (should return original)
  test('markdown fragment can be retrieved as .md', async () => {
    // Create a markdown fragment
    const markdownFragment = new Fragment({
      ownerId,
      type: 'text/markdown',
      size: 0,
    });
    await markdownFragment.save();
    await markdownFragment.setData(Buffer.from('# Hello\nThis is **markdown**'));

    const res = await request(app)
      .get(`/v1/fragments/${markdownFragment.id}.md`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/markdown');
    expect(res.text).toBe('# Hello\nThis is **markdown**');
  });

  // Test JSON fragment conversion
  test('JSON fragment can be converted to different formats', async () => {
    // Create a JSON fragment
    const jsonFragment = new Fragment({
      ownerId,
      type: 'application/json',
      size: 0,
    });
    await jsonFragment.save();
    await jsonFragment.setData(Buffer.from('{"name": "test", "value": 123}'));

    // Test JSON to HTML
    const htmlRes = await request(app)
      .get(`/v1/fragments/${jsonFragment.id}.html`)
      .auth('user1@email.com', 'password1');

    expect(htmlRes.statusCode).toBe(200);
    expect(htmlRes.headers['content-type']).toContain('text/html');
    expect(htmlRes.text).toContain('"name": "test"');

    // Test JSON to text
    const txtRes = await request(app)
      .get(`/v1/fragments/${jsonFragment.id}.txt`)
      .auth('user1@email.com', 'password1');

    expect(txtRes.statusCode).toBe(200);
    expect(txtRes.headers['content-type']).toContain('text/plain');
    expect(txtRes.text).toContain('"name": "test"');
  });

  // Test HTML fragment conversion
  test('HTML fragment can be converted to text', async () => {
    // Create an HTML fragment
    const htmlFragment = new Fragment({
      ownerId,
      type: 'text/html',
      size: 0,
    });
    await htmlFragment.save();
    await htmlFragment.setData(Buffer.from('<html><body><h1>Title</h1><p>Content</p></body></html>'));

    const res = await request(app)
      .get(`/v1/fragments/${htmlFragment.id}.txt`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.text).toBe('TitleContent');
  });

  // Test user can only access their own fragments
  test('user cannot access another user\'s fragment', async () => {
    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user2@email.com', 'password2');

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
  });
});