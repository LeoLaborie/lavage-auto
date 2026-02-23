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

    // Note: Fully testing the VALIDATION_PENDING and VALIDATED states via E2E/API
    // requires seeding a test user in Supabase Auth and Prisma DB.
    // Ensure that seed scripts or setup fixtures are used for complete coverage in the future.
});
