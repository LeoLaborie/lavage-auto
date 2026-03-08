import { test, expect } from '@playwright/test';

// Story 5.3: Back-Office d'Administration
// AC#8: Unauthenticated requests → 401
// AC#9: Non-ADMIN authenticated requests → 403 (requires seeded session, skipped in CI)

test.describe('Admin API Endpoints Protection — Unauthenticated (AC#8)', () => {
    test('GET /api/admin/users returns 401 when unauthenticated', async ({ request }) => {
        const response = await request.get('/api/admin/users');
        expect(response.status()).toBe(401);
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toBe('Unauthorized');
    });

    test('GET /api/admin/bookings returns 401 when unauthenticated', async ({ request }) => {
        const response = await request.get('/api/admin/bookings');
        expect(response.status()).toBe(401);
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toBe('Unauthorized');
    });

    test('GET /api/admin/payments returns 401 when unauthenticated', async ({ request }) => {
        const response = await request.get('/api/admin/payments');
        expect(response.status()).toBe(401);
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toBe('Unauthorized');
    });

    test('PATCH /api/admin/users/nonexistent-id/validate returns 401 when unauthenticated', async ({ request }) => {
        const response = await request.patch('/api/admin/users/nonexistent-id/validate');
        expect(response.status()).toBe(401);
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toBe('Unauthorized');
    });

    test('PATCH /api/admin/users/nonexistent-id/reject returns 401 when unauthenticated', async ({ request }) => {
        const response = await request.patch('/api/admin/users/nonexistent-id/reject');
        expect(response.status()).toBe(401);
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toBe('Unauthorized');
    });
});

// AC#9: Non-ADMIN authenticated (CLIENT or LAVEUR) → 403
// Requires a seeded session — skipped in CI without fixtures.
test.describe('Admin API Endpoints Protection — Non-ADMIN role (AC#9) — Requires Seeding', () => {
    test.skip('GET /api/admin/users returns 403 for CLIENT role', async ({ request }) => {
        // TODO: Authenticate as CLIENT user and set cookie/header
        const response = await request.get('/api/admin/users');
        expect(response.status()).toBe(403);
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toContain('Forbidden');
    });

    test.skip('GET /api/admin/users returns 403 for LAVEUR role', async ({ request }) => {
        // TODO: Authenticate as LAVEUR user and set cookie/header
        const response = await request.get('/api/admin/users');
        expect(response.status()).toBe(403);
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toContain('Forbidden');
    });

    test.skip('GET /api/admin/bookings returns 403 for non-ADMIN role', async ({ request }) => {
        const response = await request.get('/api/admin/bookings');
        expect(response.status()).toBe(403);
    });

    test.skip('GET /api/admin/payments returns 403 for non-ADMIN role', async ({ request }) => {
        const response = await request.get('/api/admin/payments');
        expect(response.status()).toBe(403);
    });

    test.skip('PATCH /api/admin/users/[id]/validate returns 403 for non-ADMIN role', async ({ request }) => {
        const response = await request.patch('/api/admin/users/some-id/validate');
        expect(response.status()).toBe(403);
    });

    test.skip('PATCH /api/admin/users/[id]/reject returns 403 for non-ADMIN role', async ({ request }) => {
        const response = await request.patch('/api/admin/users/some-id/reject');
        expect(response.status()).toBe(403);
    });
});

// Authenticated ADMIN happy-path tests — requires seeded ADMIN session
test.describe('Admin API — ADMIN role happy paths — Requires Seeding', () => {
    test.skip('GET /api/admin/users returns 200 with paginated items (ADMIN)', async ({ request }) => {
        const response = await request.get('/api/admin/users?page=1&pageSize=20');
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.data.items).toBeDefined();
        expect(Array.isArray(body.data.items)).toBe(true);
        expect(typeof body.data.total).toBe('number');
        expect(body.data.page).toBe(1);
        expect(body.data.pageSize).toBe(20);
    });

    test.skip('GET /api/admin/bookings returns 200 with paginated items (ADMIN)', async ({ request }) => {
        const response = await request.get('/api/admin/bookings?page=1&pageSize=20');
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(Array.isArray(body.data.items)).toBe(true);
    });

    test.skip('GET /api/admin/payments returns 200 with paginated items (ADMIN)', async ({ request }) => {
        const response = await request.get('/api/admin/payments?page=1&pageSize=20');
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(Array.isArray(body.data.items)).toBe(true);
    });
});
