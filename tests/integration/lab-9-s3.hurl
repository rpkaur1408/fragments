# Lab 9 S3 Integration Test
# This test verifies that the fragments server works correctly with AWS S3
# by testing the complete workflow: POST -> GET -> DELETE -> GET (404)

# Step 1: POST a new text fragment to create it in S3
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
user1@email.com:password1

`Hello S3!`

# Step 2: Confirm 201 response and capture the Location header
HTTP/1.1 201
Content-Type: application/json; charset=utf-8

[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragment.type" == "text/plain"
jsonpath "$.fragment.size" == 9

[Captures]
url: header "Location"

# Step 3: GET the fragment we just created to verify it's stored in S3
GET {{url}}
[BasicAuth]
user1@email.com:password1

# Step 4: Confirm 200 response and verify the content
HTTP/1.1 200
Content-Type: text/plain; charset=utf-8

[Asserts]
body == "Hello S3!"

# Step 5: DELETE the fragment from S3
DELETE {{url}}
[BasicAuth]
user1@email.com:password1

# Step 6: Confirm 200 response for successful deletion
HTTP/1.1 200
Content-Type: application/json; charset=utf-8

[Asserts]
jsonpath "$.status" == "ok"

# Step 7: Try to GET the fragment again to verify it's actually deleted
GET {{url}}
[BasicAuth]
user1@email.com:password1

# Step 8: Confirm 404 response since the fragment should be deleted
HTTP/1.1 404
Content-Type: application/json; charset=utf-8

[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 404
jsonpath "$.error.message" isString