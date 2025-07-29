const request = require('supertest');
const app = require('../../src/app');
const { Fragment } = require('../../src/model/fragment');
const hash = require('../../src/hash');

describe('DELETE /fragments/:id', () => {
  test('should delete an existing fragment and return 200 with status ok', async () => {
    // Create a test fragment first
    const fragment = new Fragment({
      ownerId: hash('user1@email.com'),
      type: 'text/plain',
      size: 0
    });
    await fragment.save();
    await fragment.setData(Buffer.from('Test fragment data'));

    const response = await request(app)
      .delete(`/v1/fragments/${fragment.id}`)
      .auth('user1@email.com', 'password1')
      .expect(200);

    expect(response.body).toEqual({ status: 'ok' });
  });

  test('should return 404 when fragment does not exist', async () => {
    const nonExistentId = '4dcc65b6-9d57-453a-bd3a-63c107a51698';

    const response = await request(app)
      .delete(`/v1/fragments/${nonExistentId}`)
      .auth('user1@email.com', 'password1')
      .expect(404);

    expect(response.body).toHaveProperty('status', 'error');
    expect(response.body).toHaveProperty('error.code', 404);
    expect(response.body).toHaveProperty('error.message');
  });

  test('should return 404 when fragment belongs to different user', async () => {
    // Create a fragment for user1
    const fragment = new Fragment({
      ownerId: hash('user1@email.com'),
      type: 'text/plain',
      size: 0
    });
    await fragment.save();
    await fragment.setData(Buffer.from('Test fragment data'));

    // Try to delete it as user2
    const response = await request(app)
      .delete(`/v1/fragments/${fragment.id}`)
      .auth('user2@email.com', 'password2')
      .expect(404);

    expect(response.body).toHaveProperty('status', 'error');
    expect(response.body).toHaveProperty('error.code', 404);
    expect(response.body).toHaveProperty('error.message');
  });

  test('should return 401 when not authenticated', async () => {
    const response = await request(app)
      .delete('/v1/fragments/4dcc65b6-9d57-453a-bd3a-63c107a51698')
      .expect(401);

    expect(response.body).toHaveProperty('error');
  });

  test('should handle invalid fragment ID format', async () => {
    const response = await request(app)
      .delete('/v1/fragments/invalid-id')
      .auth('user1@email.com', 'password1')
      .expect(404);

    expect(response.body).toHaveProperty('status', 'error');
    expect(response.body).toHaveProperty('error.code', 404);
    expect(response.body).toHaveProperty('error.message');
  });
});