import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
    test('should load the home page and display main elements', async ({ page }) => {
        await page.goto('/');

        // Check main heading
        await expect(page.locator('h1')).toContainText('Voiture propre');

        // Check search button is visible
        const searchBtn = page.getByRole('button', { name: /Rechercher/i });
        await expect(searchBtn).toBeVisible();

        // Check services section
        await expect(page.locator('h2').filter({ hasText: 'Formules de Lavage' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Lavage Extérieur' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Lavage Complet' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Lavage Premium' })).toBeVisible();
    });
});
