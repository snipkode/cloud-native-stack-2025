import { v4 as uuidv4 } from 'uuid';

// Enums for billing system
export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PAST_DUE = 'past_due',
  CANCELLED = 'cancelled',
  TRIALING = 'trialing',
  UNPAID = 'unpaid'
}

export enum PlanInterval {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year'
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  PAID = 'paid',
  UNCOLLECTIBLE = 'uncollectible',
  VOID = 'void'
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  PAYPAL = 'paypal',
  STRIPE = 'stripe'
}

// Core interfaces
export interface Customer {
  id: string;
  email: string;
  name: string;
  address?: Address;
  taxInfo?: TaxInfo;
  createdAt: Date;
  updatedAt: Date;
  stripeCustomerId?: string; // For Stripe integration
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
  taxRate: number; // 0 to 1 (e.g. 0.08 for 8%)
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  amount: number; // Price in cents
  currency: string; // e.g. 'usd'
  interval: PlanInterval; // Billing interval
  intervalCount: number; // Number of intervals between billing (e.g. every 3 months)
  trialPeriodDays: number; // Number of trial days
  features: string[]; // List of features included
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
  endDate?: Date; // Only for fixed-term subscriptions
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEnd?: Date; // When trial period ends
  cancelAtPeriodEnd: boolean; // Whether to cancel at period end
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  customerId: string;
  subscriptionId?: string;
  invoiceNumber: string; // Human-readable invoice number
  status: InvoiceStatus;
  amount: number; // Total amount in cents
  amountDue: number; // Amount still due in cents
  amountPaid: number; // Amount paid in cents
  currency: string; // e.g. 'usd'
  dueDate?: Date; // When payment is due
  issueDate: Date; // When invoice was issued
  lineItems: InvoiceLineItem[];
  tax: number; // Tax amount in cents
  subtotal: number; // Subtotal amount in cents
  total: number; // Total amount in cents
  paymentIntentId?: string; // Stripe payment intent ID
  hostedInvoiceUrl?: string; // URL to hosted invoice page
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  amount: number; // Amount in cents
  quantity: number;
  currency: string;
  planId?: string;
  subscriptionId?: string;
  proration: boolean; // Whether this item is prorated
}

export interface Payment {
  id: string;
  invoiceId: string;
  customerId: string;
  amount: number; // Amount in cents
  currency: string;
  method: PaymentMethod;
  status: 'succeeded' | 'failed' | 'pending';
  transactionId: string; // External transaction ID
  receiptUrl?: string; // URL to receipt
  errorMessage?: string; // If payment failed
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
  action: 'increment' | 'set'; // How to record the usage
  createdAt: Date;
}

export interface Metric {
  id: string;
  name: string;
  description: string;
  unitLabel: string; // e.g. 'GB', 'requests', 'users'
  aggregationMethod: 'sum' | 'last_during_period' | 'max' | 'total' | 'avg'; // How to aggregate usage
  createdAt: Date;
  updatedAt: Date;
}

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed_amount'; // Whether it's a percentage or fixed amount discount
  amountOff?: number; // Amount off in cents (for fixed amount)
  percentOff?: number; // Percentage off (0-100)
  currency?: string; // Currency for fixed amount discounts
  duration: 'once' | 'repeating' | 'forever'; // How long the discount will be in effect
  durationInMonths?: number; // Number of months for 'repeating' coupons
  maxRedemptions?: number; // Max number of times coupon can be redeemed
  redeemBy?: Date; // Date after which coupon can't be redeemed
  timesRedeemed: number; // Number of times already redeemed
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
  start: Date; // When discount starts
  end?: Date; // When discount ends (null for forever)
  createdAt: Date;
}

// Request/Response types
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
  amount: number; // Amount in cents
  currency: string;
  customerId: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface ProcessPaymentRequest {
  invoiceId: string;
  paymentMethod: PaymentMethod;
  paymentDetails: Record<string, any>; // Payment-specific details
  metadata?: Record<string, any>;
}

// Utility functions
export function generateInvoiceNumber(): string {
  // Generate a unique invoice number in format INV-YYYYMMDD-XXXX
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digit random number
  return `INV-${dateStr}-${randomPart}`;
}

export function generateId(): string {
  return uuidv4();
}