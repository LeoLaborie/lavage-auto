// Story 3.2 - Stripe Webhooks (Will be fully implemented in Epic 3)
// Keeping the webhook endpoint active with minimal logic for Stripe connectivity.
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
})

export async function POST(request: Request) {
    const body = await request.text()
    const sig = request.headers.get('stripe-signature')

    if (!sig) {
        return NextResponse.json(
            { success: false, error: 'Missing stripe-signature header' },
            { status: 400 }
        )
    }

    try {
        const event = stripe.webhooks.constructEvent(
            body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET!
        )

        // TODO: Story 3.2 - Implement full webhook handling
        console.log(`[Stripe Webhook] Received event: ${event.type}`)

        return NextResponse.json({ success: true, data: { received: true } })
    } catch (err) {
        console.error('[Stripe Webhook] Signature verification failed:', err)
        return NextResponse.json(
            { success: false, error: 'Webhook signature verification failed' },
            { status: 400 }
        )
    }
}
