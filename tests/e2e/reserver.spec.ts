import { test, expect } from '@playwright/test';

test.describe('Reservation Flow', () => {
    test('should load the reservation page and show service selection', async ({ page }) => {
        await page.goto('/reserver');

        // Check main heading
        await expect(page.locator('h1')).toHaveText('Réservez votre lavage');

        // Check steps
        await expect(page.getByText('Service', { exact: true })).toBeVisible();
        await expect(page.getByText('Date & Lieu', { exact: true })).toBeVisible();

        // Check if services are available for selection
        await expect(page.getByRole('heading', { name: 'Lavage Extérieur' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Lavage Complet' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Lavage Premium' })).toBeVisible();
    });

    test('should transition to step 2 when selecting a service', async ({ page }) => {
        await page.goto('/reserver');

        // Click on a service
        await page.locator('div').filter({ hasText: /^Lavage ExtérieurNettoyage complet.*$/ }).first().click();

        // Check that we moved to step 2 (Quand et où ?)
        await expect(page.getByRole('heading', { name: 'Quand et où ?' })).toBeVisible();
    });

    test('stores canonical service id when selection is made', async ({ page }) => {
        await page.goto('/reserver');

        await page.getByRole('heading', { name: 'Lavage Extérieur' }).click();

        const storedServiceId = await page.evaluate(() => localStorage.getItem('booking_service_id'));
        expect(storedServiceId).toBe('lavage-exterieur');
    });
});
