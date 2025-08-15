# Test all new supported types and conversions
# Tests CSV, YAML, and image types with their conversions

# Test 1: Create and test CSV fragment
POST http://localhost:8080/v1/fragments
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
Content-Type: text/csv
```
name,age,city
John,30,Toronto
Jane,25,Montreal
Bob,35,Vancouver
```

HTTP/1.1 201
[Captures]
csv_fragment_url: header "Location"
csv_fragment_id: jsonpath "$.fragment.id"
[Asserts]
jsonpath "$.fragment.type" == "text/csv"
jsonpath "$.fragment.size" == 56

# Get CSV fragment as-is
GET {{csv_fragment_url}}
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
Content-Type: text/csv
[Asserts]
body contains "name,age,city"
body contains "John,30,Toronto"

# Convert CSV to JSON
GET {{csv_fragment_url}}.json
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
Content-Type: application/json
[Asserts]
jsonpath "$" count == 3
jsonpath "$[0].name" == "John"
jsonpath "$[0].age" == "30"
jsonpath "$[1].name" == "Jane"

# Convert CSV to text
GET {{csv_fragment_url}}.txt
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
Content-Type: text/plain
[Asserts]
body contains "John"
body contains "Toronto"

# Test 2: Create and test YAML fragment
POST http://localhost:8080/v1/fragments
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
Content-Type: application/yaml
```
message: Hello World
config:
  debug: true
  port: 8080
users:
  - name: Alice
    role: admin
  - name: Bob
    role: user
```

HTTP/1.1 201
[Captures]
yaml_fragment_url: header "Location"
yaml_fragment_id: jsonpath "$.fragment.id"
[Asserts]
jsonpath "$.fragment.type" == "application/yaml"

# Get YAML fragment as-is
GET {{yaml_fragment_url}}
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
Content-Type: application/yaml
[Asserts]
body contains "message: Hello World"
body contains "debug: true"

# Convert YAML to JSON
GET {{yaml_fragment_url}}.json
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
Content-Type: application/json
[Asserts]
jsonpath "$.message" == "Hello World"
jsonpath "$.config.debug" == true
jsonpath "$.config.port" == 8080
jsonpath "$.users[0].name" == "Alice"

# Convert YAML to text
GET {{yaml_fragment_url}}.txt
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
Content-Type: text/plain
[Asserts]
body contains "Hello World"
body contains "Alice"

# Test 3: JSON to YAML conversion
POST http://localhost:8080/v1/fragments
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
Content-Type: application/json
```
{
  "name": "Test Service",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.0",
    "helmet": "^6.0.0"
  },
  "active": true
}
```

HTTP/1.1 201
[Captures]
json_fragment_url: header "Location"

# Convert JSON to YAML
GET {{json_fragment_url}}.yaml
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
Content-Type: application/yaml
[Asserts]
body contains "name: Test Service"
body contains "version: 1.0.0"
body contains "active: true"

# Convert JSON to CSV (should work for object)
GET {{json_fragment_url}}.csv
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
Content-Type: text/csv
[Asserts]
body contains "name,version"
body contains "Test Service,1.0.0"

# Test 4: Markdown to HTML conversion
POST http://localhost:8080/v1/fragments
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
Content-Type: text/markdown
```
# My Document

This is a **bold** statement and this is *italic*.

## Features

- Easy to use
- Fast performance
- Secure by default

### Code Example

```javascript
console.log("Hello, World!");
```

[Visit our website](https://example.com)
```

HTTP/1.1 201
[Captures]
md_fragment_url: header "Location"

# Convert Markdown to HTML
GET {{md_fragment_url}}.html
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
Content-Type: text/html
[Asserts]
body contains "<!DOCTYPE html>"
body contains "<h1>My Document</h1>"
body contains "<strong>bold</strong>"
body contains "<em>italic</em>"
body contains "<ul>"
body contains "<li>Easy to use</li>"
body contains "<code>console.log"

# Test 5: Error cases for conversions

# Try to convert text to image (should fail)
POST http://localhost:8080/v1/fragments
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
Content-Type: text/plain
`Cannot convert to image`

HTTP/1.1 201
[Captures]
text_fragment_url: header "Location"

GET {{text_fragment_url}}.png
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 415
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.message" contains "Cannot convert"

# Try unsupported conversion extension
GET {{text_fragment_url}}.mp4
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 415
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.message" contains "Unsupported conversion"

# Test 6: Complex JSON to CSV conversion
POST http://localhost:8080/v1/fragments
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
Content-Type: application/json
```
[
  {"id": 1, "name": "Alice", "department": "Engineering", "salary": 75000},
  {"id": 2, "name": "Bob", "department": "Marketing", "salary": 65000},
  {"id": 3, "name": "Charlie", "department": "Engineering", "salary": 80000}
]
```

HTTP/1.1 201
[Captures]
json_array_url: header "Location"

# Convert JSON array to CSV
GET {{json_array_url}}.csv
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
Content-Type: text/csv
[Asserts]
body contains "id,name,department,salary"
body contains "1,Alice,Engineering,75000"
body contains "2,Bob,Marketing,65000"
body contains "3,Charlie,Engineering,80000"
