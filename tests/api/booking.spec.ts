import { test, expect } from '@playwright/test';

test.describe('Booking API Endpoints', () => {
    test('POST /api/booking/submit should return 401 Unauthorized', async ({ request }) => {
        const response = await request.post('/api/booking/submit');
        expect(response.status()).toBe(401);
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toContain('Unauthorized');
    });

    test('POST /api/booking/validate-timeslot should return 500/400 without payload', async ({ request }) => {
        const response = await request.post('/api/booking/validate-timeslot');
        expect(response.status()).toBeGreaterThanOrEqual(400);
        const body = await response.json();
        expect(body.success).toBe(false);
    });

    test('should reject unauthenticated request with coords', async ({ request }) => {
        const response = await request.post('/api/booking/submit', {
            data: {
                service: 'lavage-basique',
                date: '2099-12-31',
                time: '10:00',
                address: '8 boulevard du Port, 95000 Cergy',
                serviceLat: 49.0381,
                serviceLng: 2.0764,
            },
        });
        expect(response.status()).toBe(401);
    });

    test.skip('persists serviceLat/serviceLng when included in payload — requires auth fixture', async ({ request }) => {
        // TODO: This test needs an authenticated CLIENT user fixture (not yet wired).
        // Once available, POST a valid payload with serviceLat=49.0381, serviceLng=2.0764,
        // then read the created Booking via prisma and assert:
        //   booking.serviceLat ≈ 49.0381 and booking.serviceLng ≈ 2.0764.
        expect(true).toBe(true);
    });
});
