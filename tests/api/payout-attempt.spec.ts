import { test, expect } from '@playwright/test'

test.describe('Issue #24 — Admin payout failures view', () => {
    test('GET /api/admin/payouts/failures returns 401 for unauthenticated request', async ({ request }) => {
        const response = await request.get('/api/admin/payouts/failures')
        expect(response.status()).toBe(401)
    })

    test.skip('returns 403 for non-admin authenticated user', async ({ request }) => {
        // TODO: Requires authenticated CLIENT or LAVEUR session
        void request
    })

    test.skip('returns aggregated failures with last-attempt-per-booking', async ({ request }) => {
        // TODO
        void request
    })
})
