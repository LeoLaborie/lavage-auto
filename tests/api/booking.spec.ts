import { test, expect } from '@playwright/test';

test.describe('Booking API Endpoints', () => {
    test('POST /api/booking/submit should return 501 Not Implemented', async ({ request }) => {
        const response = await request.post('/api/booking/submit');
        expect(response.status()).toBe(501);
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toContain('Not implemented yet');
    });

    test('POST /api/booking/validate-timeslot should return 501 Not Implemented', async ({ request }) => {
        const response = await request.post('/api/booking/validate-timeslot');
        expect(response.status()).toBe(501);
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toContain('Not implemented yet');
    });
});
