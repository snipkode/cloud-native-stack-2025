# End-to-End Testing Procedures

This document explains how to run and understand the end-to-end tests for the SaaS/PaaS Platform.

## Overview

The end-to-end tests simulate real user interactions with the complete application, including:
- User registration and authentication
- Midtrans payment processing
- Deployment creation and management
- Billing and transaction handling

## Test Structure

The end-to-end tests follow a complete user journey:
1. User registration
2. User authentication  
3. Credit top-up via Midtrans
4. Deployment creation
5. Deployment management actions
6. Billing verification

## Prerequisites

- Node.js and npm installed
- Database configured and accessible
- Midtrans test keys (for simulation)

## Running End-to-End Tests

### Install Dependencies
```bash
npm install
npm install --save-dev jest supertest
```

### Run All End-to-End Tests
```bash
npm run test:e2e
# or
npx jest test/e2e.test.js
```

### Run with Verbose Output
```bash
npm run test:e2e -- --verbose
```

## Test Scenarios Covered

### Authentication Flow
- User registration with valid credentials
- User login with correct credentials
- Profile access with authentication token
- Password confirmation validation

### Midtrans Payment Flow
- Creating a top-up transaction request
- Verifying pending transaction status
- Simulating Midtrans webhook notification
- Processing successful payment confirmation
- Verifying credit updates after payment
- Handling insufficient credits for deployment

### Deployment Flow
- Creating a new deployment with valid inputs
- Creating test deployments
- Retrieving all user deployments
- Getting specific deployment details
- Performing deployment actions (restart, stop)
- Verifying deployment status changes

### Billing Verification
- Creating multiple top-up transactions
- Retrieving all billing transactions
- Getting specific transaction details
- Verifying transaction status updates
- Confirming credit balance changes

## Expected Test Results

All tests should pass with the following characteristics:
- HTTP status codes: 200 (success), 201 (created), 402 (payment required), 400/401/404 (errors)
- Response data includes expected properties and values
- Database state matches expected values after each operation
- No data leakage between different users

## Test Configuration

Environment variables used for testing:
```env
JWT_SECRET=test-secret-for-e2e-tests
MIDTRANS_SERVER_KEY=test-midtrans-server-key
MIDTRANS_CLIENT_KEY=test-midtrans-client-key
MIDTRANS_IS_PRODUCTION=false
```

## Database Handling

- Tests run against a temporary in-memory or test database
- Data is cleaned up after each test run
- No impact on production or development databases

## Webhook Testing

The tests simulate Midtrans webhook notifications:
- Valid signature verification
- Transaction status updates
- Credit balance adjustments
- Error handling for invalid webhooks

## Troubleshooting

If tests fail:

1. Verify database connection and permissions
2. Check that test environment variables are set
3. Ensure all dependencies are installed
4. Run tests individually to isolate issues

```bash
# Run a specific test
npx jest test/e2e.test.js -t "Complete user journey"
```

## Test Isolation

- Each test is independent and does not rely on others
- Database is reset before test run
- Authentication tokens are properly managed
- Test data is cleaned up after execution

## Performance Considerations

- Tests have appropriate timeouts (10-30 seconds)
- Asynchronous operations are properly handled
- No external API calls to production services during tests
- All services mocked where appropriate for testing speed