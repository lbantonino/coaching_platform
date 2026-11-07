// Images de la bibliothèque (D-75, fond lavande D-142) : prépare public/exercises/<clé>/<pose>.webp
// (servies telles quelles par l'application).
// 1. RepDB : l'original est gardé dans un cache hors Git (retéléchargé s'il manque), puis recoloré :
//    le ciel bleu devient la lavande #EEE9FC (scripts/illustration-lavender.mjs).
// 2. Hyrox : les illustrations Coory au fond lavande de la maquette « Bibliothèque » (06/11/2026),
//    converties en WebP sans perte (pixels identiques au fichier fourni).
// Licence RepDB : usage dans l'application seulement ; recolorer est permis (terme 4) ; ces images ne
// sont jamais données à une IA (terme 5).
// Usage : node scripts/catalog-images.mjs
import fs from "node:fs/promises";
import path from "node:path";

// sharp vient avec Next.js (optimisation d'images) : pas de dépendance de plus.
import sharp from "sharp";

import { toLavenderWebp } from "./illustration-lavender.mjs";

const KIT = "resources/exercise-library";
const CACHE = `${KIT}/data/repdb-images`; // originaux RepDB, ignorés par Git
const catalog = JSON.parse(await fs.readFile(`${KIT}/catalog/coory-exercise-catalog.json`, "utf8"));
const hyrox = JSON.parse(await fs.readFile(`${KIT}/curation/illustrations-hyrox.json`, "utf8"));

const target = (key, pose) => path.join("public", "exercises", key, `${pose}.webp`);
const exists = (file) =>
  fs.access(file).then(
    () => true,
    () => false,
  );

// 1. RepDB : les exercices visibles hors Hyrox, 8 à la fois.
const jobs = catalog.exercises
  .filter((e) => e.visibility === "active" && e.illustration.source === "repdb")
  .flatMap((e) =>
    Object.entries(e.illustration.repdb_files)
      .filter(([, url]) => url)
      .map(([pose, url]) => ({ key: e.key, pose, url })),
  );
let downloaded = 0;
let recolored = 0;
const withoutSky = [];
async function worker() {
  while (jobs.length) {
    const job = jobs.shift();
    const original = path.join(CACHE, job.key, `${job.pose}.webp`);
    if (!(await exists(original))) {
      const response = await fetch(job.url);
      if (!response.ok) throw new Error(`${job.url} : HTTP ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      // On lit les premiers octets : une page d'erreur n'est jamais enregistrée comme image.
      if (
        bytes.subarray(0, 4).toString() !== "RIFF" ||
        bytes.subarray(8, 12).toString() !== "WEBP"
      ) {
        throw new Error(`${job.url} : ce n'est pas une image WebP`);
      }
      await fs.mkdir(path.dirname(original), { recursive: true });
      await fs.writeFile(original, bytes);
      downloaded += 1;
    }
    const file = target(job.key, job.pose);
    await fs.mkdir(path.dirname(file), { recursive: true });
    if (!(await toLavenderWebp(original, file))) withoutSky.push(`${job.key}/${job.pose}`);
    recolored += 1;
  }
}
await Promise.all(Array.from({ length: 8 }, worker));

// 2. Hyrox : les fichiers de la maquette, tels quels (WebP sans perte).
let converted = 0;
for (const [fileName, keyPose] of Object.entries(hyrox.files)) {
  const source = `${KIT}/illustrations/${hyrox.folder}/${fileName}`;
  if (!(await exists(source))) {
    console.warn(`Absente : ${source}`);
    continue;
  }
  const [key, pose] = keyPose.split("/");
  if (!catalog.exercises.some((e) => e.key === key && e.category === "hyrox"))
    throw new Error(`${fileName} : clé Hyrox inconnue « ${key} »`);
  const file = target(key, pose);
  await fs.mkdir(path.dirname(file), { recursive: true });
  // Image de 900 px au plus : sans perte (pixels identiques au fichier fourni). Plus grande (ex. le
  // Sled push redessiné par Antonino, 1 254 px) : réduite à 900 px, qualité 90 (≈ 26 Ko au lieu de
  // 745 Ko sans perte), sans différence visible.
  const { width = 0, height = 0 } = await sharp(source).metadata();
  if (Math.max(width, height) <= 900) await sharp(source).webp({ lossless: true }).toFile(file);
  else
    await sharp(source)
      .resize({ width: 900, height: 900, fit: "inside" })
      .webp({ quality: 90 })
      .toFile(file);
  converted += 1;
}

console.log(
  `Images RepDB : ${recolored} recolorées en lavande (${downloaded} téléchargées). Images Hyrox : ${converted}.`,
);
if (withoutSky.length)
  console.warn(`Sans ciel bleu, laissées telles quelles : ${withoutSky.join(", ")}`);
