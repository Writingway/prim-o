import { stripe } from '../lib/stripe';
import { prisma } from '../lib/db';
import { Prisma } from '@prisma/client';

// Checkout session type derived from the Stripe client instance, because Stripe v22 no longer
// exposes the Stripe.Checkout.Session namespace.
export type CheckoutSession = Awaited<ReturnType<typeof stripe.checkout.sessions.retrieve>>;

// Fulfills a confirmed payment: credits the company pool and records the purchase. Idempotent -
// a redelivered event for the same payment is a no-op.
export async function fulfillCheckout(session: CheckoutSession): Promise<void> {
  // Only credit once the money is actually captured. With async payment methods (SEPA, Pix, ...)
  // `checkout.session.completed` can arrive while the session is still `unpaid`; the capture is
  // signalled later by `checkout.session.async_payment_succeeded`. Return without erroring so
  // Stripe does not keep retrying an event that will never become paid in this form.
  if (session.payment_status !== 'paid') {
    return;
  }

  const companyId = session.metadata?.companyId;
  const createdById = session.metadata?.createdById;
  const tokenAmount = Number(session.metadata?.tokenAmount);

  if (!companyId || !createdById || !Number.isInteger(tokenAmount) || tokenAmount <= 0) {
    throw new Error('INVALID_SESSION_METADATA');
  }

  try {
    await prisma.$transaction(async (tx) => {
      // The @unique stripeSessionId makes this insert the idempotency guard: a replayed event
      // aborts the transaction with P2002 before the balance is touched.
      await tx.companyTokenPurchase.create({
        data: {
          amount: tokenAmount,
          note: 'Recharge Stripe',
          companyId,
          createdById,
          stripeSessionId: session.id,
        },
      });
      await tx.company.update({
        where: { id: companyId },
        data: { tokenBalance: { increment: tokenAmount } },
      });
    });
  } catch (err) {
    // P2002 (unique violation) means this payment was already credited - swallow the redelivery.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return;
    }
    throw err;
  }
}
