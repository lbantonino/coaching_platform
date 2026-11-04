import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Rapports Playwright générés
    "playwright-report/**",
    "test-results/**",
    // Chaîne du catalogue d'exercices (données, curation, illustrations) : pas du code de l'app
    "resources/**",
    // Documentation, dont les modèles de code du kit du logo (docs/design/coory-brand/code)
    "docs/**",
  ]),
]);

export default eslintConfig;
