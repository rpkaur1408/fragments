# Test: POST a JSON fragment and GET it back
POST http://localhost:8080/v1/fragments
Content-Type: application/json
[BasicAuth]
user1@email.com:password1
`{"name": "test", "value": 123}`

HTTP/1.1 201
[Captures]
url: header "Location"

# GET the fragment and check the body
GET {{url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
header "Content-Type" contains "application/json"
body == "{\"name\": \"test\", \"value\": 123}" 