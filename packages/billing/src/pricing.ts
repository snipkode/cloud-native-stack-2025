import { Plan, Coupon, Invoice, InvoiceLineItem, Subscription, Customer } from './types';

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

export class PricingCalculator {
  /**
   * Calculate the total price for a subscription considering all discounts and taxes
   */
  static calculateSubscriptionPrice(
    plan: Plan,
    customer: Customer,
    defaultTaxRate: number = 0,
    coupon?: Coupon | null,
    usageCharges: { description: string; amount: number }[] = []
  ): PricingDetails {
    // Calculate base amount from plan
    let baseAmount = plan.amount;
    
    // Add usage charges
    const usageAmount = usageCharges.reduce((sum, charge) => sum + charge.amount, 0);
    let subtotal = baseAmount + usageAmount;
    
    // Apply coupon discount if available
    let discountAmount = 0;
    let discountDetails = undefined;
    
    if (coupon) {
      if (coupon.type === 'percentage' && coupon.percentOff) {
        discountAmount = Math.round(subtotal * (coupon.percentOff / 100));
      } else if (coupon.type === 'fixed_amount' && coupon.amountOff) {
        discountAmount = Math.min(coupon.amountOff, subtotal); // Can't discount more than the subtotal
      }
      
      discountDetails = {
        couponId: coupon.id,
        type: coupon.type,
        amount: discountAmount
      };
    }
    
    const afterDiscount = subtotal - discountAmount;
    
    // Calculate tax - use customer tax rate if available, otherwise use default
    const taxRate = customer.taxInfo?.taxRate || defaultTaxRate;
    const taxAmount = Math.round(afterDiscount * taxRate);
    
    const total = afterDiscount + taxAmount;
    
    return {
      subtotal,
      discountAmount,
      taxAmount,
      total,
      breakdown: {
        baseAmount,
        usageAmount,
        discountDetails
      }
    };
  }

  /**
   * Calculate the price for a one-time invoice
   */
  static calculateInvoicePrice(
    lineItems: Omit<InvoiceLineItem, 'id' | 'proration' | 'subscriptionId' | 'planId'>[],
    customer: Customer,
    defaultTaxRate: number = 0,
    coupon?: Coupon | null
  ): PricingDetails {
    // Calculate subtotal from line items
    const subtotal = lineItems.reduce((sum, item) => sum + (item.amount * item.quantity), 0);
    
    // Apply coupon discount if available
    let discountAmount = 0;
    let discountDetails = undefined;
    
    if (coupon) {
      if (coupon.type === 'percentage' && coupon.percentOff) {
        discountAmount = Math.round(subtotal * (coupon.percentOff / 100));
      } else if (coupon.type === 'fixed_amount' && coupon.amountOff) {
        discountAmount = Math.min(coupon.amountOff, subtotal); // Can't discount more than the subtotal
      }
      
      discountDetails = {
        couponId: coupon.id,
        type: coupon.type,
        amount: discountAmount
      };
    }
    
    const afterDiscount = subtotal - discountAmount;
    
    // Calculate tax - use customer tax rate if available, otherwise use default
    const taxRate = customer.taxInfo?.taxRate || defaultTaxRate;
    const taxAmount = Math.round(afterDiscount * taxRate);
    
    const total = afterDiscount + taxAmount;
    
    return {
      subtotal,
      discountAmount,
      taxAmount,
      total,
      breakdown: {
        baseAmount: subtotal,
        usageAmount: 0,
        discountDetails
      }
    };
  }

  /**
   * Calculate prorated amount when changing plans mid-cycle
   */
  static calculateProration(
    oldPlan: Plan,
    newPlan: Plan,
    periodStart: Date,
    periodEnd: Date,
    prorationDate: Date
  ): { 
    amountToRefund: number; 
    amountToCharge: number; 
    netAmount: number; // positive means customer owes money, negative means credit
  } {
    // Calculate the fraction of the billing period that has passed
    const periodDuration = periodEnd.getTime() - periodStart.getTime();
    const timePassed = prorationDate.getTime() - periodStart.getTime();
    const fractionPassed = timePassed / periodDuration;
    
    // Calculate how much of each plan's cost has been "used"
    const oldPlanUsed = Math.round(oldPlan.amount * fractionPassed);
    const newPlanUsed = Math.round(newPlan.amount * fractionPassed);
    
    // Calculate the adjustment needed
    const amountToRefund = oldPlan.amount - oldPlanUsed;  // Amount remaining on old plan
    const amountToCharge = newPlanUsed;  // Amount used on new plan
    
    // Net amount the customer owes (can be negative if they're due a credit)
    const netAmount = amountToCharge - amountToRefund;
    
    return {
      amountToRefund: Math.max(0, amountToRefund),  // Can't refund more than was paid
      amountToCharge,
      netAmount
    };
  }

  /**
   * Calculate trial end price (typically free)
   */
  static calculateTrialPrice(plan: Plan, daysInTrial: number): PricingDetails {
    // During trial, the customer doesn't pay the recurring amount
    // But they might still have usage charges
    return {
      subtotal: 0,
      discountAmount: 0,
      taxAmount: 0,
      total: 0,
      breakdown: {
        baseAmount: 0,
        usageAmount: 0
      }
    };
  }

  /**
   * Calculate the cost of adding additional users or resources
   */
  static calculateAddOnPrice(basePrice: number, addOnQuantity: number, pricePerUnit: number): number {
    return basePrice + (addOnQuantity * pricePerUnit);
  }
}