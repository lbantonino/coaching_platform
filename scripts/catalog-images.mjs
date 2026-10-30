// Images de la bibliothèque (D-75) : copie les images RepDB des exercices visibles et convertit les
// illustrations Hyrox de Coory, dans public/exercises/<clé>/<pose>.webp (servies telles quelles par
// l'application). Relançable : une image RepDB déjà présente n'est pas retéléchargée.
// Licence RepDB : usage dans l'application seulement ; ces images ne sont jamais données à une IA.
// Usage : node scripts/catalog-images.mjs
import fs from "node:fs/promises";
import path from "node:path";

// sharp vient avec Next.js (optimisation d'images) : pas de dépendance de plus.
import sharp from "sharp";

const KIT = "resources/exercise-library";
const catalog = JSON.parse(await fs.readFile(`${KIT}/catalog/coory-exercise-catalog.json`, "utf8"));
const hyrox = JSON.parse(
  await fs.readFile(`${KIT}/curation/illustrations-hyrox.json`, "utf8"),
).files;

const target = (key, pose) => path.join("public", "exercises", key, `${pose}.webp`);
const exists = (file) =>
  fs.access(file).then(
    () => true,
    () => false,
  );

// 1. RepDB : les exercices visibles hors Hyrox, 8 téléchargements à la fois.
const jobs = catalog.exercises
  .filter((e) => e.visibility === "active" && e.illustration.source === "repdb")
  .flatMap((e) =>
    Object.entries(e.illustration.repdb_files)
      .filter(([, url]) => url)
      .map(([pose, url]) => ({ key: e.key, pose, url })),
  );
let downloaded = 0;
let kept = 0;
async function worker() {
  while (jobs.length) {
    const job = jobs.shift();
    const file = target(job.key, job.pose);
    if (await exists(file)) {
      kept += 1;
      continue;
    }
    const response = await fetch(job.url);
    if (!response.ok) throw new Error(`${job.url} : HTTP ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    // On lit les premiers octets : une page d'erreur n'est jamais enregistrée comme image.
    if (bytes.subarray(0, 4).toString() !== "RIFF" || bytes.subarray(8, 12).toString() !== "WEBP") {
      throw new Error(`${job.url} : ce n'est pas une image WebP`);
    }
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, bytes);
    downloaded += 1;
  }
}
await Promise.all(Array.from({ length: 8 }, worker));

// 2. Hyrox : illustrations Coory, réduites à 900 px au plus et converties en WebP (transparence gardée).
let converted = 0;
for (const [fileName, keyPose] of Object.entries(hyrox)) {
  const source = `${KIT}/illustrations/hyrox/${fileName}`;
  if (!(await exists(source))) {
    console.warn(`Absente : ${source}`);
    continue;
  }
  const [key, pose] = keyPose.split("/");
  if (!catalog.exercises.some((e) => e.key === key && e.category === "hyrox"))
    throw new Error(`${fileName} : clé Hyrox inconnue « ${key} »`);
  const file = target(key, pose);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await sharp(source)
    .resize({ width: 900, height: 900, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, alphaQuality: 90 })
    .toFile(file);
  converted += 1;
}

console.log(
  `Images RepDB : ${downloaded} téléchargées, ${kept} déjà présentes. Images Hyrox converties : ${converted}.`,
);
