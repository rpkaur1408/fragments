# Test: POST with unsupported Content-Type returns 415
POST http://localhost:8080/v1/fragments
Content-Type: application/xml
[BasicAuth]
user1@email.com:password1
`<note>This is XML</note>`

HTTP/1.1 415
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.message" isString 