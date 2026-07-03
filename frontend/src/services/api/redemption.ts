import { authRequest } from "./client";

// The employee exchanges their tokens for one of the offer's promo codes.
// Returns the obtained code (to reveal in the UI), the offer name and the debited cost.
export const redeemOffer = (offerId: string) =>
  authRequest<{ redemptionId: string; code: string; offerName: string; amount: number }>(
    'POST',
    '/employees/me/redeem',
    { offerId },
  );
