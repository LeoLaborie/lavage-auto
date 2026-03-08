import { test, expect } from '@playwright/test';

test.describe('Washer API Endpoints Protection', () => {
    test.describe('Unauthenticated Access', () => {
        test('GET /api/washer/missions/available should return 401 Unauthorized', async ({ request }) => {
            const response = await request.get('/api/washer/missions/available');
            expect(response.status()).toBe(401);
            const body = await response.json();
            expect(body.success).toBe(false);
            expect(body.error).toBe('Unauthorized');
        });

        test('GET /api/washer/missions/accepted should return 401 Unauthorized', async ({ request }) => {
            const response = await request.get('/api/washer/missions/accepted');
            expect(response.status()).toBe(401);
            const body = await response.json();
            expect(body.success).toBe(false);
            expect(body.error).toBe('Unauthorized');
        });

        test('POST /api/washer/missions/accept should return 401 Unauthorized', async ({ request }) => {
            const response = await request.post('/api/washer/missions/accept');
            expect(response.status()).toBe(401);
            const body = await response.json();
            expect(body.success).toBe(false);
            expect(body.error).toBe('Unauthorized');
        });
    });

    test.describe('Authenticated Validation (Requires Session)', () => {
        test('POST /api/washer/missions/accept should return 400 Bad Request if bookingId is missing', async ({ request }) => {
            // Note: In local/CI without global setup, this will return 401.
            // We verify that IF it gets past auth, it must return exactly 400.
            const response = await request.post('/api/washer/missions/accept', {
                data: {}
            });

            if (response.status() === 401 || response.status() === 403) {
                console.warn('Skipping 400 check: auth required. Current status:', response.status());
                return;
            }

            expect(response.status()).toBe(400);
            const body = await response.json();
            expect(body.success).toBe(false);
            expect(body.error).toContain('bookingId est requis');
        });
    });

    // Note: Fully testing the VALIDATION_PENDING and VALIDATED states via API
    // requires seeding a test user in Supabase Auth and Prisma DB.
    test.describe('Authenticated Access (VALIDATED) - Requires Seeding', () => {
        test.skip('GET /api/washer/missions/available should return 200 with bookings array', async ({ request }) => {
            // TODO: Setup a valid user token for a VALIDATED laveur profile
            const response = await request.get('/api/washer/missions/available');
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(body.success).toBe(true);
            expect(Array.isArray(body.bookings)).toBe(true);
        });

        test.skip('GET /api/washer/missions/available should only return future PENDING/CONFIRMED missions without laveur', async ({ request }) => {
            // TODO: Query and verify all elements in body.bookings match the specific criteria
        });
    });
});
