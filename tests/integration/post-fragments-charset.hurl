# Test: POST with Content-Type including charset works and is returned on GET
POST http://localhost:8080/v1/fragments
Content-Type: text/plain; charset=utf-8
[BasicAuth]
user1@email.com:password1
`This is a fragment with charset!`

HTTP/1.1 201
[Captures]
url: header "Location"

# GET the fragment and check the type
GET {{url}}/info
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
jsonpath "$.fragment.type" contains "text/plain" 