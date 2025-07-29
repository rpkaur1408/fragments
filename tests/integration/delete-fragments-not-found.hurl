# Test DELETE /fragments/:id endpoint when fragment doesn't exist
# This test verifies that attempting to delete a non-existent fragment returns 404

DELETE http://localhost:8080/v1/fragments/4dcc65b6-9d57-453a-bd3a-63c107a51698
[BasicAuth]
user1@email.com:password1

HTTP/1.1 404
Content-Type: application/json; charset=utf-8

[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 404
jsonpath "$.error.message" isString
