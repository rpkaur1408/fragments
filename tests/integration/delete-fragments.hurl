# Test DELETE /fragments/:id endpoint
# This test verifies that authenticated users can delete their fragments

# First, create a fragment to delete
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
user1@email.com:password1

`Hello, this is a test fragment to delete.`

HTTP/1.1 201
Content-Type: application/json; charset=utf-8

[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragment.type" == "text/plain"

[Captures]
fragment_id: jsonpath "$.fragment.id"

# Now delete the fragment
DELETE http://localhost:8080/v1/fragments/{{fragment_id}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
Content-Type: application/json; charset=utf-8

[Asserts]
jsonpath "$.status" == "ok"

# Verify the fragment is actually deleted by trying to get it
GET http://localhost:8080/v1/fragments/{{fragment_id}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 404
Content-Type: application/json; charset=utf-8

[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 404
jsonpath "$.error.message" isString
