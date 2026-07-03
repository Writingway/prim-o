import { authRequest } from "./client";

// Creates a Stripe Checkout session to top up the pool (logged-in manager).
// Returns the Stripe-hosted URL the browser should be redirected to.
export function createCheckout(amount: number) {
  return authRequest('POST', '/stripe/checkout', { amount }) as Promise<{
    ok: boolean;
    status: number;
    data: { url: string } | null;
  }>;
}