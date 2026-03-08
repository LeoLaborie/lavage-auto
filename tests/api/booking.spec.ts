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
});
