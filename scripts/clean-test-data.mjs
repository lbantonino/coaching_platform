// `npm run db:clean-tests` (développement local) : retire de la base LOCALE les données créées par les
// tests de bout en bout (sportifs « … ordinateur-1794… », comptes d'inscription de test…), sans
// toucher à la graine de démonstration ni à ce qui a été créé à la main. Voir clean-test-data.sql.
// Aussi lancé à la fin de chaque suite Playwright (tests/e2e/global-teardown.ts).
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

// Conteneur de la base locale de Supabase : « supabase_db_ » + project_id de supabase/config.toml.
const CONTAINER = "supabase_db_coaching-platform";
const sql = readFileSync(path.join(import.meta.dirname, "clean-test-data.sql"), "utf8");

const result = spawnSync(
  "docker",
  [
    "exec",
    "-i",
    CONTAINER,
    "psql",
    "-U",
    "postgres",
    "-d",
    "postgres",
    "-q",
    "-v",
    "ON_ERROR_STOP=1",
  ],
  { input: sql, encoding: "utf8" },
);
const notices = `${result.stdout ?? ""}${result.stderr ?? ""}`
  .split("\n")
  .filter((line) => line.trim() !== "")
  .map((line) => line.replace(/^.*NOTICE:\s*/, "  "));
if (result.status !== 0) {
  console.error("Nettoyage des données de test impossible :", notices.join("\n") || result.error);
  process.exit(result.status ?? 1);
}
console.log(
  notices.length > 0
    ? `Données de test retirées de la base locale :\n${notices.join("\n")}`
    : "Base locale déjà propre.",
);
