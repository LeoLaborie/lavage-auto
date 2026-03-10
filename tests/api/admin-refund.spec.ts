import { test, expect } from '@playwright/test';

// Story 5.4: Gestion des Litiges et Remboursements
// AC#9: Auth protection for GET /api/admin/bookings/[id]

test.describe('Admin Booking Detail API — Unauthenticated (AC#9)', () => {
    test('GET /api/admin/bookings/some-id returns 401 when unauthenticated', async ({ request }) => {
        const response = await request.get('/api/admin/bookings/some-id');
        expect(response.status()).toBe(401);
        const body = await response.json();
        expect(body.success).toBe(false);
    });

    test('GET /api/admin/bookings/nonexistent-id returns 401 (auth fires before 404)', async ({ request }) => {
        // Auth check runs BEFORE the 404 lookup — unauthenticated requests always get 401, not 404.
        const response = await request.get('/api/admin/bookings/nonexistent-id-that-does-not-exist');
        expect(response.status()).toBe(401);
        const body = await response.json();
        expect(body.success).toBe(false);
    });

    // M4: 403 case — authenticated but non-ADMIN user — AC#9 coverage
    test.skip('GET /api/admin/bookings/some-id returns 403 for authenticated non-ADMIN user (AC#9)', async ({ request }) => {
        // TODO: Authenticate as a CLIENT or LAVEUR user (non-ADMIN role)
        // Then hit the admin booking detail endpoint
        // Expected: 403 Forbidden — auth check passes (user exists) but role guard rejects
        // Requires: seeded CLIENT or LAVEUR session cookie / bearer token
        const response = await request.get('/api/admin/bookings/some-id');
        expect(response.status()).toBe(403);
        const body = await response.json();
        expect(body.success).toBe(false);
    });
});

// Tests below require a seeded ADMIN session and booking records — skipped in CI.
test.describe('Admin Booking Detail API — ADMIN happy paths — Requires Seeding', () => {
    test.skip('GET /api/admin/bookings/[valid-id] returns 200 with booking shape (ADMIN)', async ({ request }) => {
        // TODO: Authenticate as ADMIN user with valid bookingId
        const validBookingId = 'seed-booking-id-here';
        const response = await request.get(`/api/admin/bookings/${validBookingId}`);
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.data.id).toBeDefined();
        expect(body.data.serviceName).toBeDefined();
        expect(body.data.clientEmail).toBeDefined();
        expect(typeof body.data.amountCents).toBe('number');
    });

    test.skip('GET /api/admin/bookings/[invalid-id] returns 404 for ADMIN (booking not found)', async ({ request }) => {
        // TODO: Authenticate as ADMIN user with an ID that doesn't match any booking
        const response = await request.get('/api/admin/bookings/non-existent-booking-id-1234');
        expect(response.status()).toBe(404);
        const body = await response.json();
        expect(body.success).toBe(false);
    });
});

// triggerRefund Server Action guard tests — require seeded ADMIN session + COMPLETED booking with payment.
test.describe('triggerRefund Server Action — Guard Tests — Requires Seeding', () => {
    test.skip('triggerRefund with amount exceeding remaining returns { success: false }', async () => {
        // TODO: Call triggerRefund via test harness with amountCents > remaining
        // Requires: seeded ADMIN session, COMPLETED booking with payment record
        // Expected: { success: false, error: 'Montant supérieur au montant remboursable...' }
    });

    test.skip('triggerRefund on already-REFUNDED payment returns { success: false }', async () => {
        // TODO: Call triggerRefund on a booking whose payment.status === 'REFUNDED'
        // Requires: seeded ADMIN session, booking with payment.status = 'REFUNDED'
        // Expected: { success: false, error: 'Ce paiement a déjà été entièrement remboursé' }
    });
});
