describe('src/auth/index.js', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    // Restore original env variables and reset modules
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  test('throws error if both Cognito and HTTP Basic Auth are configured', () => {
    process.env.AWS_COGNITO_POOL_ID = 'test-pool-id';
    process.env.AWS_COGNITO_CLIENT_ID = 'test-client-id';
    process.env.HTPASSWD_FILE = '/fake/path/to/.htpasswd';

    expect(() => require('../../src/auth')).toThrow(
      'env contains configuration for both AWS Cognito and HTTP Basic Auth. Only one is allowed.'
    );
  });


  test('exports Basic Auth module when only HTPASSWD_FILE is set and not in production', () => {
    delete process.env.AWS_COGNITO_POOL_ID;
    delete process.env.AWS_COGNITO_CLIENT_ID;
    process.env.HTPASSWD_FILE = '/fake/path/to/.htpasswd';
    process.env.NODE_ENV = 'development';

    jest.resetModules();
    const expected = require('../../src/auth/basic-auth');
    const auth = require('../../src/auth');

    expect(auth).toBe(expected);
  });

  test('throws error when no valid authentication config is present', () => {
    delete process.env.AWS_COGNITO_POOL_ID;
    delete process.env.AWS_COGNITO_CLIENT_ID;
    delete process.env.HTPASSWD_FILE;

    expect(() => require('../../src/auth')).toThrow(
      'missing env vars: no authorization configuration found'
    );
  });
});
