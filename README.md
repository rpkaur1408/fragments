# Fragments

A cloud-native microservice for storing and converting small fragments of text, JSON, and image data — built with Node.js, deployed on AWS, and backed by a full CI/CD pipeline.




## Overview

Fragments are small pieces of text or image data that don't warrant a full "document" — for example, a plain-text note, a Markdown snippet, a CSV row, or a small image. This service exposes a versioned REST API for creating, retrieving, updating, deleting, and converting fragments between formats (e.g. Markdown → HTML, PNG → JPEG), with per-user authentication and isolation.

## Features

- **Full CRUD** on fragments — create, retrieve, update, and delete, each with automated test coverage
- **Format conversion** between supported text types (plain text, Markdown, HTML, CSV, JSON, YAML) and image types (PNG, JPEG, WebP, GIF, AVIF), computed on read rather than stored redundantly
- **Authenticated & isolated** — every fragment is scoped to its owner via Amazon Cognito; users can only access their own data
- **Basic front-end UI** for creating, viewing, updating, and deleting fragments against the live API
- **Configurable storage backend** — runs against in-memory storage for local development or AWS (S3 + DynamoDB) in production, controlled via environment variables
- **Full CI/CD pipeline** — GitHub Actions runs linting, unit tests, and integration tests on every commit; tagged releases are automatically built as Docker images and deployed to AWS ECS

## Tech stack

| Layer | Technology |
|---|---|
| API | Node.js, Express |
| Data storage | Amazon DynamoDB (metadata), Amazon S3 (binary data) |
| Auth | Amazon Cognito |
| Image processing | Sharp |
| Testing | Jest (unit), Hurl (integration) |
| Local dev | Docker Compose (DynamoDB Local, S3 via LocalStack) |
| CI/CD | GitHub Actions → Amazon ECR → Amazon ECS |
| Containerization | Docker |

## API summary

All endpoints are versioned under `/v1`. Full request/response examples are in the code, but the core surface is:

| Method | Route | Description |
|---|---|---|
| `GET` | `/` | Unauthenticated health check |
| `POST` | `/v1/fragments` | Create a new fragment |
| `GET` | `/v1/fragments` | List the authenticated user's fragments |
| `GET` | `/v1/fragments/:id` | Get a fragment's data, with optional format conversion via extension (e.g. `.html`) |
| `GET` | `/v1/fragments/:id/info` | Get a fragment's metadata |
| `PUT` | `/v1/fragments/:id` | Replace an existing fragment's data |
| `DELETE` | `/v1/fragments/:id` | Delete a fragment |

## Running locally

```bash
# Install dependencies
npm install

# Run in dev mode (auto-restart + debug logs)
npm run dev

# Run with debugger attached (port 9229)
npm run debug

# Check code quality
npm run lint

# Run the full test suite with coverage
npm run coverage
```

Health check:
```bash
curl http://localhost:8080
```

## Running with Docker

```bash
# Build and run the container standalone
docker run --rm --name fragments --env-file .env fragments:latest

# Or bring up the full local stack (API + DynamoDB Local + S3 LocalStack)
docker compose up
```

## Testing

- **Unit tests** (Jest) cover the core fragment model and route handlers.
- **Integration tests** (Hurl, via Docker Compose) exercise the full HTTP API — all routes, success and error cases — against DynamoDB Local and LocalStack.
- Both suites run automatically on every push via GitHub Actions.

## CI/CD

- **CI** — on every commit: ESLint, unit tests, and integration tests via GitHub Actions.
- **CD** — on every git tag: Docker image built and pushed to Amazon ECR, then deployed to Amazon ECS automatically.

## Project structure

```
fragments/
├── .github/workflows/   # CI and CD pipeline definitions
├── scripts/             # Helper scripts (e.g. running integration tests)
├── src/                 # Application source
├── tests/               # Unit and integration tests
├── docker-compose.yml   # Local dev stack
└── Dockerfile
```
