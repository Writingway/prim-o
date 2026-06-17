import Stripe from 'stripe';
import { config } from '../config';

// Client Stripe partagé, initialisé avec la clé secrète.
export const stripe: InstanceType<typeof Stripe> = new Stripe(config.STRIPE_SECRET_KEY);
