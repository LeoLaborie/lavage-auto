import { test, expect } from '@playwright/test';

test.describe('Customer API Endpoints', () => {
    test('GET /api/customer/bookings should return 501 Not Implemented', async ({ request }) => {
        const response = await request.get('/api/customer/bookings');
        expect(response.status()).toBe(501);
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toContain('Not implemented yet');
    });
});
