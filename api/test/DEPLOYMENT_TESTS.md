# Testing Deployment Endpoints

This document explains how to test the deployment endpoints in the SaaS/PaaS Platform.

## Available Test Scripts

The following npm scripts are available for testing deployment functionality:

- `npm test` - Runs the comprehensive deployment endpoint test suite
- `npm run test:rbac` - Tests Role-Based Access Control for deployments
- `npm run test:deployments` - Tests the main deployments API endpoints
- `npm run test:test-deployments` - Tests the test-deployments API endpoints

## Prerequisites

To run the tests, you'll need:

1. A running instance of the application (use `npm run dev`)
2. A valid JWT token for authentication
3. Environment variables set:
   - `TEST_TOKEN` - A valid JWT token for the test user

## Test Coverage

The test suite covers all deployment endpoints:

### Main Deployment Endpoints (`/api/deployments`)
- `POST /` - Create new deployment
- `GET /` - Get all user deployments
- `GET /:id` - Get specific deployment
- `POST /:id/restart` - Restart deployment
- `POST /:id/stop` - Stop deployment
- `DELETE /:id` - Delete deployment
- `GET /:id/logs` - Get deployment logs

### Test Deployment Endpoints (`/api/test-deployments`)
- All the same endpoints as above but for test deployments

### RBAC Tests
- Testing access control for deployments
- Granting and revoking permissions
- Testing permission enforcement

## Running Tests

1. Start the server:
   ```bash
   npm run dev
   ```

2. In another terminal, run the full test suite:
   ```bash
   npm test
   ```

3. Or run specific test sets:
   ```bash
   npm run test:rbac
   npm run test:deployments
   npm run test:test-deployments
   ```

## Expected Test Flow

The comprehensive test suite will:

1. Create a test deployment
2. Verify the deployment was created successfully
3. Retrieve all deployments for the user
4. Get the specific deployment by ID
5. Test restarting the deployment
6. Test stopping the deployment
7. Get deployment logs
8. Delete the deployment
9. Verify the deployment was deleted
10. Test error conditions and invalid inputs