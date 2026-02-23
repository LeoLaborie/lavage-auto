import { test, expect } from '@playwright/test';

// Mock response for the French government address API
const MOCK_ADDRESS_RESPONSE = {
    type: 'FeatureCollection',
    features: [
        {
            properties: {
                label: '10 Rue de la République, 59000 Lille',
                housenumber: '10',
                street: 'Rue de la République',
                postcode: '59000',
                city: 'Lille',
                name: '10 Rue de la République',
            },
        },
    ],
};

test.describe('Booking Date and Location Selection', () => {
    test.beforeEach(async ({ page }) => {
        // Mock the French government address autocomplete API
        await page.route('**/api-adresse.data.gouv.fr/**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(MOCK_ADDRESS_RESPONSE),
            });
        });

        // Navigate and select a service to reach step 2
        await page.goto('/reserver');
        await page.waitForSelector('text=Lavage Extérieur');
        await page.click('text=Lavage Extérieur');
        await page.waitForSelector('text=Quand et où ?');
    });

    test('should allow selecting a future date and a time slot', async ({ page }) => {
        const enabledDays = page.locator('.react-calendar__tile:not(:disabled)');
        await enabledDays.first().click();

        await expect(page.locator('text=08:00')).toBeVisible();
        await page.click('text=08:00');

        const selectedTimeButton = page.locator('button:has-text("08:00")');
        await expect(selectedTimeButton).toHaveClass(/bg-primary/);
    });

    test('should allow entering an address', async ({ page }) => {
        const addressInput = page.getByPlaceholder('Saisissez votre adresse');
        await expect(addressInput).toBeVisible();
        await addressInput.fill('10 rue de la République, Lille');

        // Wait for mocked autocomplete suggestions
        const firstSuggestion = page.locator('ul[id="address-suggestions"] li').first();
        await expect(firstSuggestion).toBeVisible({ timeout: 5000 });
        await firstSuggestion.click();

        await expect(addressInput).toHaveValue(/Lille/i);
    });

    test('should disable Continuer button if date/time/address are missing', async ({ page }) => {
        const continueButton = page.getByRole('button', { name: /Continuer/i });

        // Initially disabled
        await expect(continueButton).toBeDisabled();

        // Fill address
        const addressInput = page.getByPlaceholder('Saisissez votre adresse');
        await addressInput.fill('10 rue de la République, Lille');
        const firstSuggestion = page.locator('ul[id="address-suggestions"] li').first();
        await expect(firstSuggestion).toBeVisible({ timeout: 5000 });
        await firstSuggestion.click();

        // Still disabled (no date/time)
        await expect(continueButton).toBeDisabled();

        // Select a date
        const enabledDays = page.locator('.react-calendar__tile:not(:disabled)');
        await enabledDays.first().click();

        // Still disabled (no time)
        await expect(continueButton).toBeDisabled();

        // Select time
        await page.click('text=08:00');

        // Now enabled
        await expect(continueButton).toBeEnabled();
    });
});
