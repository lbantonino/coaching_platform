import { spawnSync } from "node:child_process";
import path from "node:path";

// Fin de la suite : les données créées par les tests (sportifs « … ordinateur-1794… », comptes
// d'inscription de test…) sont retirées de la base locale, pour qu'elle garde des noms de démonstration
// (demande d'Antonino du 13/11/2026). Un échec du nettoyage ne fait pas échouer la suite.
export default function globalTeardown() {
  // Playwright charge ce fichier en CommonJS : pas d'import.meta, la suite se lance depuis le projet.
  const script = path.resolve("scripts/clean-test-data.mjs");
  spawnSync("node", [script], { stdio: "inherit" });
}
