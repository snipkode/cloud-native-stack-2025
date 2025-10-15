export declare enum SubscriptionStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    PAST_DUE = "past_due",
    CANCELLED = "cancelled",
    TRIALING = "trialing",
    UNPAID = "unpaid"
}
export declare enum PlanInterval {
    DAY = "day",
    WEEK = "week",
    MONTH = "month",
    YEAR = "year"
}
export declare enum InvoiceStatus {
    DRAFT = "draft",
    OPEN = "open",
    PAID = "paid",
    UNCOLLECTIBLE = "uncollectible",
    VOID = "void"
}
export declare enum PaymentMethod {
    CREDIT_CARD = "credit_card",
    DEBIT_CARD = "debit_card",
    BANK_TRANSFER = "bank_transfer",
    PAYPAL = "paypal",
    STRIPE = "stripe"
}
export interface Customer {
    id: string;
    email: string;
    name: string;
    address?: Address;
    taxInfo?: TaxInfo;
    createdAt: Date;
    updatedAt: Date;
    stripeCustomerId?: string;
}
export interface Address {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}
export interface TaxInfo {
    taxId: string;
    taxRate: number;
}
export interface Plan {
    id: string;
    name: string;
    description: string;
    amount: number;
    currency: string;
    interval: PlanInterval;
    intervalCount: number;
    trialPeriodDays: number;
    features: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface Subscription {
    id: string;
    customerId: string;
    planId: string;
    status: SubscriptionStatus;
    startDate: Date;
    endDate?: Date;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    trialEnd?: Date;
    cancelAtPeriodEnd: boolean;
    cancellationReason?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface Invoice {
    id: string;
    customerId: string;
    subscriptionId?: string;
    invoiceNumber: string;
    status: InvoiceStatus;
    amount: number;
    amountDue: number;
    amountPaid: number;
    currency: string;
    dueDate?: Date;
    issueDate: Date;
    lineItems: InvoiceLineItem[];
    tax: number;
    subtotal: number;
    total: number;
    paymentIntentId?: string;
    hostedInvoiceUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface InvoiceLineItem {
    id: string;
    description: string;
    amount: number;
    quantity: number;
    currency: string;
    planId?: string;
    subscriptionId?: string;
    proration: boolean;
}
export interface Payment {
    id: string;
    invoiceId: string;
    customerId: string;
    amount: number;
    currency: string;
    method: PaymentMethod;
    status: 'succeeded' | 'failed' | 'pending';
    transactionId: string;
    receiptUrl?: string;
    errorMessage?: string;
    paidAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface UsageRecord {
    id: string;
    subscriptionId: string;
    metricId: string;
    quantity: number;
    timestamp: Date;
    action: 'increment' | 'set';
    createdAt: Date;
}
export interface Metric {
    id: string;
    name: string;
    description: string;
    unitLabel: string;
    aggregationMethod: 'sum' | 'last_during_period' | 'max' | 'total' | 'avg';
    createdAt: Date;
    updatedAt: Date;
}
export interface Coupon {
    id: string;
    code: string;
    name: string;
    description: string;
    type: 'percentage' | 'fixed_amount';
    amountOff?: number;
    percentOff?: number;
    currency?: string;
    duration: 'once' | 'repeating' | 'forever';
    durationInMonths?: number;
    maxRedemptions?: number;
    redeemBy?: Date;
    timesRedeemed: number;
    valid: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface Discount {
    id: string;
    couponId: string;
    subscriptionId?: string;
    invoiceId?: string;
    customer?: Customer;
    start: Date;
    end?: Date;
    createdAt: Date;
}
export interface CreateSubscriptionRequest {
    customerId: string;
    planId: string;
    trialEnd?: Date;
    couponCode?: string;
    metadata?: Record<string, any>;
}
export interface UpdateSubscriptionRequest {
    planId?: string;
    trialEnd?: Date;
    cancelAtPeriodEnd?: boolean;
    cancellationReason?: string;
    metadata?: Record<string, any>;
}
export interface CreateInvoiceRequest {
    customerId: string;
    lineItems: Omit<InvoiceLineItem, 'id'>[];
    dueDate?: Date;
    taxRate?: number;
    metadata?: Record<string, any>;
}
export interface PaymentIntentRequest {
    amount: number;
    currency: string;
    customerId: string;
    description?: string;
    metadata?: Record<string, any>;
}
export interface ProcessPaymentRequest {
    invoiceId: string;
    paymentMethod: PaymentMethod;
    paymentDetails: Record<string, any>;
    metadata?: Record<string, any>;
}
export declare function generateInvoiceNumber(): string;
export declare function generateId(): string;
//# sourceMappingURL=types.d.ts.map