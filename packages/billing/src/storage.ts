import { 
  Customer, 
  Plan, 
  Subscription, 
  Invoice, 
  Payment, 
  UsageRecord, 
  Metric, 
  Coupon, 
  Discount 
} from './types';

export interface StorageBackend {
  initialize(): Promise<void>;
  close(): Promise<void>;

  // Customer operations
  createCustomer(customer: Customer): Promise<void>;
  getCustomer(customerId: string): Promise<Customer | null>;
  updateCustomer(customer: Customer): Promise<void>;
  deleteCustomer(customerId: string): Promise<void>;
  listCustomers(): Promise<Customer[]>;

  // Plan operations
  createPlan(plan: Plan): Promise<void>;
  getPlan(planId: string): Promise<Plan | null>;
  updatePlan(plan: Plan): Promise<void>;
  deletePlan(planId: string): Promise<void>;
  listPlans(): Promise<Plan[]>;

  // Subscription operations
  createSubscription(subscription: Subscription): Promise<void>;
  getSubscription(subscriptionId: string): Promise<Subscription | null>;
  updateSubscription(subscription: Subscription): Promise<void>;
  deleteSubscription(subscriptionId: string): Promise<void>;
  listSubscriptionsByCustomer(customerId: string): Promise<Subscription[]>;
  listSubscriptionsByPlan(planId: string): Promise<Subscription[]>;

  // Invoice operations
  createInvoice(invoice: Invoice): Promise<void>;
  getInvoice(invoiceId: string): Promise<Invoice | null>;
  updateInvoice(invoice: Invoice): Promise<void>;
  deleteInvoice(invoiceId: string): Promise<void>;
  listInvoicesByCustomer(customerId: string): Promise<Invoice[]>;
  listInvoicesBySubscription(subscriptionId: string): Promise<Invoice[]>;

  // Payment operations
  createPayment(payment: Payment): Promise<void>;
  getPayment(paymentId: string): Promise<Payment | null>;
  updatePayment(payment: Payment): Promise<void>;
  listPaymentsByCustomer(customerId: string): Promise<Payment[]>;
  listPaymentsByInvoice(invoiceId: string): Promise<Payment[]>;

  // Usage record operations
  createUsageRecord(usageRecord: UsageRecord): Promise<void>;
  getUsageRecord(usageRecordId: string): Promise<UsageRecord | null>;
  listUsageRecordsBySubscription(subscriptionId: string): Promise<UsageRecord[]>;

  // Metric operations
  createMetric(metric: Metric): Promise<void>;
  getMetric(metricId: string): Promise<Metric | null>;
  listMetrics(): Promise<Metric[]>;

  // Coupon operations
  createCoupon(coupon: Coupon): Promise<void>;
  getCoupon(couponId: string): Promise<Coupon | null>;
  getCouponByCode(code: string): Promise<Coupon | null>;
  updateCoupon(coupon: Coupon): Promise<void>;
  listCoupons(): Promise<Coupon[]>;

  // Discount operations
  createDiscount(discount: Discount): Promise<void>;
  getDiscount(discountId: string): Promise<Discount | null>;
  listDiscountsByCustomer(customerId: string): Promise<Discount[]>;
  listDiscountsBySubscription(subscriptionId: string): Promise<Discount[]>;
}

export class InMemoryStorage implements StorageBackend {
  private customers: Map<string, Customer> = new Map();
  private plans: Map<string, Plan> = new Map();
  private subscriptions: Map<string, Subscription> = new Map();
  private invoices: Map<string, Invoice> = new Map();
  private payments: Map<string, Payment> = new Map();
  private usageRecords: Map<string, UsageRecord> = new Map();
  private metrics: Map<string, Metric> = new Map();
  private coupons: Map<string, Coupon> = new Map();
  private discounts: Map<string, Discount> = new Map();

  async initialize(): Promise<void> {
    // Nothing needed for in-memory storage
  }

  async close(): Promise<void> {
    // Nothing needed for in-memory storage
  }

  // Customer operations
  async createCustomer(customer: Customer): Promise<void> {
    this.customers.set(customer.id, customer);
  }

  async getCustomer(customerId: string): Promise<Customer | null> {
    return this.customers.get(customerId) || null;
  }

  async updateCustomer(customer: Customer): Promise<void> {
    if (this.customers.has(customer.id)) {
      this.customers.set(customer.id, customer);
    }
  }

  async deleteCustomer(customerId: string): Promise<void> {
    this.customers.delete(customerId);
  }

  async listCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  // Plan operations
  async createPlan(plan: Plan): Promise<void> {
    this.plans.set(plan.id, plan);
  }

  async getPlan(planId: string): Promise<Plan | null> {
    return this.plans.get(planId) || null;
  }

  async updatePlan(plan: Plan): Promise<void> {
    if (this.plans.has(plan.id)) {
      this.plans.set(plan.id, plan);
    }
  }

  async deletePlan(planId: string): Promise<void> {
    this.plans.delete(planId);
  }

  async listPlans(): Promise<Plan[]> {
    return Array.from(this.plans.values());
  }

  // Subscription operations
  async createSubscription(subscription: Subscription): Promise<void> {
    this.subscriptions.set(subscription.id, subscription);
  }

  async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    return this.subscriptions.get(subscriptionId) || null;
  }

  async updateSubscription(subscription: Subscription): Promise<void> {
    if (this.subscriptions.has(subscription.id)) {
      this.subscriptions.set(subscription.id, subscription);
    }
  }

  async deleteSubscription(subscriptionId: string): Promise<void> {
    this.subscriptions.delete(subscriptionId);
  }

  async listSubscriptionsByCustomer(customerId: string): Promise<Subscription[]> {
    return Array.from(this.subscriptions.values()).filter(
      sub => sub.customerId === customerId
    );
  }

  async listSubscriptionsByPlan(planId: string): Promise<Subscription[]> {
    return Array.from(this.subscriptions.values()).filter(
      sub => sub.planId === planId
    );
  }

  // Invoice operations
  async createInvoice(invoice: Invoice): Promise<void> {
    this.invoices.set(invoice.id, invoice);
  }

  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    return this.invoices.get(invoiceId) || null;
  }

  async updateInvoice(invoice: Invoice): Promise<void> {
    if (this.invoices.has(invoice.id)) {
      this.invoices.set(invoice.id, invoice);
    }
  }

  async deleteInvoice(invoiceId: string): Promise<void> {
    this.invoices.delete(invoiceId);
  }

  async listInvoicesByCustomer(customerId: string): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(
      inv => inv.customerId === customerId
    );
  }

  async listInvoicesBySubscription(subscriptionId: string): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(
      inv => inv.subscriptionId === subscriptionId
    );
  }

  // Payment operations
  async createPayment(payment: Payment): Promise<void> {
    this.payments.set(payment.id, payment);
  }

  async getPayment(paymentId: string): Promise<Payment | null> {
    return this.payments.get(paymentId) || null;
  }

  async updatePayment(payment: Payment): Promise<void> {
    if (this.payments.has(payment.id)) {
      this.payments.set(payment.id, payment);
    }
  }

  async listPaymentsByCustomer(customerId: string): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      p => p.customerId === customerId
    );
  }

  async listPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      p => p.invoiceId === invoiceId
    );
  }

  // Usage record operations
  async createUsageRecord(usageRecord: UsageRecord): Promise<void> {
    this.usageRecords.set(usageRecord.id, usageRecord);
  }

  async getUsageRecord(usageRecordId: string): Promise<UsageRecord | null> {
    return this.usageRecords.get(usageRecordId) || null;
  }

  async listUsageRecordsBySubscription(subscriptionId: string): Promise<UsageRecord[]> {
    return Array.from(this.usageRecords.values()).filter(
      ur => ur.subscriptionId === subscriptionId
    );
  }

  // Metric operations
  async createMetric(metric: Metric): Promise<void> {
    this.metrics.set(metric.id, metric);
  }

  async getMetric(metricId: string): Promise<Metric | null> {
    return this.metrics.get(metricId) || null;
  }

  async listMetrics(): Promise<Metric[]> {
    return Array.from(this.metrics.values());
  }

  // Coupon operations
  async createCoupon(coupon: Coupon): Promise<void> {
    this.coupons.set(coupon.id, coupon);
  }

  async getCoupon(couponId: string): Promise<Coupon | null> {
    return this.coupons.get(couponId) || null;
  }

  async getCouponByCode(code: string): Promise<Coupon | null> {
    for (const coupon of this.coupons.values()) {
      if (coupon.code === code) {
        return coupon;
      }
    }
    return null;
  }

  async updateCoupon(coupon: Coupon): Promise<void> {
    if (this.coupons.has(coupon.id)) {
      this.coupons.set(coupon.id, coupon);
    }
  }

  async listCoupons(): Promise<Coupon[]> {
    return Array.from(this.coupons.values());
  }

  // Discount operations
  async createDiscount(discount: Discount): Promise<void> {
    this.discounts.set(discount.id, discount);
  }

  async getDiscount(discountId: string): Promise<Discount | null> {
    return this.discounts.get(discountId) || null;
  }

  async listDiscountsByCustomer(customerId: string): Promise<Discount[]> {
    return Array.from(this.discounts.values()).filter(
      d => d.customer?.id === customerId
    );
  }

  async listDiscountsBySubscription(subscriptionId: string): Promise<Discount[]> {
    return Array.from(this.discounts.values()).filter(
      d => d.subscriptionId === subscriptionId
    );
  }
}