import { stripe } from '../lib/stripe';
import { config } from '../config';

// Crée une session de paiement Stripe Checkout pour recharger le pool.
// Renvoie l'URL hébergée par Stripe vers laquelle rediriger le manager.
export async function createCheckoutSession(
  managerId: string,
  companyId: string,
  amount: number,
): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: { name: `Recharge de ${amount} token(s) Prim'O` },
          unit_amount: config.TOKEN_PRICE_CENTS, // prix d'UN token, en centimes
        },
        quantity: amount, // total = unit_amount × quantity
      },
    ],
    // Stripe nous renverra ces données dans le webhook → on saura quoi créditer.
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
