import { test, expect } from '@playwright/test';

test.describe('Customer API Endpoints', () => {
    test('GET /api/customer/bookings should return 401 when unauthenticated', async ({ request }) => {
        const response = await request.get('/api/customer/bookings');
        expect(response.status()).toBe(401);
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toBe('Unauthorized');
    });
});
