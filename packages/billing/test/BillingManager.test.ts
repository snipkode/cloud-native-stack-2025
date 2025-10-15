import { BillingManager, Customer, Plan, Subscription, Invoice, PlanInterval, SubscriptionStatus, PaymentMethod, InvoiceStatus } from '../src';

describe('BillingManager', () => {
  let billing: BillingManager;

  beforeEach(async () => {
    billing = new BillingManager({ currency: 'usd', taxRate: 0.1 }); // 10% tax
    await billing.initialize();
  });

  afterEach(async () => {
    await billing.close();
  });

  describe('Customer Management', () => {
    it('should create a customer', async () => {
      const customer = await billing.createCustomer({
        email: 'test@example.com',
        name: 'Test User'
      });

      expect(customer).toBeDefined();
      expect(customer.email).toBe('test@example.com');
      expect(customer.name).toBe('Test User');
      expect(customer.id).toBeDefined();
      expect(customer.createdAt).toBeDefined();
      expect(customer.updatedAt).toBeDefined();
    });

    it('should retrieve a customer', async () => {
      const customer = await billing.createCustomer({
        email: 'test2@example.com',
        name: 'Test User 2'
      });

      const retrievedCustomer = await billing.getCustomer(customer.id);
      expect(retrievedCustomer).toBeDefined();
      expect(retrievedCustomer?.email).toBe('test2@example.com');
    });

    it('should update a customer', async () => {
      const customer = await billing.createCustomer({
        email: 'original@example.com',
        name: 'Original Name'
      });

      const updatedCustomer = await billing.updateCustomer(customer.id, {
        name: 'Updated Name'
      });

      expect(updatedCustomer).toBeDefined();
      expect(updatedCustomer?.name).toBe('Updated Name');
    });

    it('should delete a customer', async () => {
      const customer = await billing.createCustomer({
        email: 'delete@example.com',
        name: 'To Delete'
      });

      const deleted = await billing.deleteCustomer(customer.id);
      expect(deleted).toBe(true);

      const retrievedCustomer = await billing.getCustomer(customer.id);
      expect(retrievedCustomer).toBeNull();
    });
  });

  describe('Plan Management', () => {
    it('should create a plan', async () => {
      const plan = await billing.createPlan({
        name: 'Test Plan',
        description: 'A test plan',
        amount: 1000, // $10.00
        currency: 'usd',
        interval: PlanInterval.MONTH,
        intervalCount: 1,
        trialPeriodDays: 0,
        features: ['Feature 1', 'Feature 2'],
        isActive: true
      });

      expect(plan).toBeDefined();
      expect(plan.name).toBe('Test Plan');
      expect(plan.amount).toBe(1000);
      expect(plan.interval).toBe(PlanInterval.MONTH);
    });

    it('should retrieve a plan', async () => {
      const plan = await billing.createPlan({
        name: 'Retrieve Test Plan',
        description: 'A test plan',
        amount: 1500, // $15.00
        currency: 'usd',
        interval: PlanInterval.MONTH,
        intervalCount: 1,
        trialPeriodDays: 0,
        features: ['Feature 1'],
        isActive: true
      });

      const retrievedPlan = await billing.getPlan(plan.id);
      expect(retrievedPlan).toBeDefined();
      expect(retrievedPlan?.name).toBe('Retrieve Test Plan');
    });
  });

  describe('Subscription Management', () => {
    it('should create a subscription', async () => {
      const customer = await billing.createCustomer({
        email: 'subscriber@example.com',
        name: 'Subscriber'
      });

      const plan = await billing.createPlan({
        name: 'Subscription Test Plan',
        description: 'A test plan for subscription',
        amount: 2000, // $20.00
        currency: 'usd',
        interval: PlanInterval.MONTH,
        intervalCount: 1,
        trialPeriodDays: 0,
        features: ['Feature 1'],
        isActive: true
      });

      const subscription = await billing.createSubscription({
        customerId: customer.id,
        planId: plan.id
      });

      expect(subscription).toBeDefined();
      expect(subscription.customerId).toBe(customer.id);
      expect(subscription.planId).toBe(plan.id);
      expect(subscription.status).toBe(SubscriptionStatus.ACTIVE);
    });

    it('should fail to create subscription for non-existent customer', async () => {
      const plan = await billing.createPlan({
        name: 'Bad Subscription Plan',
        description: 'A test plan',
        amount: 2500,
        currency: 'usd',
        interval: PlanInterval.MONTH,
        intervalCount: 1,
        trialPeriodDays: 0,
        features: ['Feature 1'],
        isActive: true
      });

      await expect(billing.createSubscription({
        customerId: 'non-existent-id',
        planId: plan.id
      })).rejects.toThrow('Customer with id non-existent-id does not exist');
    });

    it('should list subscriptions by customer', async () => {
      const customer = await billing.createCustomer({
        email: 'list@example.com',
        name: 'List Test'
      });

      const plan = await billing.createPlan({
        name: 'List Test Plan',
        description: 'A test plan',
        amount: 3000,
        currency: 'usd',
        interval: PlanInterval.MONTH,
        intervalCount: 1,
        trialPeriodDays: 0,
        features: ['Feature 1'],
        isActive: true
      });

      const subscription = await billing.createSubscription({
        customerId: customer.id,
        planId: plan.id
      });

      const customerSubscriptions = await billing.listSubscriptionsByCustomer(customer.id);
      expect(customerSubscriptions).toHaveLength(1);
      expect(customerSubscriptions[0].id).toBe(subscription.id);
    });
  });

  describe('Invoice Management', () => {
    it('should create a manual invoice', async () => {
      const customer = await billing.createCustomer({
        email: 'invoice@example.com',
        name: 'Invoice Test'
      });

      const invoice = await billing.createInvoice({
        customerId: customer.id,
        lineItems: [
          {
            description: 'Setup fee',
            amount: 5000, // $50.00
            quantity: 1,
            currency: 'usd',
            proration: false
          }
        ]
      });

      expect(invoice).toBeDefined();
      expect(invoice.customerId).toBe(customer.id);
      expect(invoice.amount).toBe(5500); // Including 10% tax (5000 + 500)
      expect(invoice.tax).toBe(500); // 10% tax on 5000
      expect(invoice.lineItems).toHaveLength(1);
      expect(invoice.lineItems[0].description).toBe('Setup fee');
    });

    it('should create invoice for subscription', async () => {
      const customer = await billing.createCustomer({
        email: 'sub-invoice@example.com',
        name: 'Subscription Invoice Test'
      });

      const plan = await billing.createPlan({
        name: 'Invoice Test Plan',
        description: 'A test plan',
        amount: 1000, // $10.00
        currency: 'usd',
        interval: PlanInterval.MONTH,
        intervalCount: 1,
        trialPeriodDays: 0,
        features: ['Feature 1'],
        isActive: true
      });

      const subscription = await billing.createSubscription({
        customerId: customer.id,
        planId: plan.id
      });

      const invoice = await billing.createInvoiceForSubscription(subscription.id);
      expect(invoice).toBeDefined();
      if (invoice) {
        expect(invoice.customerId).toBe(customer.id);
        expect(invoice.subscriptionId).toBe(subscription.id);
        // The amount should be the plan amount plus tax
        expect(invoice.total).toBe(1100); // 1000 (plan) + 100 (10% tax)
        expect(invoice.tax).toBe(100); // 10% tax on 1000
      }
    });

    it('should list invoices by customer', async () => {
      const customer = await billing.createCustomer({
        email: 'list-invoice@example.com',
        name: 'List Invoice Test'
      });

      const invoice = await billing.createInvoice({
        customerId: customer.id,
        lineItems: [
          {
            description: 'Test item',
            amount: 1000,
            quantity: 1,
            currency: 'usd',
            proration: false
          }
        ]
      });

      const customerInvoices = await billing.listInvoicesByCustomer(customer.id);
      expect(customerInvoices).toHaveLength(1);
      expect(customerInvoices[0].id).toBe(invoice.id);
    });
  });

  describe('Usage Tracking', () => {
    it('should record and retrieve usage', async () => {
      const customer = await billing.createCustomer({
        email: 'usage@example.com',
        name: 'Usage Test'
      });

      const plan = await billing.createPlan({
        name: 'Usage Test Plan',
        description: 'A test plan',
        amount: 1000,
        currency: 'usd',
        interval: PlanInterval.MONTH,
        intervalCount: 1,
        trialPeriodDays: 0,
        features: ['Feature 1'],
        isActive: true
      });

      // Create a metric for usage tracking
      await billing['storage'].createMetric({
        id: 'api_calls',
        name: 'API Calls',
        description: 'Number of API calls made',
        unitLabel: 'calls',
        aggregationMethod: 'sum',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const subscription = await billing.createSubscription({
        customerId: customer.id,
        planId: plan.id
      });

      // Record usage
      const usageRecord = await billing.recordUsage(subscription.id, 'api_calls', 150);
      expect(usageRecord).toBeDefined();
      expect(usageRecord.subscriptionId).toBe(subscription.id);
      expect(usageRecord.metricId).toBe('api_calls');
      expect(usageRecord.quantity).toBe(150);

      // Get usage for the subscription
      const usage = await billing.getUsageForSubscription(
        subscription.id,
        'api_calls',
        new Date(0), // From beginning of time
        new Date()   // To now
      );
      expect(usage).toBe(150);
    });
  });

  describe('Coupon Management', () => {
    it('should create and retrieve a coupon', async () => {
      const coupon = await billing.createCoupon({
        code: 'TEST10',
        name: 'Test 10% Off',
        description: '10% discount',
        type: 'percentage',
        percentOff: 10,
        duration: 'once'
      });

      expect(coupon).toBeDefined();
      expect(coupon.code).toBe('TEST10');
      expect(coupon.percentOff).toBe(10);

      const retrievedCoupon = await billing.getCouponByCode('TEST10');
      expect(retrievedCoupon).toBeDefined();
      expect(retrievedCoupon?.code).toBe('TEST10');
    });
  });

  describe('Payment Processing', () => {
    it('should process a payment', async () => {
      const customer = await billing.createCustomer({
        email: 'payment@example.com',
        name: 'Payment Test'
      });

      const invoice = await billing.createInvoice({
        customerId: customer.id,
        lineItems: [
          {
            description: 'Service',
            amount: 1000, // $10.00
            quantity: 1,
            currency: 'usd',
            proration: false
          }
        ]
      });

      // Update invoice status to OPEN so payment can be processed
      await billing['storage'].updateInvoice({
        ...invoice,
        status: InvoiceStatus.OPEN
      });

      const payment = await billing.processPayment({
        invoiceId: invoice.id,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        paymentDetails: {}
      });

      expect(payment).toBeDefined();
      expect(payment?.invoiceId).toBe(invoice.id);
      expect(payment?.customerId).toBe(customer.id);
      expect(payment?.status).toBe('succeeded');
    });

    it('should fail to process payment for non-existent invoice', async () => {
      await expect(billing.processPayment({
        invoiceId: 'non-existent-invoice',
        paymentMethod: PaymentMethod.CREDIT_CARD,
        paymentDetails: {}
      })).resolves.toBeNull();
    });
  });

  describe('Dashboard Data', () => {
    it('should return billing dashboard data', async () => {
      // Create some test data
      await billing.createCustomer({
        email: 'dashboard1@example.com',
        name: 'Dashboard Test 1'
      });

      await billing.createCustomer({
        email: 'dashboard2@example.com',
        name: 'Dashboard Test 2'
      });

      const plan = await billing.createPlan({
        name: 'Dashboard Test Plan',
        description: 'A test plan',
        amount: 1000,
        currency: 'usd',
        interval: PlanInterval.MONTH,
        intervalCount: 1,
        trialPeriodDays: 0,
        features: ['Feature 1'],
        isActive: true
      });

      const customer = await billing.createCustomer({
        email: 'dashboard3@example.com',
        name: 'Dashboard Test 3'
      });

      await billing.createSubscription({
        customerId: customer.id,
        planId: plan.id
      });

      const dashboard = await billing.getBillingDashboard();
      expect(dashboard).toBeDefined();
      expect(dashboard.totalCustomers).toBeGreaterThanOrEqual(3);
      expect(dashboard.activeSubscriptions).toBeGreaterThanOrEqual(1);
      expect(dashboard.totalRevenue).toBeGreaterThanOrEqual(0);
    });
  });
});