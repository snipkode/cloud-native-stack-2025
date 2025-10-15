"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingManager = void 0;
const moment_1 = __importDefault(require("moment"));
const stripe_1 = __importDefault(require("stripe"));
const types_1 = require("./types");
const storage_1 = require("./storage");
const pricing_1 = require("./pricing");
class BillingManager {
    constructor(config = {}) {
        this.stripe = null;
        this.config = {
            stripeSecretKey: config.stripeSecretKey,
            storage: config.storage || new storage_1.InMemoryStorage(),
            currency: config.currency || 'usd',
            taxRate: config.taxRate || 0
        };
        this.storage = this.config.storage;
        if (this.config.stripeSecretKey) {
            this.stripe = new stripe_1.default(this.config.stripeSecretKey, {
                apiVersion: '2022-11-15', // Using a valid API version
            });
        }
    }
    async initialize() {
        await this.storage.initialize();
    }
    async close() {
        await this.storage.close();
    }
    // Customer management
    async createCustomer(customerData) {
        const customer = {
            ...customerData,
            id: (0, types_1.generateId)(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await this.storage.createCustomer(customer);
        return customer;
    }
    async getCustomer(customerId) {
        return await this.storage.getCustomer(customerId);
    }
    async updateCustomer(customerId, updateData) {
        const customer = await this.storage.getCustomer(customerId);
        if (!customer)
            return null;
        const updatedCustomer = {
            ...customer,
            ...updateData,
            updatedAt: new Date()
        };
        await this.storage.updateCustomer(updatedCustomer);
        return updatedCustomer;
    }
    async deleteCustomer(customerId) {
        await this.storage.deleteCustomer(customerId);
        return true;
    }
    // Plan management
    async createPlan(planData) {
        const plan = {
            ...planData,
            id: (0, types_1.generateId)(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await this.storage.createPlan(plan);
        return plan;
    }
    async getPlan(planId) {
        return await this.storage.getPlan(planId);
    }
    async updatePlan(planId, updateData) {
        const plan = await this.storage.getPlan(planId);
        if (!plan)
            return null;
        const updatedPlan = {
            ...plan,
            ...updateData,
            updatedAt: new Date()
        };
        await this.storage.updatePlan(updatedPlan);
        return updatedPlan;
    }
    async listPlans() {
        return await this.storage.listPlans();
    }
    // Subscription management
    async createSubscription(request) {
        const customer = await this.storage.getCustomer(request.customerId);
        if (!customer) {
            throw new Error(`Customer with id ${request.customerId} does not exist`);
        }
        const plan = await this.storage.getPlan(request.planId);
        if (!plan) {
            throw new Error(`Plan with id ${request.planId} does not exist`);
        }
        // Check if customer already has an active subscription to this plan
        const existingSubscriptions = await this.storage.listSubscriptionsByCustomer(request.customerId);
        const existingPlanSubscription = existingSubscriptions.find(sub => sub.planId === request.planId && sub.status === types_1.SubscriptionStatus.ACTIVE);
        if (existingPlanSubscription) {
            throw new Error(`Customer already has an active subscription to plan ${request.planId}`);
        }
        // Handle coupon if provided
        let coupon = null;
        if (request.couponCode) {
            coupon = await this.storage.getCouponByCode(request.couponCode);
            if (!coupon || !coupon.valid) {
                throw new Error(`Invalid or expired coupon: ${request.couponCode}`);
            }
        }
        const now = new Date();
        const startDate = now;
        const currentPeriodEnd = this.calculateNextBillingDate(now, plan);
        const subscription = {
            id: (0, types_1.generateId)(),
            customerId: request.customerId,
            planId: request.planId,
            status: request.trialEnd ? types_1.SubscriptionStatus.TRIALING : types_1.SubscriptionStatus.ACTIVE,
            startDate: startDate,
            currentPeriodStart: startDate,
            currentPeriodEnd: currentPeriodEnd,
            trialEnd: request.trialEnd || (plan.trialPeriodDays > 0 ? (0, moment_1.default)(now).add(plan.trialPeriodDays, 'days').toDate() : undefined),
            cancelAtPeriodEnd: false,
            createdAt: now,
            updatedAt: now
        };
        await this.storage.createSubscription(subscription);
        // Create discount if coupon is provided
        if (coupon) {
            const discount = {
                id: (0, types_1.generateId)(),
                couponId: coupon.id,
                subscriptionId: subscription.id,
                start: now,
                createdAt: now
            };
            // Set discount end date if coupon has duration
            if (coupon.duration === 'repeating' && coupon.durationInMonths) {
                discount.end = (0, moment_1.default)(now).add(coupon.durationInMonths, 'months').toDate();
            }
            else if (coupon.duration === 'once') {
                discount.end = currentPeriodEnd; // End after current billing period
            }
            await this.storage.createDiscount(discount);
            // Update coupon redemption count
            coupon.timesRedeemed += 1;
            if (coupon.maxRedemptions && coupon.timesRedeemed >= coupon.maxRedemptions) {
                coupon.valid = false;
            }
            await this.storage.updateCoupon(coupon);
        }
        // Generate initial invoice if not in trial
        if (!request.trialEnd && plan.trialPeriodDays <= 0) {
            await this.createInvoiceForSubscription(subscription.id);
        }
        return subscription;
    }
    async updateSubscription(subscriptionId, request) {
        const subscription = await this.storage.getSubscription(subscriptionId);
        if (!subscription)
            return null;
        const updatedSubscription = {
            ...subscription,
            ...request,
            updatedAt: new Date()
        };
        // If plan is being changed, prorate the change
        if (request.planId && request.planId !== subscription.planId) {
            await this.handlePlanChange(subscription, request.planId);
        }
        // If trial end is being changed
        if (request.trialEnd) {
            updatedSubscription.trialEnd = request.trialEnd;
            // If we're moving from trial to active
            if (request.trialEnd < new Date()) {
                updatedSubscription.status = types_1.SubscriptionStatus.ACTIVE;
            }
        }
        // If cancellation is requested
        if (request.cancelAtPeriodEnd !== undefined) {
            updatedSubscription.cancelAtPeriodEnd = request.cancelAtPeriodEnd;
            if (request.cancelAtPeriodEnd) {
                updatedSubscription.status = types_1.SubscriptionStatus.CANCELLED;
            }
            else if (subscription.status === types_1.SubscriptionStatus.CANCELLED) {
                updatedSubscription.status = types_1.SubscriptionStatus.ACTIVE;
            }
        }
        if (request.cancellationReason) {
            updatedSubscription.cancellationReason = request.cancellationReason;
        }
        await this.storage.updateSubscription(updatedSubscription);
        return updatedSubscription;
    }
    async cancelSubscription(subscriptionId, reason) {
        const subscription = await this.storage.getSubscription(subscriptionId);
        if (!subscription)
            return null;
        const updatedSubscription = {
            ...subscription,
            status: types_1.SubscriptionStatus.CANCELLED,
            cancelAtPeriodEnd: true,
            cancellationReason: reason,
            updatedAt: new Date()
        };
        await this.storage.updateSubscription(updatedSubscription);
        return updatedSubscription;
    }
    async getSubscription(subscriptionId) {
        return await this.storage.getSubscription(subscriptionId);
    }
    async listSubscriptionsByCustomer(customerId) {
        return await this.storage.listSubscriptionsByCustomer(customerId);
    }
    // Invoice management
    async createInvoice(request) {
        const customer = await this.storage.getCustomer(request.customerId);
        if (!customer) {
            throw new Error(`Customer with id ${request.customerId} does not exist`);
        }
        // For manual invoices, we might want to check for applicable coupons
        // For this implementation, we'll proceed without coupon lookup for manual invoices
        // but the pricing calculator can be used for tax calculations
        const now = new Date();
        // Calculate pricing using the pricing calculator
        // Note: For manual invoices, we're not applying coupons by default
        // but the calculator can be extended to support this
        const pricingDetails = pricing_1.PricingCalculator.calculateInvoicePrice(request.lineItems.map(item => ({ ...item })), // Copy the line items
        customer, this.config.taxRate || 0 // Pass the default tax rate
        );
        const invoice = {
            id: (0, types_1.generateId)(),
            customerId: request.customerId,
            invoiceNumber: (0, types_1.generateInvoiceNumber)(),
            status: types_1.InvoiceStatus.DRAFT,
            amount: pricingDetails.total,
            amountDue: pricingDetails.total,
            amountPaid: 0,
            currency: this.config.currency || 'usd',
            dueDate: request.dueDate,
            issueDate: now,
            lineItems: request.lineItems.map(item => ({
                ...item,
                id: (0, types_1.generateId)(),
                proration: false // Manual invoices are typically not prorated
            })),
            tax: pricingDetails.taxAmount,
            subtotal: pricingDetails.subtotal,
            total: pricingDetails.total,
            createdAt: now,
            updatedAt: now
        };
        await this.storage.createInvoice(invoice);
        return invoice;
    }
    async createInvoiceForSubscription(subscriptionId) {
        const subscription = await this.storage.getSubscription(subscriptionId);
        if (!subscription)
            return null;
        const plan = await this.storage.getPlan(subscription.planId);
        if (!plan)
            return null;
        const customer = await this.storage.getCustomer(subscription.customerId);
        if (!customer)
            return null;
        // Get applicable discount/coupon for this subscription
        const discounts = await this.storage.listDiscountsBySubscription(subscriptionId);
        let coupon = null;
        if (discounts.length > 0) {
            const discount = discounts[0]; // Take the first discount
            coupon = await this.storage.getCoupon(discount.couponId);
        }
        // Calculate usage-based charges if any
        const usageCharges = await this.calculateUsageCharges(subscriptionId);
        // Calculate pricing using the pricing calculator
        const pricingDetails = pricing_1.PricingCalculator.calculateSubscriptionPrice(plan, customer, this.config.taxRate || 0, // Pass the default tax rate
        coupon, usageCharges);
        const now = new Date();
        const lineItems = [
            {
                id: (0, types_1.generateId)(),
                description: plan.name,
                amount: plan.amount,
                quantity: 1,
                currency: plan.currency,
                planId: plan.id,
                subscriptionId: subscription.id,
                proration: false
            },
            ...usageCharges.map(usage => ({
                id: (0, types_1.generateId)(),
                description: usage.description,
                amount: usage.amount,
                quantity: usage.quantity,
                currency: plan.currency,
                subscriptionId: subscription.id,
                proration: false
            }))
        ];
        const invoice = {
            id: (0, types_1.generateId)(),
            customerId: subscription.customerId,
            subscriptionId: subscription.id,
            invoiceNumber: (0, types_1.generateInvoiceNumber)(),
            status: types_1.InvoiceStatus.OPEN,
            amount: pricingDetails.total,
            amountDue: pricingDetails.total,
            amountPaid: 0,
            currency: plan.currency,
            dueDate: (0, moment_1.default)(now).add(30, 'days').toDate(), // Default 30 days due
            issueDate: now,
            lineItems,
            tax: pricingDetails.taxAmount,
            subtotal: pricingDetails.subtotal,
            total: pricingDetails.total,
            createdAt: now,
            updatedAt: now
        };
        await this.storage.createInvoice(invoice);
        return invoice;
    }
    async getInvoice(invoiceId) {
        return await this.storage.getInvoice(invoiceId);
    }
    async listInvoicesByCustomer(customerId) {
        return await this.storage.listInvoicesByCustomer(customerId);
    }
    async listInvoicesBySubscription(subscriptionId) {
        return await this.storage.listInvoicesBySubscription(subscriptionId);
    }
    // Payment processing
    async processPayment(request) {
        const invoice = await this.storage.getInvoice(request.invoiceId);
        if (!invoice)
            return null;
        if (invoice.status !== types_1.InvoiceStatus.OPEN) {
            throw new Error(`Invoice ${request.invoiceId} is not open for payment`);
        }
        const now = new Date();
        const payment = {
            id: (0, types_1.generateId)(),
            invoiceId: request.invoiceId,
            customerId: invoice.customerId,
            amount: invoice.amountDue,
            currency: invoice.currency,
            method: request.paymentMethod,
            status: 'succeeded', // In a real implementation, this would be determined by the payment processor
            transactionId: `txn_${Date.now()}`, // In a real implementation, this would come from the payment processor
            paidAt: now,
            createdAt: now,
            updatedAt: now
        };
        // Update invoice status based on payment
        invoice.amountPaid += payment.amount;
        invoice.amountDue -= payment.amount;
        if (invoice.amountDue <= 0) {
            invoice.status = types_1.InvoiceStatus.PAID;
        }
        invoice.updatedAt = now;
        await this.storage.createPayment(payment);
        await this.storage.updateInvoice(invoice);
        return payment;
    }
    async createPaymentIntent(request) {
        if (!this.stripe) {
            throw new Error('Stripe is not configured');
        }
        try {
            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: request.amount,
                currency: request.currency,
                customer: request.customerId,
                description: request.description,
                metadata: request.metadata || {}
            });
            return paymentIntent.id;
        }
        catch (error) {
            console.error('Error creating payment intent:', error);
            return null;
        }
    }
    // Usage-based billing
    async recordUsage(subscriptionId, metricId, quantity) {
        const subscription = await this.storage.getSubscription(subscriptionId);
        if (!subscription) {
            throw new Error(`Subscription with id ${subscriptionId} does not exist`);
        }
        const metric = await this.storage.getMetric(metricId);
        if (!metric) {
            throw new Error(`Metric with id ${metricId} does not exist`);
        }
        const usageRecord = {
            id: (0, types_1.generateId)(),
            subscriptionId,
            metricId,
            quantity,
            timestamp: new Date(),
            action: 'increment',
            createdAt: new Date()
        };
        await this.storage.createUsageRecord(usageRecord);
        return usageRecord;
    }
    async getUsageForSubscription(subscriptionId, metricId, periodStart, periodEnd) {
        const usageRecords = await this.storage.listUsageRecordsBySubscription(subscriptionId);
        return usageRecords
            .filter(record => record.metricId === metricId &&
            record.timestamp >= periodStart &&
            record.timestamp <= periodEnd)
            .reduce((sum, record) => sum + record.quantity, 0);
    }
    // Coupon management
    async createCoupon(couponData) {
        const coupon = {
            ...couponData,
            id: (0, types_1.generateId)(),
            timesRedeemed: 0,
            valid: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await this.storage.createCoupon(coupon);
        return coupon;
    }
    async getCoupon(couponId) {
        return await this.storage.getCoupon(couponId);
    }
    async getCouponByCode(code) {
        return await this.storage.getCouponByCode(code);
    }
    // Helper methods
    calculateNextBillingDate(startDate, plan) {
        const nextDate = new Date(startDate);
        switch (plan.interval) {
            case 'day':
                nextDate.setDate(nextDate.getDate() + plan.intervalCount);
                break;
            case 'week':
                nextDate.setDate(nextDate.getDate() + (plan.intervalCount * 7));
                break;
            case 'month':
                nextDate.setMonth(nextDate.getMonth() + plan.intervalCount);
                break;
            case 'year':
                nextDate.setFullYear(nextDate.getFullYear() + plan.intervalCount);
                break;
        }
        return nextDate;
    }
    async handlePlanChange(oldSubscription, newPlanId) {
        const newPlan = await this.storage.getPlan(newPlanId);
        if (!newPlan) {
            throw new Error(`Plan with id ${newPlanId} does not exist`);
        }
        const oldPlan = await this.storage.getPlan(oldSubscription.planId);
        if (!oldPlan) {
            throw new Error(`Old plan with id ${oldSubscription.planId} does not exist`);
        }
        // Calculate proration when changing plans mid-cycle
        const prorationResult = pricing_1.PricingCalculator.calculateProration(oldPlan, newPlan, oldSubscription.currentPeriodStart, oldSubscription.currentPeriodEnd, new Date() // prorated as of today
        );
        // If there's a net amount due (positive) or credit owed (negative)
        if (prorationResult.netAmount !== 0) {
            // Create an invoice for the prorated amount
            const invoiceRequest = {
                customerId: oldSubscription.customerId,
                lineItems: [
                    {
                        description: prorationResult.netAmount > 0
                            ? 'Plan change proration charge'
                            : 'Plan change proration credit',
                        amount: Math.abs(prorationResult.netAmount),
                        quantity: 1,
                        currency: oldPlan.currency,
                        proration: true
                    }
                ],
                dueDate: (0, moment_1.default)().add(30, 'days').toDate(),
                taxRate: 0 // Assuming no tax on prorations, but this could be configurable
            };
            await this.createInvoice(invoiceRequest);
        }
    }
    async calculateUsageCharges(subscriptionId) {
        // In a real implementation, this would calculate usage-based charges
        // For now, returning an empty array
        return [];
    }
    // Get billing dashboard data
    async getBillingDashboard() {
        const customers = await this.storage.listCustomers();
        const plans = await this.storage.listPlans();
        // Get all active subscriptions
        let allActiveSubscriptions = [];
        for (const plan of plans) {
            const subs = await this.storage.listSubscriptionsByPlan(plan.id);
            allActiveSubscriptions = allActiveSubscriptions.concat(subs.filter(sub => sub.status === types_1.SubscriptionStatus.ACTIVE));
        }
        // Calculate MRR by summing up the monthly value of all active subscriptions
        let monthlyRecurringRevenue = 0;
        for (const sub of allActiveSubscriptions) {
            const plan = await this.storage.getPlan(sub.planId);
            if (plan) {
                // Convert plan amount to monthly if needed
                let monthlyAmount = plan.amount;
                if (plan.interval === 'year') {
                    monthlyAmount = Math.round(plan.amount / 12);
                }
                else if (plan.interval === 'week') {
                    monthlyAmount = plan.amount * 4; // Approximate
                }
                else if (plan.interval === 'day') {
                    monthlyAmount = plan.amount * 30; // Approximate
                }
                monthlyRecurringRevenue += monthlyAmount;
            }
        }
        // Calculate total revenue from paid invoices
        let allInvoices = [];
        for (const customer of customers) {
            const customerInvoices = await this.storage.listInvoicesByCustomer(customer.id);
            allInvoices = allInvoices.concat(customerInvoices);
        }
        const totalRevenue = allInvoices
            .filter(inv => inv.status === types_1.InvoiceStatus.PAID)
            .reduce((sum, inv) => sum + inv.amount, 0);
        return {
            totalCustomers: customers.length,
            activeSubscriptions: allActiveSubscriptions.length,
            monthlyRecurringRevenue,
            totalRevenue
        };
    }
}
exports.BillingManager = BillingManager;
//# sourceMappingURL=BillingManager.js.map