import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is missing. Please set it in your .env.local file.');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-02-24.acacia' as any,
    typescript: true,
});

/**
 * Gets or creates a Stripe Customer for the given user.
 * Stores the customer ID on the user's Profile for reuse.
 */
export async function getOrCreateStripeCustomer(
    userId: string,
    email: string,
    existingCustomerId: string | null
): Promise<string> {
    if (existingCustomerId) {
        return existingCustomerId;
    }

    const customer = await stripe.customers.create({
        email,
        metadata: { userId },
    });

    // Import prisma here to avoid circular dependency at module level
    const { prisma } = await import('@/lib/prisma');
    await prisma.profile.update({
        where: { userId },
        data: { stripeCustomerId: customer.id },
    });

    return customer.id;
}

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
        success_url: `${baseUrl}/booking/success?bookingId=${bookingId}`,
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

/**
 * Creates a Stripe Checkout Session in "setup" mode.
 * The client's card is validated and saved on the Stripe Customer
 * without any charge. The actual charge happens later when a washer accepts.
 */
export async function createSetupCheckoutSession(
    bookingId: string,
    stripeCustomerId: string,
    customerEmail: string,
    serviceName: string,
    amountCents: number
) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    return await stripe.checkout.sessions.create({
        mode: 'setup',
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        success_url: `${baseUrl}/booking/success?bookingId=${bookingId}`,
        cancel_url: `${baseUrl}/api/booking/cancel?bookingId=${bookingId}`,
        metadata: {
            bookingId,
            serviceName,
            amountCents: String(amountCents),
        },
        setup_intent_data: {
            metadata: {
                bookingId,
            },
        },
    });
}

/**
 * Creates and confirms a PaymentIntent off-session using the customer's
 * saved payment method. Used when a washer accepts a mission.
 * Throws on failure (card declined, insufficient funds, etc.).
 */
export async function chargeCustomer(
    stripeCustomerId: string,
    amountCents: number,
    bookingId: string,
    serviceName: string
): Promise<Stripe.PaymentIntent> {
    return await stripe.paymentIntents.create({
        amount: amountCents,
        currency: 'eur',
        customer: stripeCustomerId,
        off_session: true,
        confirm: true,
        description: `Lavage Auto: ${serviceName}`,
        metadata: { bookingId },
    }, {
        idempotencyKey: `booking-${bookingId}-charge`,
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

/**
 * Captures a previously authorized (manual-capture) PaymentIntent.
 * This releases the funds from escrow. Must be called before createTransfer.
 */
export async function capturePaymentIntent(
    paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
    return await stripe.paymentIntents.capture(paymentIntentId);
}

/**
 * Creates a Stripe Transfer from the platform account to a connected Laveur account.
 * Uses source_transaction to link the transfer to the original charge for reconciliation.
 * IMPORTANT: source_transaction must be a Charge ID (ch_...), NOT a PaymentIntent ID (pi_...).
 * Obtain chargeId from capturePaymentIntent(...)?.latest_charge.
 * Includes an idempotency key to prevent duplicate transfers on retries.
 */
export async function createTransfer(
    amountCents: number,
    stripeAccountId: string,
    chargeId: string,
    bookingId: string
): Promise<Stripe.Transfer> {
    return await stripe.transfers.create(
        {
            amount: amountCents,
            currency: 'eur',
            destination: stripeAccountId,
            source_transaction: chargeId,
            metadata: {
                bookingId,
                chargeId,
            },
        },
        {
            idempotencyKey: `booking-${bookingId}-transfer`,
        }
    );
}
