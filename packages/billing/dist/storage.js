"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryStorage = void 0;
class InMemoryStorage {
    constructor() {
        this.customers = new Map();
        this.plans = new Map();
        this.subscriptions = new Map();
        this.invoices = new Map();
        this.payments = new Map();
        this.usageRecords = new Map();
        this.metrics = new Map();
        this.coupons = new Map();
        this.discounts = new Map();
    }
    async initialize() {
        // Nothing needed for in-memory storage
    }
    async close() {
        // Nothing needed for in-memory storage
    }
    // Customer operations
    async createCustomer(customer) {
        this.customers.set(customer.id, customer);
    }
    async getCustomer(customerId) {
        return this.customers.get(customerId) || null;
    }
    async updateCustomer(customer) {
        if (this.customers.has(customer.id)) {
            this.customers.set(customer.id, customer);
        }
    }
    async deleteCustomer(customerId) {
        this.customers.delete(customerId);
    }
    async listCustomers() {
        return Array.from(this.customers.values());
    }
    // Plan operations
    async createPlan(plan) {
        this.plans.set(plan.id, plan);
    }
    async getPlan(planId) {
        return this.plans.get(planId) || null;
    }
    async updatePlan(plan) {
        if (this.plans.has(plan.id)) {
            this.plans.set(plan.id, plan);
        }
    }
    async deletePlan(planId) {
        this.plans.delete(planId);
    }
    async listPlans() {
        return Array.from(this.plans.values());
    }
    // Subscription operations
    async createSubscription(subscription) {
        this.subscriptions.set(subscription.id, subscription);
    }
    async getSubscription(subscriptionId) {
        return this.subscriptions.get(subscriptionId) || null;
    }
    async updateSubscription(subscription) {
        if (this.subscriptions.has(subscription.id)) {
            this.subscriptions.set(subscription.id, subscription);
        }
    }
    async deleteSubscription(subscriptionId) {
        this.subscriptions.delete(subscriptionId);
    }
    async listSubscriptionsByCustomer(customerId) {
        return Array.from(this.subscriptions.values()).filter(sub => sub.customerId === customerId);
    }
    async listSubscriptionsByPlan(planId) {
        return Array.from(this.subscriptions.values()).filter(sub => sub.planId === planId);
    }
    // Invoice operations
    async createInvoice(invoice) {
        this.invoices.set(invoice.id, invoice);
    }
    async getInvoice(invoiceId) {
        return this.invoices.get(invoiceId) || null;
    }
    async updateInvoice(invoice) {
        if (this.invoices.has(invoice.id)) {
            this.invoices.set(invoice.id, invoice);
        }
    }
    async deleteInvoice(invoiceId) {
        this.invoices.delete(invoiceId);
    }
    async listInvoicesByCustomer(customerId) {
        return Array.from(this.invoices.values()).filter(inv => inv.customerId === customerId);
    }
    async listInvoicesBySubscription(subscriptionId) {
        return Array.from(this.invoices.values()).filter(inv => inv.subscriptionId === subscriptionId);
    }
    // Payment operations
    async createPayment(payment) {
        this.payments.set(payment.id, payment);
    }
    async getPayment(paymentId) {
        return this.payments.get(paymentId) || null;
    }
    async updatePayment(payment) {
        if (this.payments.has(payment.id)) {
            this.payments.set(payment.id, payment);
        }
    }
    async listPaymentsByCustomer(customerId) {
        return Array.from(this.payments.values()).filter(p => p.customerId === customerId);
    }
    async listPaymentsByInvoice(invoiceId) {
        return Array.from(this.payments.values()).filter(p => p.invoiceId === invoiceId);
    }
    // Usage record operations
    async createUsageRecord(usageRecord) {
        this.usageRecords.set(usageRecord.id, usageRecord);
    }
    async getUsageRecord(usageRecordId) {
        return this.usageRecords.get(usageRecordId) || null;
    }
    async listUsageRecordsBySubscription(subscriptionId) {
        return Array.from(this.usageRecords.values()).filter(ur => ur.subscriptionId === subscriptionId);
    }
    // Metric operations
    async createMetric(metric) {
        this.metrics.set(metric.id, metric);
    }
    async getMetric(metricId) {
        return this.metrics.get(metricId) || null;
    }
    async listMetrics() {
        return Array.from(this.metrics.values());
    }
    // Coupon operations
    async createCoupon(coupon) {
        this.coupons.set(coupon.id, coupon);
    }
    async getCoupon(couponId) {
        return this.coupons.get(couponId) || null;
    }
    async getCouponByCode(code) {
        for (const coupon of this.coupons.values()) {
            if (coupon.code === code) {
                return coupon;
            }
        }
        return null;
    }
    async updateCoupon(coupon) {
        if (this.coupons.has(coupon.id)) {
            this.coupons.set(coupon.id, coupon);
        }
    }
    async listCoupons() {
        return Array.from(this.coupons.values());
    }
    // Discount operations
    async createDiscount(discount) {
        this.discounts.set(discount.id, discount);
    }
    async getDiscount(discountId) {
        return this.discounts.get(discountId) || null;
    }
    async listDiscountsByCustomer(customerId) {
        return Array.from(this.discounts.values()).filter(d => d.customer?.id === customerId);
    }
    async listDiscountsBySubscription(subscriptionId) {
        return Array.from(this.discounts.values()).filter(d => d.subscriptionId === subscriptionId);
    }
}
exports.InMemoryStorage = InMemoryStorage;
//# sourceMappingURL=storage.js.map