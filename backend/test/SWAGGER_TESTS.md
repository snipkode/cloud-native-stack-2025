# Swagger Documentation Tests

This document explains how to test the Swagger documentation endpoints in the SaaS/PaaS Platform.

## Overview

The application provides comprehensive API documentation using Swagger (OpenAPI). The documentation includes:

- Interactive API documentation via Swagger UI
- Machine-readable OpenAPI 3.0 specification
- Complete documentation of all API endpoints
- Request/response examples and schemas

## Endpoints

### Swagger UI
- **URL**: `http://localhost:3000/api-docs`
- **Method**: GET
- **Description**: Serves the interactive Swagger UI for exploring API endpoints

### Swagger JSON Specification
- **URL**: `http://localhost:3000/api-docs` (with `Accept: application/json` header)
- **Method**: GET
- **Description**: Returns the raw OpenAPI 3.0 specification in JSON format

## Available Test Scripts

- `npm run test:swagger` - Runs the Swagger endpoint tests
- `npm test` - Runs all tests, including Swagger tests

## Test Coverage

The Swagger tests verify:

1. **Documentation Accessibility**: The Swagger UI is accessible via browser
2. **JSON Specification**: The OpenAPI specification is available in JSON format
3. **Endpoint Documentation**: All API endpoints are properly documented in the spec:
   - Deployments endpoints (`/api/deployments`, `/api/deployments/{id}`, etc.)
   - Test Deployments endpoints (`/api/test-deployments`, etc.)
   - Authentication endpoints (`/api/auth`, etc.)
   - Billing endpoints (`/api/billing`, etc.)
   - Access Control endpoints (`/api/access`, etc.)
4. **Documentation Completeness**: Essential properties like info, servers, security schemes, and tags are present

## Running Tests

1. Start the server:
   ```bash
   npm run dev
   ```

2. In another terminal, run the Swagger tests:
   ```bash
   npm run test:swagger
   ```

## Expected Test Flow

The Swagger test suite will:

1. Verify the Swagger UI is accessible and returns HTML
2. Verify the JSON OpenAPI specification is available with proper headers
3. Validate that the specification includes the correct OpenAPI version
4. Check that all documented API endpoints appear in the specification
5. Verify essential documentation elements (title, version, description, etc.)
6. Confirm security schemes (bearer authentication) are defined
7. Ensure all expected API tags are present

## Manual Verification

You can also manually verify the documentation by visiting:
- Swagger UI: http://localhost:3000/api-docs
- JSON Spec: Access the same URL with an Accept: application/json header