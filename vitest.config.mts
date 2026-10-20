import path from "node:path";

import { defineConfig } from "vitest/config";

// Tests unitaires : règles métier PURES (validations, calculs, jetons), sans base ni navigateur.
// La base est testée par pgTAP (npm run db:test), les parcours par Playwright (npm run test:e2e).
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      // `server-only` interdit l'import côté navigateur ; dans les tests Node, on le neutralise.
      "server-only": path.resolve(import.meta.dirname, "tests/unit/stubs/server-only.ts"),
    },
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
  },
});
