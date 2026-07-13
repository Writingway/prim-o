import Stripe from 'stripe';
import { config } from '../config';

export const stripe: InstanceType<typeof Stripe> = new Stripe(config.STRIPE_SECRET_KEY);
