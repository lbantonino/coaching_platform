// `npm run db:clean-tests` (développement local) : retire de la base LOCALE les données créées par les
// tests de bout en bout (sportifs « … ordinateur-1794… », comptes d'inscription de test…), sans
// toucher à la graine de démonstration ni à ce qui a été créé à la main. Voir clean-test-data.sql.
// Aussi lancé à la fin de chaque suite Playwright (tests/e2e/global-teardown.ts).
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

// Conteneur de la base locale de Supabase : « supabase_db_ » + project_id de supabase/config.toml.
const CONTAINER = "supabase_db_coaching-platform";
// Puis les brouillons que l'Assistant IA modifie dans les tests (lot 3b) reviennent à leur état de
// graine : le même fichier que celui chargé par `supabase db reset`.
const sql = [
  readFileSync(path.join(import.meta.dirname, "clean-test-data.sql"), "utf8"),
  readFileSync(path.join(import.meta.dirname, "../supabase/seed-tests-assistant.sql"), "utf8"),
].join("\n");

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

// Photos de test (mineur n°9 du lot 5) : le test « la photo jointe devient celle du sportif » dépose
// une photo pour Léa et Noah Test ; la remise en état ci-dessus efface leur photo_path, mais le fichier
// restait dans le stockage LOCAL. Retirés par l'API de stockage (un DELETE SQL laisserait le fichier).
// Jamais bloquant : un échec est seulement signalé.
const TEST_PHOTO_FOLDERS = [
  "org/0b000000-0000-4000-8000-0000000000b1/athlete/e5000000-0000-4000-8000-000000000001",
  "org/0b000000-0000-4000-8000-0000000000b1/athlete/e5000000-0000-4000-8000-000000000002",
];
try {
  const env = Object.fromEntries(
    execFileSync("npx", ["supabase", "status", "-o", "env"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .split("\n")
      .filter((line) => line.includes("="))
      .map((line) => {
        const at = line.indexOf("=");
        return [line.slice(0, at), line.slice(at + 1).replace(/^"|"$/g, "")];
      }),
  );
  if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(env.API_URL ?? "")) {
    throw new Error("réservé à la base locale");
  }
  const client = createClient(env.API_URL, env.SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  const storage = client.storage.from("profile-photos");
  let removed = 0;
  for (const folder of TEST_PHOTO_FOLDERS) {
    const { data } = await storage.list(folder);
    const files = (data ?? []).map((file) => `${folder}/${file.name}`);
    if (files.length > 0) {
      const { error } = await storage.remove(files);
      if (!error) removed += files.length;
    }
  }
  if (removed > 0) console.log(`  photos de test : ${removed}`);

  // Fichiers joints à l'Assistant IA par les tests (D-213) : coachs A, B et C de la graine (leurs
  // lignes sont retirées par clean-test-data.sql).
  const assistantFiles = client.storage.from("assistant-files");
  let files = 0;
  for (const folder of [
    "0b000000-0000-4000-8000-0000000000b1/b0000000-0000-4000-8000-00000000000b",
    "0a000000-0000-4000-8000-0000000000a1/a0000000-0000-4000-8000-00000000000a",
    "0a000000-0000-4000-8000-0000000000a1/f0000000-0000-4000-8000-00000000000f",
  ]) {
    const { data } = await assistantFiles.list(folder, { limit: 1000 });
    const paths = (data ?? []).map((file) => `${folder}/${file.name}`);
    if (paths.length > 0) {
      const { error } = await assistantFiles.remove(paths);
      if (!error) files += paths.length;
    }
  }
  if (files > 0) console.log(`  fichiers de test de l'assistant : ${files}`);
} catch (error) {
  console.log(`  photos de test non retirées (${error instanceof Error ? error.message : error})`);
}
