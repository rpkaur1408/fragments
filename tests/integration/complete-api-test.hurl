# Comprehensive API Test
# Tests all routes and functionality according to the specification

# Test 1: Health Check (unauthenticated)
GET http://localhost:8080/

HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.author" exists
jsonpath "$.githubUrl" exists
jsonpath "$.version" exists

# Test 2: POST - Create fragments of all supported types

# Create text/plain fragment
POST http://localhost:8080/v1/fragments
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
Content-Type: text/plain
`Hello, this is plain text!`

HTTP/1.1 201
[Captures]
text_plain_url: header "Location"
text_plain_id: jsonpath "$.fragment.id"
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "text/plain"
jsonpath "$.fragment.size" == 26

# Create text/markdown fragment
POST http://localhost:8080/v1/fragments
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
Content-Type: text/markdown
```
# Welcome
This is **markdown** with *emphasis*.
```

HTTP/1.1 201
[Captures]
text_md_url: header "Location"
text_md_id: jsonpath "$.fragment.id"
[Asserts]
jsonpath "$.fragment.type" == "text/markdown"

# Create text/html fragment
POST http://localhost:8080/v1/fragments
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
Content-Type: text/html
`<h1>HTML Content</h1><p>This is <strong>HTML</strong>.</p>`

HTTP/1.1 201
[Captures]
text_html_url: header "Location"
text_html_id: jsonpath "$.fragment.id"
[Asserts]
jsonpath "$.fragment.type" == "text/html"

# Create text/csv fragment
POST http://localhost:8080/v1/fragments
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
Content-Type: text/csv
```
product,price,quantity
Apple,1.50,100
Banana,0.75,200
Orange,2.00,150
```

HTTP/1.1 201
[Captures]
text_csv_url: header "Location"
text_csv_id: jsonpath "$.fragment.id"
[Asserts]
jsonpath "$.fragment.type" == "text/csv"

# Create application/json fragment
POST http://localhost:8080/v1/fragments
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
Content-Type: application/json
```
{
  "service": "fragments",
  "version": "1.0.0",
  "features": ["create", "read", "update", "delete", "convert"],
  "active": true
}
```

HTTP/1.1 201
[Captures]
app_json_url: header "Location"
app_json_id: jsonpath "$.fragment.id"
[Asserts]
jsonpath "$.fragment.type" == "application/json"

# Create application/yaml fragment
POST http://localhost:8080/v1/fragments
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
Content-Type: application/yaml
```
database:
  host: localhost
  port: 5432
  name: fragments_db
settings:
  debug: false
  timeout: 30
```

HTTP/1.1 201
[Captures]
app_yaml_url: header "Location"
app_yaml_id: jsonpath "$.fragment.id"
[Asserts]
jsonpath "$.fragment.type" == "application/yaml"

# Test 3: GET /fragments - List all fragments
GET http://localhost:8080/v1/fragments
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragments" isArray
jsonpath "$.fragments" count >= 6
jsonpath "$.fragments" contains "{{text_plain_id}}"
jsonpath "$.fragments" contains "{{text_md_id}}"
jsonpath "$.fragments" contains "{{app_json_id}}"

# Test 4: GET /fragments?expand=1 - List fragments with metadata
GET http://localhost:8080/v1/fragments?expand=1
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragments" isArray
jsonpath "$.fragments[0].id" exists
jsonpath "$.fragments[0].ownerId" exists
jsonpath "$.fragments[0].created" exists
jsonpath "$.fragments[0].updated" exists
jsonpath "$.fragments[0].type" exists
jsonpath "$.fragments[0].size" exists

# Test 5: GET /fragments/:id - Get fragment data
GET {{text_plain_url}}
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
Content-Type: text/plain
[Asserts]
body == "Hello, this is plain text!"

# Test 6: GET /fragments/:id/info - Get fragment metadata
GET {{text_plain_url}}/info
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" == "{{text_plain_id}}"
jsonpath "$.fragment.type" == "text/plain"
jsonpath "$.fragment.size" == 26

# Test 7: PUT /fragments/:id - Update fragment
PUT {{text_plain_url}}
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
Content-Type: text/plain
`Updated plain text content!`

HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" == "{{text_plain_id}}"
jsonpath "$.fragment.size" == 28

# Verify update worked
GET {{text_plain_url}}
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
[Asserts]
body == "Updated plain text content!"

# Test 8: Conversion tests for all valid combinations

# text/plain conversions (.txt only)
GET {{text_plain_url}}.txt
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
Content-Type: text/plain

# text/markdown conversions (.md, .html, .txt)
GET {{text_md_url}}.md
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
Content-Type: text/markdown

GET {{text_md_url}}.html
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
Content-Type: text/html
[Asserts]
body contains "<h1>Welcome</h1>"
body contains "<strong>markdown</strong>"

GET {{text_md_url}}.txt
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
Content-Type: text/plain

# text/html conversions (.html, .txt)
GET {{text_html_url}}.html
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
Content-Type: text/html

GET {{text_html_url}}.txt
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
Content-Type: text/plain

# text/csv conversions (.csv, .txt, .json)
GET {{text_csv_url}}.csv
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
Content-Type: text/csv

GET {{text_csv_url}}.txt
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
Content-Type: text/plain

GET {{text_csv_url}}.json
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
Content-Type: application/json
[Asserts]
jsonpath "$[0].product" == "Apple"
jsonpath "$[1].product" == "Banana"

# application/json conversions (.json, .yaml, .yml, .txt)
GET {{app_json_url}}.json
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
Content-Type: application/json

GET {{app_json_url}}.yaml
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
Content-Type: application/yaml
[Asserts]
body contains "service: fragments"
body contains "version: 1.0.0"

GET {{app_json_url}}.txt
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
Content-Type: text/plain

# application/yaml conversions (.yaml, .txt)
GET {{app_yaml_url}}.yaml
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
Content-Type: application/yaml

GET {{app_yaml_url}}.txt
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
Content-Type: text/plain

# Test 9: Error cases

# Unsupported conversion
GET {{text_plain_url}}.png
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 415
[Asserts]
jsonpath "$.status" == "error"

# Non-existent fragment
GET http://localhost:8080/v1/fragments/non-existent-id
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 404
[Asserts]
jsonpath "$.status" == "error"

# Unsupported content type
POST http://localhost:8080/v1/fragments
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
Content-Type: video/mp4
`fake binary data`

HTTP/1.1 415
[Asserts]
jsonpath "$.status" == "error"

# Unauthenticated request
GET http://localhost:8080/v1/fragments

HTTP/1.1 401

# Test 10: DELETE /fragments/:id
DELETE {{text_html_url}}
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"

# Verify fragment was deleted
GET {{text_html_url}}
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 404
[Asserts]
jsonpath "$.status" == "error"

# Verify fragment is no longer in the list
GET http://localhost:8080/v1/fragments
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
[Asserts]
jsonpath "$.fragments" not contains "{{text_html_id}}"

# Test 11: Edge cases

# Empty fragment
POST http://localhost:8080/v1/fragments
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
Content-Type: text/plain
``

HTTP/1.1 400

# Very large content (within reasonable limits)
POST http://localhost:8080/v1/fragments
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
Content-Type: text/plain
`This is a reasonably long text fragment that tests the system's ability to handle larger content. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.`

HTTP/1.1 201
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.size" == 376

# Special characters in content
POST http://localhost:8080/v1/fragments
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
Content-Type: application/json
`{"message": "Hello \"world\" & <test>", "symbols": "!@#$%^&*()_+", "unicode": "🌟✨🎉"}`

HTTP/1.1 201
[Captures]
special_chars_url: header "Location"
[Asserts]
jsonpath "$.status" == "ok"

# Verify special characters are preserved
GET {{special_chars_url}}
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
[Asserts]
jsonpath "$.message" == "Hello \"world\" & <test>"
jsonpath "$.unicode" == "🌟✨🎉"
