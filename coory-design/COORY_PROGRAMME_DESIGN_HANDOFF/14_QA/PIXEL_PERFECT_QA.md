# QA Pixel Perfect

Environnement de référence : Chromium (Playwright), `deviceScaleFactor: 1`, police Plus Jakarta Sans chargée, viewport **1280 × hauteur de capture** (desktop) et **390 × 844** (mobile).

## Méthode par écran
1. Ouvrir la capture de référence (`SCREEN_INVENTORY.json` → `screenshot`).
2. Mettre l'app dans **le même état** (mêmes données de démo : Inès Ben Ali, Prépa HYROX Gand, semaine 2 — seed de test).
3. Capturer le même cadre (sans la sidebar si l'écran est un sous-composant).
4. Diff : `pixelmatch` / Playwright `toHaveScreenshot({ maxDiffPixelRatio: 0.01 })`.
5. Corriger : géométrie (largeurs 236 / 196 / 304 / 340, hauteurs 64 / 36 / 44…), typo (taille / graisse / interlettrage), couleurs (tokens), rayons, ombres, états.
6. Recommencer jusqu'au seuil. Contrôle manuel en plus (le rendu des polices varie selon l'OS).

## Script type
```ts
test('EDT-01', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 860 });
  await page.goto('/coach/programmes/<seed-id>?week=2&session=2&menu=open');
  await expect(page).toHaveScreenshot('EDT-01.png', { maxDiffPixelRatio: 0.01 });
});
```
Ne pas déclarer « pixel perfect » sans ce diff.
