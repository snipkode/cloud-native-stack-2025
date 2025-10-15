"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentMethod = exports.InvoiceStatus = exports.PlanInterval = exports.SubscriptionStatus = void 0;
exports.generateInvoiceNumber = generateInvoiceNumber;
exports.generateId = generateId;
const uuid_1 = require("uuid");
// Enums for billing system
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["ACTIVE"] = "active";
    SubscriptionStatus["INACTIVE"] = "inactive";
    SubscriptionStatus["PAST_DUE"] = "past_due";
    SubscriptionStatus["CANCELLED"] = "cancelled";
    SubscriptionStatus["TRIALING"] = "trialing";
    SubscriptionStatus["UNPAID"] = "unpaid";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
var PlanInterval;
(function (PlanInterval) {
    PlanInterval["DAY"] = "day";
    PlanInterval["WEEK"] = "week";
    PlanInterval["MONTH"] = "month";
    PlanInterval["YEAR"] = "year";
})(PlanInterval || (exports.PlanInterval = PlanInterval = {}));
var InvoiceStatus;
(function (InvoiceStatus) {
    InvoiceStatus["DRAFT"] = "draft";
    InvoiceStatus["OPEN"] = "open";
    InvoiceStatus["PAID"] = "paid";
    InvoiceStatus["UNCOLLECTIBLE"] = "uncollectible";
    InvoiceStatus["VOID"] = "void";
})(InvoiceStatus || (exports.InvoiceStatus = InvoiceStatus = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CREDIT_CARD"] = "credit_card";
    PaymentMethod["DEBIT_CARD"] = "debit_card";
    PaymentMethod["BANK_TRANSFER"] = "bank_transfer";
    PaymentMethod["PAYPAL"] = "paypal";
    PaymentMethod["STRIPE"] = "stripe";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
// Utility functions
function generateInvoiceNumber() {
    // Generate a unique invoice number in format INV-YYYYMMDD-XXXX
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digit random number
    return `INV-${dateStr}-${randomPart}`;
}
function generateId() {
    return (0, uuid_1.v4)();
}
//# sourceMappingURL=types.js.map