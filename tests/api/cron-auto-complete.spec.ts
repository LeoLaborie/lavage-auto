import { test, expect } from '@playwright/test'

test.describe('Issue #24 — Cron auto-complete', () => {
    test('POST /api/cron/auto-complete returns 401 without x-cron-secret header', async ({ request }) => {
        const response = await request.post('/api/cron/auto-complete')
        expect(response.status()).toBe(401)
    })

    test('POST /api/cron/auto-complete returns 401 with wrong x-cron-secret', async ({ request }) => {
        const response = await request.post('/api/cron/auto-complete', {
            headers: { 'x-cron-secret': 'totally-wrong-value' },
        })
        expect(response.status()).toBe(401)
    })

    test.skip('processes AWAITING_REVIEW bookings older than 24h', async ({ request }) => {
        void request
    })

    test.skip('skips AWAITING_REVIEW bookings within the 24h window', async ({ request }) => {
        void request
    })

    test.skip('processes legacy IN_PROGRESS bookings older than 7 days with afterPhotoUrl set', async ({ request }) => {
        void request
    })

    test.skip('skips legacy IN_PROGRESS bookings without afterPhotoUrl', async ({ request }) => {
        void request
    })

    test.skip('is idempotent — second immediate call processes 0 bookings', async ({ request }) => {
        void request
    })
})
