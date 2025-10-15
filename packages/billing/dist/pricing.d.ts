import { Plan, Coupon, InvoiceLineItem, Customer } from './types';
export interface PricingDetails {
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    total: number;
    breakdown: {
        baseAmount: number;
        usageAmount: number;
        discountDetails?: {
            couponId: string;
            type: 'percentage' | 'fixed_amount';
            amount: number;
        };
    };
}
export declare class PricingCalculator {
    /**
     * Calculate the total price for a subscription considering all discounts and taxes
     */
    static calculateSubscriptionPrice(plan: Plan, customer: Customer, defaultTaxRate?: number, coupon?: Coupon | null, usageCharges?: {
        description: string;
        amount: number;
    }[]): PricingDetails;
    /**
     * Calculate the price for a one-time invoice
     */
    static calculateInvoicePrice(lineItems: Omit<InvoiceLineItem, 'id' | 'proration' | 'subscriptionId' | 'planId'>[], customer: Customer, defaultTaxRate?: number, coupon?: Coupon | null): PricingDetails;
    /**
     * Calculate prorated amount when changing plans mid-cycle
     */
    static calculateProration(oldPlan: Plan, newPlan: Plan, periodStart: Date, periodEnd: Date, prorationDate: Date): {
        amountToRefund: number;
        amountToCharge: number;
        netAmount: number;
    };
    /**
     * Calculate trial end price (typically free)
     */
    static calculateTrialPrice(plan: Plan, daysInTrial: number): PricingDetails;
    /**
     * Calculate the cost of adding additional users or resources
     */
    static calculateAddOnPrice(basePrice: number, addOnQuantity: number, pricePerUnit: number): number;
}
//# sourceMappingURL=pricing.d.ts.map