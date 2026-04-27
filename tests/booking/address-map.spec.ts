import { test, expect } from '@playwright/test'

// Mock BAN response that INCLUDES geometry.coordinates so the autocomplete
// forwards real lat/lng to the wizard (this is what triggers the map render).
const MOCK_BAN_RESPONSE = {
    type: 'FeatureCollection',
    features: [
        {
            properties: {
                label: '8 Boulevard du Port, 95000 Cergy',
                housenumber: '8',
                street: 'Boulevard du Port',
                postcode: '95000',
                city: 'Cergy',
                name: '8 Boulevard du Port',
            },
            geometry: {
                type: 'Point',
                coordinates: [2.0764, 49.0381], // [lng, lat] per GeoJSON
            },
        },
    ],
}

test.describe('Booking address map', () => {
    test.beforeEach(async ({ page }) => {
        await page.route('**/api-adresse.data.gouv.fr/**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(MOCK_BAN_RESPONSE),
            })
        })

        // Stub MapLibre tile network calls so the map render does not depend on
        // an external CDN being reachable from the test runner.
        await page.route('**/basemaps.cartocdn.com/**', async (route) => {
            const url = route.request().url()
            if (url.endsWith('.json')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ version: 8, sources: {}, layers: [] }),
                })
            } else {
                // Block tiles/sprites/glyphs — map can still render the canvas
                // without them; we only need the .maplibregl-map container.
                await route.abort()
            }
        })

        await page.goto('/reserver')
        await page.waitForSelector('text=Lavage Extérieur')
        await page.click('text=Lavage Extérieur')

        // Reach step 2 (StepAddress).
        await expect(page.getByPlaceholder('Saisissez votre adresse')).toBeVisible()
    })

    test('shows the map after selecting an address suggestion', async ({ page }) => {
        const input = page.getByPlaceholder('Saisissez votre adresse')
        await input.fill('8 Boulevard du Port, Cergy')

        const firstSuggestion = page.locator('ul[id="address-suggestions"] li').first()
        await expect(firstSuggestion).toBeVisible({ timeout: 5000 })
        await firstSuggestion.click()

        // Map container appears (MapLibre injects this class on its root element).
        const mapContainer = page.locator('.maplibregl-map').first()
        await expect(mapContainer).toBeVisible({ timeout: 8000 })

        // Hint paragraph below the map.
        await expect(page.getByTestId('map-hint')).toBeVisible()
    })

    test.fixme('drag of marker updates submit payload', async () => {
        // Requires an authenticated CLIENT fixture to reach the submit endpoint.
        // Once that infrastructure exists, drag the marker, complete the wizard,
        // intercept POST /api/booking/submit, and assert that the body's
        // serviceLat/serviceLng differ from the initial BAN coords by > 1e-3.
    })
})
