// Catalogue d'exercices -> migration SQL (D-75). Lit le catalogue maître construit dans
// resources/exercise-library (T0) et écrit une migration qui insère ou met à jour chaque exercice du
// catalogue commun d'après sa clé : relancée sur un nouveau catalogue, elle ne crée pas de doublon.
// Une image n'est référencée que si son fichier existe dans public/ (voir catalog-images.mjs).
// Usage : node scripts/catalog-to-sql.mjs supabase/migrations/<horodatage>_catalogue_exercices.sql
import fs from "node:fs/promises";

const output = process.argv[2];
if (!output) throw new Error("Indique le fichier de migration à écrire.");

const catalog = JSON.parse(
  await fs.readFile("resources/exercise-library/catalog/coory-exercise-catalog.json", "utf8"),
);
const byKey = new Map(catalog.exercises.map((e) => [e.key, e]));
const exists = (file) =>
  fs.access(file).then(
    () => true,
    () => false,
  );

async function imagePath(key, pose) {
  const url = `/exercises/${key}/${pose}.webp`;
  return (await exists(`public${url}`)) ? url : null;
}

const rows = [];
for (const e of catalog.exercises) {
  const [main, start, end] = await Promise.all(
    ["main", "start", "end"].map((pose) => imagePath(e.key, pose)),
  );
  rows.push({
    id: e.id,
    key: e.key,
    name_fr: e.name_fr,
    name_en: e.name_en,
    aliases_fr: e.aliases_fr,
    aliases_en: e.aliases_en,
    category: e.category,
    visibility: e.visibility,
    disciplines: e.disciplines,
    hyrox_station: e.hyrox_station,
    family: e.family,
    variant_of: e.variant_of ? byKey.get(e.variant_of).id : null,
    equipment: e.equipment,
    primary_muscles: e.primary_muscles,
    secondary_muscles: e.secondary_muscles,
    difficulty: e.difficulty,
    metrics: e.metrics,
    unilateral: e.unilateral,
    bodyweight: e.bodyweight,
    tags: e.tags,
    instructions_fr: e.instructions_fr,
    image_main: main,
    image_start: start,
    image_end: end,
    image_source: main || start ? e.illustration.source : null,
    source: e.sources[0].provider === "repdb" ? "repdb" : "coory",
    source_ids: e.sources.map((s) => s.kit_id ?? s.id),
    attribution_required: e.attribution_required,
    exportable: e.exportable,
  });
}

const columns = {
  id: "uuid",
  key: "text",
  name_fr: "text",
  name_en: "text",
  aliases_fr: "text[]",
  aliases_en: "text[]",
  category: "text",
  visibility: "text",
  disciplines: "text[]",
  hyrox_station: "smallint",
  family: "text",
  variant_of: "uuid",
  equipment: "text[]",
  primary_muscles: "text[]",
  secondary_muscles: "text[]",
  difficulty: "text",
  metrics: "text[]",
  unilateral: "boolean",
  bodyweight: "boolean",
  tags: "text[]",
  instructions_fr: "text[]",
  image_main: "text",
  image_start: "text",
  image_end: "text",
  image_source: "text",
  source: "text",
  source_ids: "text[]",
  attribution_required: "boolean",
  exportable: "boolean",
};
const names = Object.keys(columns);
const json = `[\n${rows.map((row) => JSON.stringify(row)).join(",\n")}\n]`;
if (json.includes("$catalogue$"))
  throw new Error("Le catalogue contient le délimiteur $catalogue$.");

const active = rows.filter((row) => row.visibility === "active").length;
const sql = `-- Catalogue commun d'exercices (D-75), généré par scripts/catalog-to-sql.mjs depuis
-- resources/exercise-library/catalog/coory-exercise-catalog.json (catalogue du ${catalog.generated_at.slice(0, 10)}).
-- ${rows.length} exercices, dont ${active} visibles (musculation et cardio : textes traduits et images
-- RepDB, « Exercise data by RepDB (repdb.co) » ; Hyrox : images Coory). Ne pas modifier à la main :
-- corriger le catalogue, puis générer une nouvelle migration. Chaque exercice est inséré ou mis à
-- jour d'après sa clé ; un exercice déjà mis en favori garde son identifiant.
insert into public.exercises (${names.join(", ")})
select ${names.join(", ")}
from jsonb_to_recordset($catalogue$${json}$catalogue$::jsonb) as catalogue (
  ${names.map((name) => `${name} ${columns[name]}`).join(",\n  ")}
)
on conflict (key) where organization_id is null do update set
  ${names
    .filter((name) => name !== "id" && name !== "key")
    .map((name) => `${name} = excluded.${name}`)
    .join(",\n  ")};
`;
await fs.writeFile(output, sql);
console.log(
  `${output} : ${rows.length} exercices (${active} visibles), ${rows.filter((r) => r.image_main || r.image_start).length} avec image.`,
);
