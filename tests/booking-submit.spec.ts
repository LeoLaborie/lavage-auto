import { test, expect } from '@playwright/test';

/**
 * E2E tests for the Booking Submit API (Story 2.3)
 * Tests the POST /api/booking/submit endpoint.
 */

test.describe('Booking Submit API - Validation & Auth', () => {
    const API_URL = '/api/booking/submit';

    test('should return 401 when unauthenticated', async ({ request }) => {
        const response = await request.post(API_URL, {
            data: {
                service: 'lavage-complet',
                date: '2026-12-15',
                time: '14:00',
                address: '10 Rue de la République, Lille',
            },
        });

        expect(response.status()).toBe(401);
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toBeTruthy();
    });

    test('should return 401 even if body is valid but no session', async ({ request }) => {
        const response = await request.post(API_URL, {
            data: {
                service: 'exterior', // legacy ID
                date: '2026-12-15',
                time: '14:00',
                address: 'Valid Address',
            },
        });
        expect(response.status()).toBe(401);
    });
});

test.describe('Booking Validate Timeslot API - Logic', () => {
    const API_URL = '/api/booking/validate-timeslot';

    test('should return 400 for missing fields', async ({ request }) => {
        const response = await request.post(API_URL, {
            data: {},
        });

        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body.success).toBe(false);
    });

    test('should return 400 for invalid time slot format', async ({ request }) => {
        const response = await request.post(API_URL, {
            data: {
                date: '2026-12-15',
                time: '25:99',
            },
        });

        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toContain('invalide');
    });

    test('should return 400 for past date', async ({ request }) => {
        const response = await request.post(API_URL, {
            data: {
                date: '2020-01-01',
                time: '10:00',
            },
        });

        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body.success).toBe(false);
    });

    test('should return success for valid future timeslot', async ({ request }) => {
        const response = await request.post(API_URL, {
            data: {
                date: '2026-12-15',
                time: '10:00',
            },
        });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.data.scheduledAt).toBeTruthy();
        expect(new Date(body.data.scheduledAt).toISOString()).toBe(body.data.scheduledAt);
    });
});
