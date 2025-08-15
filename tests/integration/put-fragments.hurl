# Test PUT /fragments/:id endpoint
# Tests updating existing fragments

# Test 1: Create a text fragment and update it
POST http://localhost:8080/v1/fragments
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
Content-Type: text/plain
`Original text content`

HTTP/1.1 201
[Captures]
fragment1_url: header "Location"
fragment1_id: jsonpath "$.fragment.id"

# Test 2: Update the fragment with new content
PUT {{fragment1_url}}
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
Content-Type: text/plain
`Updated text content`

HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" == "{{fragment1_id}}"
jsonpath "$.fragment.type" == "text/plain"
jsonpath "$.fragment.size" == 20

# Test 3: Verify the content was actually updated
GET {{fragment1_url}}
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
Content-Type: text/plain
[Asserts]
body == "Updated text content"

# Test 4: Try to update with different content type (should fail)
PUT {{fragment1_url}}
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
Content-Type: application/json
`{"message": "test"}`

HTTP/1.1 400
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.message" contains "type cannot be changed"

# Test 5: Try to update non-existent fragment
PUT http://localhost:8080/v1/fragments/non-existent-id
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
Content-Type: text/plain
`Some content`

HTTP/1.1 404
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.message" contains "does not exist"

# Test 6: Try to update without Content-Type header
PUT {{fragment1_url}}
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
`Some content`

HTTP/1.1 400
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.message" contains "Content-Type header is required"

# Test 7: Try to update with unsupported content type
PUT {{fragment1_url}}
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
Content-Type: video/mp4
`Some binary content`

HTTP/1.1 415
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.message" contains "Unsupported Content-Type"

# Test 8: Try to update with empty body
PUT {{fragment1_url}}
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
Content-Type: text/plain

HTTP/1.1 400
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.message" contains "cannot be empty"

# Test 9: Update JSON fragment
POST http://localhost:8080/v1/fragments
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
Content-Type: application/json
`{"message": "original", "count": 1}`

HTTP/1.1 201
[Captures]
json_fragment_url: header "Location"
json_fragment_id: jsonpath "$.fragment.id"

# Update JSON fragment
PUT {{json_fragment_url}}
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
Content-Type: application/json
`{"message": "updated", "count": 42, "new_field": true}`

HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" == "{{json_fragment_id}}"
jsonpath "$.fragment.type" == "application/json"
jsonpath "$.fragment.size" == 49

# Verify JSON content was updated
GET {{json_fragment_url}}
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
Content-Type: application/json
[Asserts]
jsonpath "$.message" == "updated"
jsonpath "$.count" == 42
jsonpath "$.new_field" == true

# Test 10: Unauthenticated request should fail
PUT {{fragment1_url}}
Content-Type: text/plain
`Unauthorized content`

HTTP/1.1 401
