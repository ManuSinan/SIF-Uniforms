// Razorpay isn't integrated yet: checkout uses an instant "mock" payment.
// That shortcut must never run in production, where it would let orders through unpaid.
export function isMockPaymentAllowed(): boolean {
  return process.env.NODE_ENV !== "production";
}

export const MOCK_PAYMENT_DISABLED_MESSAGE =
  "Online payment isn't set up yet. Please contact the school to complete this order.";
