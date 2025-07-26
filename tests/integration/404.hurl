# 404 Not Found Test
# This test checks that requesting a non-existent route returns a 404 error.

GET http://localhost:8080/no-such-route

# We expect to get back an HTTP 1.1 404 response
HTTP/1.1 404

# Optional: Check for Content-Type (if your server returns JSON for errors)
Content-Type: application/json; charset=utf-8

[Asserts]
jsonpath "$.error.message" isString
