import { test, expect } from '@playwright/test';

test.describe('Login Mode Flow', () => {
    test('should load the login page and toggle between login and signup', async ({ page }) => {
        await page.goto('/login');

        // Check main content for login mode
        await expect(page.locator('h1')).toHaveText('Bienvenue sur Nealkar');
        await expect(page.getByText('Connectez-vous pour accéder à votre espace')).toBeVisible();

        const emailInput = page.getByLabel('Email', { exact: true });
        const passwordInput = page.getByLabel('Mot de passe', { exact: true });
        await expect(emailInput).toBeVisible();
        await expect(passwordInput).toBeVisible();

        // Click on create account link
        await page.getByRole('button', { name: 'Créer un compte' }).click();

        // It should now show the signup mode
        await expect(page.getByText('Créez votre compte en quelques secondes')).toBeVisible();
        const signupBtn = page.getByRole('button', { name: 'Créer mon compte' });
        await expect(signupBtn).toBeVisible();
    });
});
