// tests/unit/response.test.js

const { createErrorResponse, createSuccessResponse } = require('../../src/response');

// Define (i.e., name) the set of tests we're about to do
describe('API Responses', () => {
  // Write a test for calling createErrorResponse()
  test('createErrorResponse()', () => {
    const errorResponse = createErrorResponse(404, 'not found');
    // Expect the result to look like the following
    expect(errorResponse).toEqual({
      //Intentionally failing test
      //status: 'error',
      status:"ok",
      error: {
        //code: 404,
        code :400,
        message: 'not found',
      },
    });
  });

  // Write a test for calling createSuccessResponse() with no argument
  test('createSuccessResponse()', () => {
    // No arg passed
    const successResponse = createSuccessResponse();
    // Expect the result to look like the following
    expect(successResponse).toEqual({
      status: 'ok',
    });
  });

  // Write a test for calling createSuccessResponse() with an argument
  test('createSuccessResponse(data)', () => {
    // Data argument included
    const data = { a: 1, b: 2 };
    const successResponse = createSuccessResponse(data);
    // Expect the result to look like the following
    expect(successResponse).toEqual({
      status: 'ok',
      // Breaking code intentionally

      // a: 1,
      // b: 2,
       a: 2,         // Wrong - should be 1
       b: 1,         // Wrong - should be 2
       c: 3          // Doesn't exist in response

    });
  });
});