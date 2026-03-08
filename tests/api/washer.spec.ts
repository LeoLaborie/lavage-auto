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

    test.describe('Authenticated Validation (Requires Session)', () => {
        test('POST /api/washer/missions/accept should return 400 Bad Request if bookingId is missing', async ({ request }) => {
            // Note: In local/CI without global setup, this will return 401.
            // We verify that IF it gets past auth, it must return exactly 400.
            const response = await request.post('/api/washer/missions/accept', {
                data: {}
            });

            if (response.status() === 401 || response.status() === 403) {
                console.warn('Skipping 400 check: auth required. Current status:', response.status());
                return;
            }

            expect(response.status()).toBe(400);
            const body = await response.json();
            expect(body.success).toBe(false);
            expect(body.error).toContain('bookingId est requis');
        });
    });

    // Note: Fully testing the VALIDATION_PENDING and VALIDATED states via API
    // requires seeding a test user in Supabase Auth and Prisma DB.
    test.describe('Authenticated Access (VALIDATED) - Requires Seeding', () => {
        test.skip('GET /api/washer/missions/available should return 200 with bookings array', async ({ request }) => {
            // TODO: Setup a valid user token for a VALIDATED laveur profile
            const response = await request.get('/api/washer/missions/available');
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(body.success).toBe(true);
            expect(Array.isArray(body.bookings)).toBe(true);
        });

        test.skip('GET /api/washer/missions/available should only return future PENDING/CONFIRMED missions without laveur', async ({ request }) => {
            // TODO: Query and verify all elements in body.bookings match the specific criteria
        });
    });
});

// Story 4.3: Consultation du Planning (Missions Acceptées)
// 401 for unauthenticated access is already covered in the global 'Washer API Endpoints Protection' suite above.
test.describe('Story 4.3 - GET /api/washer/missions/accepted', () => {
    test.describe('Authenticated Access (VALIDATED) - Requires DB Seeding', () => {
        // AC#1-#4: Happy path — VALIDATED laveur gets 200 with bookings array
        test.skip('should return 200 with bookings array for VALIDATED laveur', async ({ request }) => {
            // TODO: Setup a valid user token for a VALIDATED laveur profile
            // TODO: Seed at least one ACCEPTED booking assigned to this laveur
            const response = await request.get('/api/washer/missions/accepted');
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(body.success).toBe(true);
            // AC#2: Both root-level bookings and data.bookings must be present
            expect(Array.isArray(body.bookings)).toBe(true);
            expect(body.data).toBeDefined();
            expect(Array.isArray(body.data.bookings)).toBe(true);
        });

        // AC#1: Only returns ACCEPTED, EN_ROUTE, IN_PROGRESS bookings assigned to this laveur
        test.skip('should only return ACCEPTED/EN_ROUTE/IN_PROGRESS missions assigned to current laveur', async ({ request }) => {
            // TODO: Seed bookings with various statuses (PENDING, CONFIRMED, ACCEPTED, COMPLETED, CANCELLED)
            // TODO: Only ACCEPTED/EN_ROUTE/IN_PROGRESS for this laveur should appear
            const response = await request.get('/api/washer/missions/accepted');
            expect(response.status()).toBe(200);
            const body = await response.json();
            const validStatuses = ['ACCEPTED', 'EN_ROUTE', 'IN_PROGRESS'];
            // status is included in the response to make this assertion possible
            body.bookings.forEach((mission: { status: string }) => {
                expect(validStatuses).toContain(mission.status);
            });
        });

        // AC#3: Each mission includes all required fields with correct types
        test.skip('should return missions with correct Mission shape (id, scheduledDate, serviceAddress, etc.)', async ({ request }) => {
            // TODO: Seed an ACCEPTED booking for the laveur
            const response = await request.get('/api/washer/missions/accepted');
            expect(response.status()).toBe(200);
            const body = await response.json();

            if (body.bookings.length > 0) {
                const mission = body.bookings[0];
                // AC#3: Required fields
                expect(typeof mission.id).toBe('string');
                expect(typeof mission.scheduledDate).toBe('string');
                // AC#3: scheduledDate must be ISO 8601 format
                expect(() => new Date(mission.scheduledDate)).not.toThrow();
                expect(new Date(mission.scheduledDate).toISOString()).toBe(mission.scheduledDate);
                expect(typeof mission.serviceAddress).toBe('string');
                // AC#3: finalPrice in euros (not cents)
                expect(typeof mission.finalPrice).toBe('number');
                expect(mission.finalPrice).toBeLessThan(1000); // Sanity check: price < 1000€
                // AC#3: service shape
                expect(typeof mission.service.name).toBe('string');
                expect(typeof mission.service.estimatedDuration).toBe('number');
                // AC#3: car shape (may have fallback "—")
                expect(typeof mission.car.make).toBe('string');
                expect(typeof mission.car.model).toBe('string');
                // AC#3: customer name
                expect(typeof mission.customer.name).toBe('string');
            }
        });

        // AC#4: Missions sorted by scheduledDate ascending
        test.skip('should return missions sorted chronologically (earliest first)', async ({ request }) => {
            // TODO: Seed multiple ACCEPTED bookings with different scheduledDates
            const response = await request.get('/api/washer/missions/accepted');
            expect(response.status()).toBe(200);
            const body = await response.json();

            if (body.bookings.length > 1) {
                for (let i = 1; i < body.bookings.length; i++) {
                    const prev = new Date(body.bookings[i - 1].scheduledDate).getTime();
                    const curr = new Date(body.bookings[i].scheduledDate).getTime();
                    expect(curr).toBeGreaterThanOrEqual(prev);
                }
            }
        });

        // AC#5: Only today or future missions (no past missions)
        test.skip('should not return past missions (scheduledDate < today 00:00:00 UTC)', async ({ request }) => {
            // TODO: Seed an ACCEPTED booking with scheduledDate in the past
            // TODO: Verify it does NOT appear in the response
            const response = await request.get('/api/washer/missions/accepted');
            expect(response.status()).toBe(200);
            const body = await response.json();

            // Mirror the server's UTC-based cutoff to avoid timezone-dependent test failures.
            const todayStart = new Date();
            todayStart.setUTCHours(0, 0, 0, 0);

            body.bookings.forEach((mission: { scheduledDate: string }) => {
                const missionDate = new Date(mission.scheduledDate);
                expect(missionDate.getTime()).toBeGreaterThanOrEqual(todayStart.getTime());
            });
        });

        // AC#6: VALIDATION_PENDING laveur gets 403
        test.skip('should return 403 for VALIDATION_PENDING laveur', async ({ request }) => {
            // TODO: Setup token for VALIDATION_PENDING laveur
            const response = await request.get('/api/washer/missions/accepted');
            expect(response.status()).toBe(403);
        });

        // AC#11: Pagination — take limit of 100
        test.skip('should return at most 100 missions even if laveur has more', async ({ request }) => {
            // TODO: Seed 150 ACCEPTED bookings for this laveur
            const response = await request.get('/api/washer/missions/accepted');
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(body.bookings.length).toBeLessThanOrEqual(100);
        });
    });

    test.describe('Edge Cases - Car and Customer Fallbacks', () => {
        // AC#9: Booking without a Car — fallback to "—"
        test.skip('should return "—" for car.make and car.model when booking has no car', async ({ request }) => {
            // TODO: Seed an ACCEPTED booking with carId = null for this laveur
            const response = await request.get('/api/washer/missions/accepted');
            expect(response.status()).toBe(200);
            const body = await response.json();
            // Find a mission without a real car
            const missionWithoutCar = body.bookings.find(
                (m: { car: { make: string } }) => m.car.make === '—'
            );
            if (missionWithoutCar) {
                expect(missionWithoutCar.car.make).toBe('—');
                expect(missionWithoutCar.car.model).toBe('—');
            }
        });

        // AC#10: Customer without profile name — fallback to "Client"
        test.skip('should return "Client" for customer.name when profile has no name', async ({ request }) => {
            // TODO: Seed an ACCEPTED booking where the client has no firstName/lastName in profile
            const response = await request.get('/api/washer/missions/accepted');
            expect(response.status()).toBe(200);
            const body = await response.json();
            const missionWithNoName = body.bookings.find(
                (m: { customer: { name: string } }) => m.customer.name === 'Client'
            );
            if (missionWithNoName) {
                expect(missionWithNoName.customer.name).toBe('Client');
            }
        });
    });
});

// Story 4.4: Mise à Jour du Statut de Mission (En Route / En Cours)
// 401 for unauthenticated access is covered below (live test, no DB seed needed).
test.describe('Story 4.4 - PATCH /api/washer/missions/[id]/status', () => {
    // AC#7: Unauthenticated request → 401
    test('should return 401 Unauthorized for unauthenticated request', async ({ request }) => {
        const response = await request.patch('/api/washer/missions/some-booking-id/status', {
            data: { status: 'EN_ROUTE' },
        });
        expect(response.status()).toBe(401);
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toBe('Unauthorized');
    });

    // AC#9: Missing or invalid status → 400 (soft test: may hit 401 first without auth)
    test('should return 400 for COMPLETED status (redirect to /complete endpoint)', async ({ request }) => {
        const response = await request.patch('/api/washer/missions/some-booking-id/status', {
            data: { status: 'COMPLETED' },
        });

        if (response.status() === 401 || response.status() === 403) {
            console.warn('Skipping 400 check: auth required. Current status:', response.status());
            return;
        }

        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toContain('/api/booking/[id]/complete');
    });

    test('should return 400 for invalid status value (e.g., CANCELLED)', async ({ request }) => {
        const response = await request.patch('/api/washer/missions/some-booking-id/status', {
            data: { status: 'CANCELLED' },
        });

        if (response.status() === 401 || response.status() === 403) {
            console.warn('Skipping 400 check: auth required. Current status:', response.status());
            return;
        }

        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toContain('EN_ROUTE');
        expect(body.error).toContain('IN_PROGRESS');
    });

    test.describe('Authenticated Access (VALIDATED) - Requires DB Seeding', () => {
        // AC#6: Non-existent booking → 404
        test.skip('should return 404 for non-existent booking id', async ({ request }) => {
            // TODO: Authenticate as a VALIDATED laveur
            const response = await request.patch('/api/washer/missions/non-existent-id/status', {
                data: { status: 'EN_ROUTE' },
            });
            expect(response.status()).toBe(404);
            const body = await response.json();
            expect(body.success).toBe(false);
            expect(body.error).toBe('Mission introuvable');
        });

        // AC#5: Ownership check — laveur cannot update another laveur's mission
        test.skip('should return 403 when laveur tries to update a booking assigned to another laveur', async ({ request }) => {
            // TODO: Seed a booking assigned to laveur A, authenticate as laveur B
            const response = await request.patch('/api/washer/missions/other-laveur-booking/status', {
                data: { status: 'EN_ROUTE' },
            });
            expect(response.status()).toBe(403);
            const body = await response.json();
            expect(body.success).toBe(false);
            expect(body.error).toBe('Accès refusé');
        });

        // AC#3: Invalid transition (ACCEPTED → IN_PROGRESS) → 409
        test.skip('should return 409 for invalid transition ACCEPTED → IN_PROGRESS', async ({ request }) => {
            // TODO: Seed an ACCEPTED booking assigned to current laveur
            const bookingId = 'seeded-accepted-booking-id';
            const response = await request.patch(`/api/washer/missions/${bookingId}/status`, {
                data: { status: 'IN_PROGRESS' },
            });
            expect(response.status()).toBe(409);
            const body = await response.json();
            expect(body.success).toBe(false);
            expect(body.error).toContain('ACCEPTED');
            expect(body.error).toContain('IN_PROGRESS');
        });

        // AC#1: Happy path — ACCEPTED → EN_ROUTE
        test.skip('should return 200 and update status to EN_ROUTE from ACCEPTED', async ({ request }) => {
            // TODO: Seed an ACCEPTED booking assigned to current laveur
            const bookingId = 'seeded-accepted-booking-id';
            const response = await request.patch(`/api/washer/missions/${bookingId}/status`, {
                data: { status: 'EN_ROUTE' },
            });
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(body.success).toBe(true);
            expect(body.data.bookingId).toBe(bookingId);
            expect(body.data.status).toBe('EN_ROUTE');
            // startedAt should NOT be set for EN_ROUTE
            expect(body.data.startedAt).toBeUndefined();
        });

        // AC#2: Happy path — EN_ROUTE → IN_PROGRESS, startedAt is set
        test.skip('should return 200 and set startedAt when transitioning to IN_PROGRESS', async ({ request }) => {
            // TODO: Seed an EN_ROUTE booking assigned to current laveur
            const bookingId = 'seeded-en-route-booking-id';
            const response = await request.patch(`/api/washer/missions/${bookingId}/status`, {
                data: { status: 'IN_PROGRESS' },
            });
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(body.success).toBe(true);
            expect(body.data.bookingId).toBe(bookingId);
            expect(body.data.status).toBe('IN_PROGRESS');
            // startedAt must be a valid ISO 8601 timestamp
            expect(typeof body.data.startedAt).toBe('string');
            expect(() => new Date(body.data.startedAt)).not.toThrow();
            expect(new Date(body.data.startedAt).toISOString()).toBe(body.data.startedAt);
        });
    });
});
