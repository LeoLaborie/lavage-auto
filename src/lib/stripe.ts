import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is missing. Please set it in your .env.local file.');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-01-27.acacia', // Reverting to the version I initially wanted, or staying with the one that worked. '2026-01-28.clover' is what the error said was required. 
    // Wait, let's just use the one that the error message suggested was the "target type".
    // "Type ... is not assignable to type '2026-01-28.clover'".
    apiVersion: '2026-01-28.clover' as any,
    typescript: true,
});
