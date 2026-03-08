import { test, expect } from '@playwright/test';

/**
 * Story 3.4 - Reversement Automatique et Récapitulatif
 *
 * Tests for:
 * - GET /api/washer/earnings (unauthenticated → 401)
 * - POST /api/booking/[id]/complete (unauthenticated → 401)
 * - Earnings response shape (authenticated, seeded data required → skipped)
 * - Payout idempotency (seeded data required → skipped)
 */

test.describe('Story 3.4 - Payout & Earnings Endpoints', () => {

    test.describe('GET /api/washer/earnings - Unauthenticated Access', () => {
        test('should return 401 Unauthorized when no session', async ({ request }) => {
            const response = await request.get('/api/washer/earnings');
            expect(response.status()).toBe(401);
            const body = await response.json();
            expect(body.success).toBe(false);
            expect(body.error).toBe('Unauthorized');
        });
    });

    test.describe('POST /api/booking/[id]/complete - Unauthenticated Access', () => {
        test('should return 401 Unauthorized when no session', async ({ request }) => {
            const response = await request.post('/api/booking/fake-booking-id/complete');
            expect(response.status()).toBe(401);
            const body = await response.json();
            expect(body.success).toBe(false);
        });
    });

    test.describe('GET /api/washer/earnings - Response Shape (Authenticated + Seeded)', () => {
        test.skip('should return 200 with earnings summary when called by a VALIDATED laveur', async ({ request }) => {
            // Requires: valid Supabase session for a VALIDATED laveur
            // Setup: seed a COMPLETED booking with a SUCCEEDED payment with paidOutAt set
            const response = await request.get('/api/washer/earnings');
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(body.success).toBe(true);
            expect(typeof body.data.validatedEarningsCents).toBe('number');
            expect(typeof body.data.pendingEarningsCents).toBe('number');
            expect(typeof body.data.completedMissionsCount).toBe('number');
        });

        test.skip('should return 0,00 € for all values when no completed missions exist', async ({ request }) => {
            // Requires: valid Supabase session for a VALIDATED laveur with zero completed bookings
            const response = await request.get('/api/washer/earnings');
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(body.success).toBe(true);
            expect(body.data.validatedEarningsCents).toBe(0);
            expect(body.data.pendingEarningsCents).toBe(0);
            expect(body.data.completedMissionsCount).toBe(0);
        });
    });

    test.describe('POST /api/booking/[id]/complete - Business Logic (Authenticated + Seeded)', () => {
        test.skip('should return 404 when booking does not exist', async ({ request }) => {
            // Requires: valid admin or client session
            const response = await request.post('/api/booking/nonexistent-booking-id/complete');
            expect(response.status()).toBe(404);
            const body = await response.json();
            expect(body.success).toBe(false);
        });

        test.skip('should return 409 when booking is in PENDING status', async ({ request }) => {
            // Requires: a PENDING booking seeded in test DB
            const PENDING_BOOKING_ID = 'seed-pending-booking-id';
            const response = await request.post(`/api/booking/${PENDING_BOOKING_ID}/complete`);
            expect(response.status()).toBe(409);
            const body = await response.json();
            expect(body.success).toBe(false);
            expect(body.error).toContain('statut actuel PENDING');
        });

        test.skip('should mark booking COMPLETED and return payout info', async ({ request }) => {
            // Requires: IN_PROGRESS booking with connected laveur and PaymentIntent
            const IN_PROGRESS_BOOKING_ID = 'seed-in-progress-booking-id';
            const response = await request.post(`/api/booking/${IN_PROGRESS_BOOKING_ID}/complete`);
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(body.success).toBe(true);
            expect(body.data.status).toBe('COMPLETED');
            expect(body.data.payout).toBeDefined();
            expect(typeof body.data.payout.triggered).toBe('boolean');
        });

        test.skip('payout idempotency: calling complete twice should succeed once, defer second payout', async ({ request }) => {
            // Requires: a fresh IN_PROGRESS booking with connected laveur
            const BOOKING_ID = 'seed-idempotency-booking-id';

            const first = await request.post(`/api/booking/${BOOKING_ID}/complete`);
            expect(first.status()).toBe(200);
            const firstBody = await first.json();
            expect(firstBody.success).toBe(true);

            // The second call: booking is now COMPLETED, so it returns 409
            const second = await request.post(`/api/booking/${BOOKING_ID}/complete`);
            expect(second.status()).toBe(409);
            const secondBody = await second.json();
            expect(secondBody.success).toBe(false);
        });

        test.skip('should complete booking even if laveur has no stripeAccountId (deferred payout)', async ({ request }) => {
            // Requires: IN_PROGRESS booking with a laveur who has NO stripeAccountId
            const BOOKING_ID = 'seed-no-stripe-booking-id';
            const response = await request.post(`/api/booking/${BOOKING_ID}/complete`);
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(body.success).toBe(true);
            expect(body.data.status).toBe('COMPLETED');
            // Payout was deferred, not triggered
            expect(body.data.payout.triggered).toBe(false);
            expect(body.data.payout.reason).toContain('Stripe');
        });
    });
});
