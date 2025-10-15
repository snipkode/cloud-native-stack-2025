# Billing System

A comprehensive billing system for SaaS applications with subscription management, payment processing, and usage-based billing capabilities.

## Installation

```bash
npm install billing-system
```

## Features

- Customer management
- Subscription plans with multiple intervals
- Recurring billing and invoicing
- Usage-based billing
- Coupon and discount management
- Payment processing integration (Stripe)
- Tax calculation
- Proration for plan changes
- Comprehensive reporting

## Basic Usage

### Initialize the Billing Manager

```typescript
import { BillingManager } from 'billing-system';

// Initialize with storage (uses in-memory by default)
const billing = new BillingManager({
  stripeSecretKey: process.env.STRIPE_SECRET_KEY, // Optional
  currency: 'usd', // Default currency
  taxRate: 0.08 // Default tax rate (8%)
});

// Initialize the storage
await billing.initialize();
```

### Customer Management

```typescript
// Create a customer
const customer = await billing.createCustomer({
  email: 'customer@example.com',
  name: 'John Doe',
  address: {
    line1: '123 Main St',
    city: 'Anytown',
    state: 'ST',
    postalCode: '12345',
    country: 'US'
  }
});

// Update a customer
const updatedCustomer = await billing.updateCustomer(customer.id, {
  name: 'John Smith'
});
```

### Plan Management

```typescript
// Create a subscription plan
const plan = await billing.createPlan({
  name: 'Basic Plan',
  description: 'Basic access to our service',
  amount: 1000, // $10.00 in cents
  currency: 'usd',
  interval: 'month',
  intervalCount: 1, // Every month
  trialPeriodDays: 14, // 14-day free trial
  features: [
    'Up to 5 users',
    'Basic support',
    '1GB storage'
  ],
  isActive: true
});
```

### Subscription Management

```typescript
// Create a subscription for a customer
const subscription = await billing.createSubscription({
  customerId: customer.id,
  planId: plan.id,
  trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
});

// Update a subscription (e.g., change plan)
const updatedSubscription = await billing.updateSubscription(subscription.id, {
  planId: newPlan.id
});

// Cancel a subscription
await billing.cancelSubscription(subscription.id, 'Customer requested cancellation');
```

### Invoice Management

```typescript
// Create an invoice for a subscription (automatically done for recurring billing)
const invoice = await billing.createInvoiceForSubscription(subscription.id);

// Create a manual invoice
const manualInvoice = await billing.createInvoice({
  customerId: customer.id,
  lineItems: [
    {
      description: 'Setup fee',
      amount: 5000, // $50.00 in cents
      quantity: 1,
      currency: 'usd'
    }
  ]
});
```

### Usage-Based Billing

```typescript
// Record usage for metered billing
await billing.recordUsage(subscription.id, 'api_calls', 1500);

// Get usage for a specific period
const usage = await billing.getUsageForSubscription(
  subscription.id,
  'api_calls',
  new Date('2023-01-01'),
  new Date('2023-01-31')
);
```

### Coupon Management

```typescript
// Create a coupon
const coupon = await billing.createCoupon({
  code: 'SAVE10',
  name: '10% Off',
  description: '10% discount on first month',
  type: 'percentage',
  percentOff: 10,
  duration: 'repeating',
  durationInMonths: 1
});

// Apply coupon when creating subscription
const subscriptionWithCoupon = await billing.createSubscription({
  customerId: customer.id,
  planId: plan.id,
  couponCode: 'SAVE10'
});
```

### Payment Processing

```typescript
// Process a payment directly
const payment = await billing.processPayment({
  invoiceId: invoice.id,
  paymentMethod: 'stripe',
  paymentDetails: {
    // Payment-specific details
  }
});

// Create a payment intent (for Stripe)
const paymentIntentId = await billing.createPaymentIntent({
  amount: 10000, // $100.00 in cents
  currency: 'usd',
  customerId: customer.id
});
```

### Dashboard Information

```typescript
// Get billing dashboard data
const dashboardData = await billing.getBillingDashboard();
console.log({
  totalCustomers: dashboardData.totalCustomers,
  activeSubscriptions: dashboardData.activeSubscriptions,
  monthlyRecurringRevenue: dashboardData.monthlyRecurringRevenue,
  totalRevenue: dashboardData.totalRevenue
});
```

## Storage

The billing system uses a pluggable storage backend. By default, it uses in-memory storage, but you can implement your own:

```typescript
import { StorageBackend, Customer, Plan, Subscription, Invoice, Payment, UsageRecord, Metric, Coupon, Discount } from 'billing-system';

class MyStorage implements StorageBackend {
  async initialize(): Promise<void> {
    // Initialize your storage (e.g., connect to database)
  }

  async close(): Promise<void> {
    // Close storage connection
  }

  // Implement all required methods...

  async createCustomer(customer: Customer): Promise<void> {
    // Store customer in your system
  }

  // ... implement other methods
}

// Use your custom storage
const billing = new BillingManager({
  storage: new MyStorage(),
  currency: 'usd'
});
```

## API Reference

### BillingManager

#### `constructor(config: BillingConfig)`

Initializes a new billing manager.

**Parameters:**
- `config` (optional): Configuration object
  - `stripeSecretKey`: Stripe secret key for payment processing
  - `storage`: Custom storage backend (defaults to in-memory storage)
  - `currency`: Default currency code (default: 'usd')
  - `taxRate`: Default tax rate (0-1, default: 0)

#### `initialize()`

Initializes the billing manager and storage backend.

#### `close()`

Closes the storage connections.

#### `createCustomer(customerData)`

Creates a new customer in the billing system.

#### `getCustomer(customerId)`

Retrieves a customer by ID.

#### `updateCustomer(customerId, updateData)`

Updates customer information.

#### `createPlan(planData)`

Creates a new subscription plan.

#### `getPlan(planId)`

Retrieves a plan by ID.

#### `updatePlan(planId, updateData)`

Updates plan information.

#### `createSubscription(request)`

Creates a new subscription for a customer.

#### `updateSubscription(subscriptionId, request)`

Updates an existing subscription.

#### `cancelSubscription(subscriptionId, reason)`

Cancels a subscription.

#### `createInvoice(request)`

Creates a manual invoice.

#### `processPayment(request)`

Processes a payment for an invoice.

#### `recordUsage(subscriptionId, metricId, quantity)`

Records usage for usage-based billing.

## Data Models

### Customer
- `id`: Unique identifier
- `email`: Customer email
- `name`: Customer name
- `address`: Billing address
- `taxInfo`: Tax information
- `createdAt`, `updatedAt`: Timestamps

### Plan
- `id`: Unique identifier
- `name`, `description`: Plan details
- `amount`: Price in cents
- `currency`: Currency code
- `interval`: Billing interval ('day', 'week', 'month', 'year')
- `intervalCount`: Number of intervals between billing
- `trialPeriodDays`: Trial period in days
- `features`: List of features included

### Subscription
- `id`: Unique identifier
- `customerId`, `planId`: References to customer and plan
- `status`: Subscription status
- `startDate`, `endDate`: Subscription period
- `currentPeriodStart`, `currentPeriodEnd`: Current billing period

### Invoice
- `id`: Unique identifier
- `customerId`, `subscriptionId`: References
- `invoiceNumber`: Human-readable invoice number
- `status`: Invoice status
- `amount`, `amountDue`, `amountPaid`: Financial details
- `lineItems`: List of charges
- `tax`, `subtotal`, `total`: Calculated amounts

## Types

### SubscriptionStatus
- `ACTIVE`, `INACTIVE`, `PAST_DUE`, `CANCELLED`, `TRIALING`, `UNPAID`

### PlanInterval
- `DAY`, `WEEK`, `MONTH`, `YEAR`

### InvoiceStatus
- `DRAFT`, `OPEN`, `PAID`, `UNCOLLECTIBLE`, `VOID`

### PaymentMethod
- `CREDIT_CARD`, `DEBIT_CARD`, `BANK_TRANSFER`, `PAYPAL`, `STRIPE`

## License

MIT