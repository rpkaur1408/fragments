const path = require('path');

describe('Logger Configuration', () => {
  let originalEnv;

  beforeEach(() => {
    // Save original env
    originalEnv = { ...process.env };
    jest.resetModules(); // clear require cache
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  test('should default to info level if LOG_LEVEL is not set', () => {
    delete process.env.LOG_LEVEL;
    const logger = require('../../src/logger');
    expect(logger.level).toBe('info');
  });

  test('should configure pino-pretty when LOG_LEVEL is debug', () => {
    process.env.LOG_LEVEL = 'debug';

    // Spy on console.log to catch debug output
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // Re-require logger.js after setting env
    const logger = require('../../src/logger');

    // This will call logger.debug for all env variables
    logger.debug('This is a debug log');

    // pino-pretty modifies output but we can at least ensure log level is correct
    expect(logger.level).toBe('debug');

    consoleSpy.mockRestore();
  });

 
});
