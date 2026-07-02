import { stripe } from '../lib/stripe';
import { config } from '../config';
import { prisma } from '../lib/db';

// Creates a Stripe Checkout session to top up the company token pool. Returns the Stripe-hosted
// payment page URL the manager must be redirected to.
export async function createCheckoutSession(
  managerId: string,
  companyId: string,
  amount: number,
): Promise<string> {
  // Business rule: a company that is not APPROVED (PENDING/REJECTED) is inert — no pool top-ups.
  // Enforced server-side before any Stripe call.
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { status: true },
  });
  if (!company || company.status !== 'APPROVED') {
    throw new Error('COMPANY_INACTIVE');
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: { name: `Recharge de ${amount} token(s) Prim'O` },
          unit_amount: config.TOKEN_PRICE_CENTS, // price of ONE token, in cents
        },
        quantity: amount, // total charged = unit_amount × quantity
      },
    ],
    // Stripe round-trips this metadata into the webhook event, telling fulfillment what to credit.
    metadata: {
      companyId,
      createdById: managerId,
      tokenAmount: String(amount),
    },
    success_url: `${config.CLIENT_URL}/?payment=success`,
    cancel_url: `${config.CLIENT_URL}/?payment=cancel`,
  });

  if (!session.url) {
    throw new Error('STRIPE_SESSION_NO_URL');
  }
  return session.url;
}
