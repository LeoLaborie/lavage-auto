import { test, expect } from '@playwright/test'

/**
 * Issue #24 — Laveur signal end-of-mission (AWAITING_REVIEW transition)
 */
test.describe('Issue #24 — Laveur AWAITING_REVIEW transition', () => {
    test('PATCH /api/washer/missions/[id]/status returns 401 for unauthenticated request', async ({ request }) => {
        const response = await request.patch('/api/washer/missions/non-existent-id/status', {
            data: { status: 'AWAITING_REVIEW' },
        })
        expect(response.status()).toBe(401)
        const body = await response.json()
        expect(body.success).toBe(false)
    })

    test.skip('returns 403 if WASHER_CAN_FINISH flag is disabled', async ({ request }) => {
        // TODO: Requires authenticated washer session + flag toggled off
        void request
    })

    test.skip('returns 200 and sets awaitingReviewSince when both photos are present', async ({ request }) => {
        // TODO: Requires authenticated washer session + seeded IN_PROGRESS booking with beforePhotoUrl and afterPhotoUrl
        void request
    })

    test.skip('returns 409 if afterPhotoUrl is missing', async ({ request }) => {
        // TODO
        void request
    })

    test.skip('returns 409 if beforePhotoUrl is missing', async ({ request }) => {
        // TODO
        void request
    })

    test.skip('returns 403 if the laveur is not the booking owner', async ({ request }) => {
        // TODO
        void request
    })

    test.skip('returns 409 if booking is not currently IN_PROGRESS', async ({ request }) => {
        // TODO
        void request
    })

    test.skip('is idempotent under concurrent requests', async ({ request }) => {
        // TODO
        void request
    })
})
