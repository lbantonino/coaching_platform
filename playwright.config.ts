import { defineConfig, devices } from "@playwright/test";

// Tests de parcours (E2E). Prérequis : Supabase local démarré et seedé (npm run db:start / db:reset).
// Les tests tournent sur le build de production, au plus près du comportement réel.
const PORT = 3100;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  // Toute la pile tourne sur le Mac (base, serveur de test, 4 navigateurs, souvent le serveur de dev) :
  // les délais par défaut (30 s par test, 5 s par vérification) étaient trop justes quand la suite
  // complète tourne ; des tests corrects échouaient au hasard (tâche 3 du 05/11/2026).
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "fr-BE",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "ordinateur", use: { ...devices["Desktop Chrome"] } },
    { name: "telephone", use: { ...devices["Pixel 7"] } },
  ],
  // Fin de suite : les données créées par les tests sont retirées de la base locale (13/11/2026).
  globalTeardown: "./tests/e2e/global-teardown.ts",
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    // Assistant IA : un FAUX Claude scripté (aucun appel payant ; jamais actif sur Vercel).
    env: {
      ...(process.env as Record<string, string>),
      ASSISTANT_FAKE_SCRIPT: "tests/e2e/fixtures/assistant-script.json",
      // Jamais d'appel payant pendant les tests, même avec une clé dans .env.local (D-173).
      ANTHROPIC_API_KEY: "",
      // Alertes des séances (D-205) : secret connu des tests de la route /api/alertes.
      ALERTES_SECRET: "e2e-alertes-0123456789abcdef",
    },
    url: `http://localhost:${PORT}/login`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
