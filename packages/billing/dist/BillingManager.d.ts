import { Customer, Plan, Subscription, Invoice, Payment, UsageRecord, Coupon, CreateSubscriptionRequest, UpdateSubscriptionRequest, CreateInvoiceRequest, PaymentIntentRequest, ProcessPaymentRequest } from './types';
import { StorageBackend } from './storage';
export interface BillingConfig {
    stripeSecretKey?: string;
    storage?: StorageBackend;
    currency?: string;
    taxRate?: number;
}
export declare class BillingManager {
    private stripe;
    private storage;
    private config;
    constructor(config?: BillingConfig);
    initialize(): Promise<void>;
    close(): Promise<void>;
    createCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer>;
    getCustomer(customerId: string): Promise<Customer | null>;
    updateCustomer(customerId: string, updateData: Partial<Customer>): Promise<Customer | null>;
    deleteCustomer(customerId: string): Promise<boolean>;
    createPlan(planData: Omit<Plan, 'id' | 'createdAt' | 'updatedAt'>): Promise<Plan>;
    getPlan(planId: string): Promise<Plan | null>;
    updatePlan(planId: string, updateData: Partial<Plan>): Promise<Plan | null>;
    listPlans(): Promise<Plan[]>;
    createSubscription(request: CreateSubscriptionRequest): Promise<Subscription>;
    updateSubscription(subscriptionId: string, request: UpdateSubscriptionRequest): Promise<Subscription | null>;
    cancelSubscription(subscriptionId: string, reason?: string): Promise<Subscription | null>;
    getSubscription(subscriptionId: string): Promise<Subscription | null>;
    listSubscriptionsByCustomer(customerId: string): Promise<Subscription[]>;
    createInvoice(request: CreateInvoiceRequest): Promise<Invoice>;
    createInvoiceForSubscription(subscriptionId: string): Promise<Invoice | null>;
    getInvoice(invoiceId: string): Promise<Invoice | null>;
    listInvoicesByCustomer(customerId: string): Promise<Invoice[]>;
    listInvoicesBySubscription(subscriptionId: string): Promise<Invoice[]>;
    processPayment(request: ProcessPaymentRequest): Promise<Payment | null>;
    createPaymentIntent(request: PaymentIntentRequest): Promise<string | null>;
    recordUsage(subscriptionId: string, metricId: string, quantity: number): Promise<UsageRecord>;
    getUsageForSubscription(subscriptionId: string, metricId: string, periodStart: Date, periodEnd: Date): Promise<number>;
    createCoupon(couponData: Omit<Coupon, 'id' | 'timesRedeemed' | 'valid' | 'createdAt' | 'updatedAt'>): Promise<Coupon>;
    getCoupon(couponId: string): Promise<Coupon | null>;
    getCouponByCode(code: string): Promise<Coupon | null>;
    private calculateNextBillingDate;
    private handlePlanChange;
    private calculateUsageCharges;
    getBillingDashboard(): Promise<{
        totalCustomers: number;
        activeSubscriptions: number;
        monthlyRecurringRevenue: number;
        totalRevenue: number;
    }>;
}
//# sourceMappingURL=BillingManager.d.ts.map