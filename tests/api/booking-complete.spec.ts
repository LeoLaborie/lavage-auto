import { test, expect } from '@playwright/test';

/**
 * Story 5.2 — Vue Client Post-Mission et Validation Finale
 *
 * API tests for:
 *   - POST /api/booking/[id]/complete (client validation endpoint)
 *   - GET /api/customer/bookings (photo URL fields)
 *
 * Tests requiring a seeded IN_PROGRESS booking with photo URLs are marked `.skip`
 * until a DB seeding strategy is in place (consistent with Stories 4.1–4.4 pattern).
 */
test.describe('Story 5.2 — Client Post-Mission Validation', () => {

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/booking/[id]/complete — Authorization tests (no DB seed needed)
    // ─────────────────────────────────────────────────────────────────────────

    test('POST /api/booking/[id]/complete returns 401 for unauthenticated request', async ({ request }) => {
        const response = await request.post('/api/booking/non-existent-id/complete');
        expect(response.status()).toBe(401);
        const body = await response.json();
        expect(body.success).toBe(false);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/customer/bookings — Photo URL field presence
    // ─────────────────────────────────────────────────────────────────────────

    test('GET /api/customer/bookings returns 401 for unauthenticated request', async ({ request }) => {
        const response = await request.get('/api/customer/bookings');
        expect(response.status()).toBe(401);
        const body = await response.json();
        expect(body.success).toBe(false);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Tests requiring a seeded IN_PROGRESS booking with photo URLs
    // ─────────────────────────────────────────────────────────────────────────

    test.skip('GET /api/customer/bookings response includes beforePhotoUrl and afterPhotoUrl fields', async ({ request }) => {
        // TODO: Requires authenticated session + seeded booking
        // Expected: each booking object contains keys beforePhotoUrl and afterPhotoUrl (may be null)
        // Verify: response.bookings[0] has keys 'beforePhotoUrl' and 'afterPhotoUrl'
        void request;
    });

    test.skip('POST /api/booking/[id]/complete returns 409 if booking is not IN_PROGRESS', async ({ request }) => {
        // TODO: Requires authenticated session + seeded PENDING booking
        void request;
    });

    test.skip('POST /api/booking/[id]/complete returns 403 if caller is not the booking client', async ({ request }) => {
        // TODO: Requires authenticated session as a different user than the booking client
        void request;
    });

    test.skip('POST /api/booking/[id]/complete returns 200 and sets status to COMPLETED for IN_PROGRESS booking with afterPhotoUrl set', async ({ request }) => {
        // TODO: Requires authenticated session + seeded IN_PROGRESS booking with afterPhotoUrl
        // Expected:
        //   response.status === 200
        //   body.success === true
        //   body.data.status === 'COMPLETED'
        //   body.data.payout.triggered === true or false (both are valid — payout may be deferred)
        void request;
    });

    test.skip('POST /api/booking/[id]/complete returns 404 for non-existent booking', async ({ request }) => {
        // TODO: Requires authenticated session
        void request;
    });
});
