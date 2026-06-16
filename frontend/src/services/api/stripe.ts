import { authRequest } from "./client";

// Crée une session Stripe Checkout pour recharger le pool (manager connecté).
// Renvoie l'URL hébergée par Stripe vers laquelle rediriger le navigateur.
export function createCheckout(amount: number) {
  return authRequest('POST', '/stripe/checkout', { amount }) as Promise<{
    ok: boolean;
    status: number;
    data: { url: string } | null;
  }>;
}