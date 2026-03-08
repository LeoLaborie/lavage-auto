import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is missing. Please set it in your .env.local file.');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-02-24.acacia' as any,
    typescript: true,
});

export async function createCheckoutSession(
    bookingId: string,
    amountCents: number,
    customerEmail: string,
    serviceName: string
) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    return await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: `Lavage Auto: ${serviceName}`,
                    },
                    unit_amount: amountCents,
                },
                quantity: 1,
            },
        ],
        mode: 'payment',
        success_url: `${baseUrl}/dashboard?success=true&bookingId=${bookingId}`,
        cancel_url: `${baseUrl}/api/booking/cancel?bookingId=${bookingId}`,
        customer_email: customerEmail,
        metadata: {
            bookingId,
        },
        payment_intent_data: {
            capture_method: 'manual', // Hold funds (séquestre) as per Story 3.1
            metadata: {
                bookingId,
            },
        },
    });
}
export async function createConnectAccount(email: string, userId: string) {
    return await stripe.accounts.create({
        type: 'express',
        email: email,
        capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
        },
        metadata: {
            userId,
        },
    });
}

export async function createAccountLink(stripeAccountId: string) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    return await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: `${baseUrl}/dashboard?stripe_refresh=true`,
        return_url: `${baseUrl}/washer/stripe-callback`,
        type: 'account_onboarding',
    });
}
