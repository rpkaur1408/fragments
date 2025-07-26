# Test: POST without authentication returns 401
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
`This should fail`
 
HTTP/1.1 401
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 401 