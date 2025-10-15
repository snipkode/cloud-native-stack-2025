import { BillingManager, PlanInterval } from './src';

async function example() {
  // Initialize the billing system
  const billing = new BillingManager({
    currency: 'usd',
    taxRate: 0.085, // 8.5% tax
  });

  // Initialize storage (required for async operations)
  await billing.initialize();

  console.log('=== Billing System Example ===\n');

  try {
    // Create a customer
    console.log('1. Creating customer...');
    const customer = await billing.createCustomer({
      email: 'john.doe@example.com',
      name: 'John Doe',
      address: {
        line1: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        country: 'US'
      }
    });
    console.log(`   Created customer: ${customer.name} (${customer.email})\n`);

    // Create a subscription plan
    console.log('2. Creating a subscription plan...');
    const plan = await billing.createPlan({
      name: 'Professional Plan',
      description: 'Access to all professional features',
      amount: 2999, // $29.99 in cents
      currency: 'usd',
      interval: PlanInterval.MONTH,
      intervalCount: 1,
      trialPeriodDays: 14,
      features: [
        'Up to 10 users',
        'Priority support',
        'Advanced analytics',
        'API access'
      ],
      isActive: true
    });
    console.log(`   Created plan: ${plan.name} ($${plan.amount / 100}/${plan.interval})\n`);

    // Create a coupon
    console.log('3. Creating a coupon...');
    const coupon = await billing.createCoupon({
      code: 'FALL20',
      name: 'Fall 20% Off',
      description: '20% discount for new customers',
      type: 'percentage',
      percentOff: 20,
      duration: 'once',
      valid: true
    });
    console.log(`   Created coupon: ${coupon.code} (${coupon.percentOff}% off)\n`);

    // Create a subscription with the coupon
    console.log('4. Creating a subscription with coupon...');
    const subscription = await billing.createSubscription({
      customerId: customer.id,
      planId: plan.id,
      couponCode: 'FALL20' // Apply the coupon
    });
    console.log(`   Created subscription: ${subscription.id}\n`);

    // Record some usage (for usage-based billing)
    console.log('5. Recording usage...');
    await billing.recordUsage(subscription.id, 'api_calls', 1500);
    await billing.recordUsage(subscription.id, 'storage_gb', 25);
    console.log('   Recorded usage: 1500 API calls, 25GB storage\n');

    // Create an invoice for the subscription
    console.log('6. Creating invoice for subscription...');
    const invoice = await billing.createInvoiceForSubscription(subscription.id);
    if (invoice) {
      console.log(`   Created invoice: ${invoice.invoiceNumber}`);
      console.log(`   Amount: $${invoice.total / 100}`);
      console.log(`   Status: ${invoice.status}\n`);
    }

    // Process a payment for the invoice
    console.log('7. Processing payment...');
    const payment = await billing.processPayment({
      invoiceId: invoice!.id,
      paymentMethod: 'credit_card',
      paymentDetails: {
        // In a real implementation, this would contain actual payment details
        cardLast4: '1234',
        cardBrand: 'Visa'
      }
    });
    console.log(`   Processed payment: $${payment!.amount / 100}\n`);

    // Get customer's subscriptions
    console.log('8. Getting customer subscriptions...');
    const customerSubscriptions = await billing.listSubscriptionsByCustomer(customer.id);
    console.log(`   Customer has ${customerSubscriptions.length} subscription(s)\n`);

    // Get billing dashboard info
    console.log('9. Getting billing dashboard data...');
    const dashboard = await billing.getBillingDashboard();
    console.log(`   Total customers: ${dashboard.totalCustomers}`);
    console.log(`   Active subscriptions: ${dashboard.activeSubscriptions}`);
    console.log(`   MRR: $${dashboard.monthlyRecurringRevenue / 100}`);
    console.log(`   Total revenue: $${dashboard.totalRevenue / 100}\n`);

    console.log('Example completed successfully!');
  } catch (error) {
    console.error('Error in example:', error);
  } finally {
    // Close the storage connection
    await billing.close();
  }
}

// Run the example
example().catch(console.error);