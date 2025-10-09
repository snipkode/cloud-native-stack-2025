# Midtrans Payment Integration

This document explains the Midtrans payment gateway integration in the SaaS/PaaS Platform.

## Overview

The application is integrated with Midtrans, Indonesia's leading payment gateway, to handle payment processing for credit top-ups. This integration enables users to add credits to their accounts using various payment methods supported by Midtrans.

## Integration Components

### 1. Configuration (`src/config/midtrans.js`)
- Sets up the Midtrans client with server and client keys
- Handles environment-specific configurations (sandbox vs production)

### 2. Service Layer (`src/services/midtransService.js`)
- Provides a wrapper around the Midtrans API
- Handles payment creation, status checks, and webhook processing
- Implements signature verification for security

### 3. Payment Service (`src/services/paymentService.js`)
- Business logic for processing top-up transactions
- Coordinates between application models and Midtrans service
- Handles webhook processing and credit updates

### 4. Database Models (`src/models/transaction.js`)
- Extended to include Midtrans-specific fields
- Stores transaction IDs, order IDs, and payment metadata

### 5. API Endpoints (`src/routes/billingRoutes.js`)
- `/billing/topup`: Create new top-up transactions
- `/billing/webhook`: Handle Midtrans notifications
- `/billing/sync/:transactionId`: Manually sync transaction status

## Environment Variables

Add these to your `.env` file:

```
MIDTRANS_SERVER_KEY=your_server_key_here
MIDTRANS_CLIENT_KEY=your_client_key_here
MIDTRANS_IS_PRODUCTION=false  # Set to true for production
```

## Payment Flow

1. User initiates a top-up request via `/billing/topup`
2. System creates a pending transaction record
3. System creates payment request with Midtrans
4. User is redirected to Midtrans payment page
5. Midtrans processes the payment
6. Midtrans sends webhook notification to `/billing/webhook`
7. System validates webhook signature and updates transaction status
8. If successful, user's credits are increased

## Webhook Security

The system validates Midtrans webhook signatures to ensure notifications are authentic:
- Uses SHA-512 hashing with server key
- Verifies `x-midtrans-signature` header
- Logs and rejects invalid signatures

## Error Handling

- Invalid payment amounts return 400 status
- Invalid webhook signatures return 401 status
- System errors return 500 status
- Webhook processing always returns 200 to prevent retries

## Testing

Run the Midtrans integration tests:

```bash
npm run test:midtrans
```

## Production Considerations

1. Use production Midtrans keys
2. Ensure webhook endpoint is publicly accessible
3. Monitor webhook delivery and implement retries if necessary
4. Implement proper logging and monitoring
5. Consider implementing refund functionality