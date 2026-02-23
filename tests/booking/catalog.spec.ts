import { test, expect } from '@playwright/test';

test.describe('Consultation des Prestations', () => {
    test('Affiche le catalogue de services et permet la sélection', async ({ page }) => {
        // Naviguer vers la page de réservation
        await page.goto('/booking');

        // Vérifier l'affichage des éléments principaux
        await expect(page.locator('h1', { hasText: 'Choisissez votre lavage' })).toBeVisible();
        await expect(page.locator('text=Lavage Extérieur')).toBeVisible();
        await expect(page.locator('text=Lavage Complet')).toBeVisible();

        const btnContinuer = page.locator('button', { hasText: 'Continuer vers la localisation' });

        // Vérifier que le bouton continuer est désactivé par défaut
        await expect(btnContinuer).toBeDisabled();

        // Sélectionner un service
        await page.locator('button', { hasText: 'Lavage Premium' }).click();

        // Vérifier que le bouton continuer est maintenant activé
        await expect(btnContinuer).toBeEnabled();

        // Cliquer sur continuer (ne devrait pas crasher la page même si la route suivante n'existe pas encore)
        // Mais nous nous arrêtons ici car nous testons seulement la sélection
    });
});
