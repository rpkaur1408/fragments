# Lab 10 DynamoDB Integration Test
# This test verifies that the fragments server works correctly with Amazon DynamoDB
# by testing the complete workflow: POST -> GET -> LIST -> DELETE -> GET (404) -> LIST

# Step 1: POST a new JSON fragment to create it in DynamoDB
POST http://localhost:8080/v1/fragments
Content-Type: application/json
[BasicAuth]
user1@email.com:password1

`{"service": "DynamoDB"}`

# Step 2: Confirm 201 response and capture the Location header and fragment ID
HTTP/1.1 201
Content-Type: application/json; charset=utf-8

[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragment.type" == "application/json"
jsonpath "$.fragment.size" == 23

[Captures]
fragment1_url: header "Location"
fragment1_id: jsonpath "$.fragment.id"

# Step 3: GET the fragment info (metadata) for the first fragment
GET {{fragment1_url}}/info
[BasicAuth]
user1@email.com:password1

# Step 4: Confirm 200 response and verify all metadata properties
HTTP/1.1 200
Content-Type: application/json; charset=utf-8

[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" == "{{fragment1_id}}"
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragment.type" == "application/json"
jsonpath "$.fragment.size" == 23
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString

# Step 5: POST a second Markdown fragment to create it in DynamoDB
POST http://localhost:8080/v1/fragments
Content-Type: text/markdown
[BasicAuth]
user1@email.com:password1

`DynamoDB is **great**.`

# Step 6: Confirm 201 response and capture the Location header and second fragment ID
HTTP/1.1 201
Content-Type: application/json; charset=utf-8

[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragment.type" == "text/markdown"
jsonpath "$.fragment.size" == 22

[Captures]
fragment2_url: header "Location"
fragment2_id: jsonpath "$.fragment.id"

# Step 7: GET the fragment info (metadata) for the second fragment
GET {{fragment2_url}}/info
[BasicAuth]
user1@email.com:password1

# Step 8: Confirm 200 response and verify all metadata properties
HTTP/1.1 200
Content-Type: application/json; charset=utf-8

[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" == "{{fragment2_id}}"
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragment.type" == "text/markdown"
jsonpath "$.fragment.size" == 22
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString

# Step 9: GET all fragments for the user without expanding (just IDs)
GET http://localhost:8080/v1/fragments
[BasicAuth]
user1@email.com:password1

# Step 10: Confirm 200 response and verify both fragment IDs are included
HTTP/1.1 200
Content-Type: application/json; charset=utf-8

[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragments" count >= 2
# Verify that our created fragments are in the list (order doesn't matter)
jsonpath "$.fragments" contains "{{fragment1_id}}"
jsonpath "$.fragments" contains "{{fragment2_id}}"

# Step 11: DELETE the first fragment
DELETE {{fragment1_url}}
[BasicAuth]
user1@email.com:password1

# Step 12: Confirm 200 response for successful deletion
HTTP/1.1 200
Content-Type: application/json; charset=utf-8

[Asserts]
jsonpath "$.status" == "ok"

# Step 13: Try to GET the first fragment again to verify it's actually deleted
GET {{fragment1_url}}
[BasicAuth]
user1@email.com:password1

# Step 14: Confirm 404 response since the fragment should be deleted
HTTP/1.1 404
Content-Type: application/json; charset=utf-8

[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 404
jsonpath "$.error.message" isString

# Step 15: GET all fragments for the user again without expanding
GET http://localhost:8080/v1/fragments
[BasicAuth]
user1@email.com:password1

# Step 16: Confirm 200 response and verify first ID is NOT included but second ID is
HTTP/1.1 200
Content-Type: application/json; charset=utf-8

[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragments" count >= 1
# Verify that the first fragment is deleted (not in the list)
jsonpath "$.fragments" not contains "{{fragment1_id}}"
# Verify that the second fragment is still there
jsonpath "$.fragments" contains "{{fragment2_id}}" 