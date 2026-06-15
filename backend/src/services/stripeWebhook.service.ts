import { stripe } from '../lib/stripe';
import { prisma } from '../lib/db';
import { Prisma } from '@prisma/client';

// Type de la session Checkout, dérivé directement de l'instance Stripe.
// (Stripe v22 n'expose plus le namespace Stripe.Checkout.Session.)
export type CheckoutSession = Awaited<ReturnType<typeof stripe.checkout.sessions.retrieve>>;

// Traite un paiement confirmé : crédite le pool + enregistre l'achat.
// Idempotent : si le même paiement arrive 2 fois, le 2e est ignoré.
export async function fulfillCheckout(session: CheckoutSession): Promise<void> {
  const companyId = session.metadata?.companyId;
  const createdById = session.metadata?.createdById;
  const tokenAmount = Number(session.metadata?.tokenAmount);

  if (!companyId || !createdById || !Number.isInteger(tokenAmount) || tokenAmount <= 0) {
    throw new Error('INVALID_SESSION_METADATA');
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1) Enregistre l'achat AVEC l'id de session (@unique).
      await tx.companyTokenPurchase.create({
        data: {
          amount: tokenAmount,
          note: 'Recharge Stripe',
          companyId,
          createdById,
          stripeSessionId: session.id,
        },
      });
      // 2) Crédite le pool de l'entreprise.
      await tx.company.update({
        where: { id: companyId },
        data: { tokenBalance: { increment: tokenAmount } },
      });
    });
  } catch (err) {
    // P2002 = violation d'unicité → paiement DÉJÀ crédité → on ignore.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return;
    }
    throw err;
  }
}
