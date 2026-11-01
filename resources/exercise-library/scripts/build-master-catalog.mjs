// T0 : construit le catalogue maître Coory, sans toucher à l'application ni à la base.
// Entrées : data/source/repdb-exercises.json (RepDB), data/coory_extensions.json (kit Coory) et curation/*.json
// (décisions, vocabulaires, traductions, périmètre de la bibliothèque, priorités).
// Images : celles de RepDB pour les exercices RepDB (adresses seulement, copiées plus tard dans notre stockage),
// sauf l'Hyrox, illustré par Coory. Une image RepDB n'est jamais donnée à une IA.
// Sorties : catalog/. Usage, depuis le dossier du kit : node scripts/build-master-catalog.mjs
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const read = async (p) => JSON.parse(await fs.readFile(path.join(root, p), "utf8"));
const out = (p) => path.join(root, "catalog", p);
const errors = [];
const fail = (message) => errors.push(message);
const uniq = (list) => [...new Set(list.filter(Boolean))];

const repdb = (await read("data/source/repdb-exercises.json")).exercises;
const kit = (await read("data/coory_extensions.json")).exercises;
const vocab = await read("curation/vocabulaires.json");
const kitDecisions = (await read("curation/decisions-kit.json")).decisions;
const repdbDecisions = await read("curation/decisions-repdb.json");
const translations = Object.fromEntries((await read("curation/traductions-fr.json")).items.map((t) => [t.id, t]));
const priorities = await read("curation/priorites-illustrations.json");
const library = await read("curation/bibliotheque.json");
const coachContent = (await read("curation/contenu-coory.json")).items;

// Identifiant interne stable : UUID v5 dérivé de la clé. L'espace de noms ne doit JAMAIS changer,
// sinon tous les identifiants changeraient entre deux générations.
const NAMESPACE = "c0a7e1d4-5f2b-4c3e-9a8d-7b6e5f4a3c21";
function stableId(key) {
  const ns = Buffer.from(NAMESPACE.replace(/-/g, ""), "hex");
  const h = crypto.createHash("sha1").update(Buffer.concat([ns, Buffer.from(`coory-exercise:${key}`, "utf8")])).digest();
  h[6] = (h[6] & 0x0f) | 0x50;
  h[8] = (h[8] & 0x3f) | 0x80;
  const x = h.subarray(0, 16).toString("hex");
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`;
}

const REASONS = {
  NOM_TRADUIT: "Nom traduit de l'anglais, à relire",
  CONSIGNES_TRADUITES: "Consignes traduites de l'anglais, à relire",
  NOM_PROPOSE: "Nom proposé par le kit Coory, à relire",
  MOUVEMENT_A_VALIDER: "Nouvel exercice Coory : mouvement à valider par un coach",
  CONSIGNES_ABSENTES: "Aucune consigne : à écrire puis faire valider par un coach",
  MUSCLES_ABSENTS: "Muscles à renseigner",
  DIFFICULTE_ABSENTE: "Niveau à renseigner",
  DOUBLON_POSSIBLE: "Doublon possible avec un autre exercice, à trancher",
  VARIANTE_A_CONFIRMER: "Rattachement de variante ou matériel à confirmer",
  NOTE_TRADUCTION: "Remarque de traduction",
  FORMULATION_MEDICALE_NEUTRALISEE: "Formulation médicale retirée des consignes",
  NOM_LONG: "Nom de plus de 45 caractères, à raccourcir si possible",
  NOM_EN_DOUBLE: "Même nom français qu'un autre exercice",
};

const LOAD_EQUIPMENT = new Set(["barbell", "dumbbell", "kettlebell", "ez_bar", "trap_bar", "plates", "sandbag", "medicine_ball", "slam_ball", "wall_ball", "landmine"]);
const CARDIO_MACHINES = new Set(["air_bike", "stationary_bike", "bicycle", "elliptical", "stair_climber"]);
// Matériel qui n'ajoute aucune charge : un exercice Coory qui n'utilise que lui reste « au poids du corps ».
const NO_EXTERNAL_LOAD = new Set(["mat", "wall", "step", "bench", "plyo_box", "foam_roller", "partner"]);

function normalizeEquipment(list, where) {
  const result = [];
  for (const raw of list) {
    const alias = Object.hasOwn(vocab.equipment_aliases, raw) ? vocab.equipment_aliases[raw] : raw;
    for (const code of [alias].flat()) {
      if (code === null) continue;
      if (!vocab.equipment[code]) fail(`${where} : matériel inconnu « ${raw} »`);
      result.push(code);
    }
  }
  return uniq(result);
}

// Mesures réglables dans une séance, déduites par une règle simple quand aucune décision ne les fixe.
function deriveMetrics(r, equipment) {
  const eq = new Set(equipment);
  const loaded = equipment.some((code) => LOAD_EQUIPMENT.has(code));
  const isStatic = r.force_type === "static" || /\b(hold|isometric)\b/i.test(r.name_en);
  if (eq.has("ski_erg") || eq.has("rower")) return ["distance_m", "duration_s", "calories_kcal", "pace_s_per_500m"];
  if (equipment.some((code) => CARDIO_MACHINES.has(code))) return ["duration_s", "distance_m", "calories_kcal"];
  if (eq.has("treadmill")) return ["duration_s", "distance_m", "speed_kmh", "incline_pct"];
  if (eq.has("sled")) return ["distance_m", "lengths", "load_kg"];
  if (eq.has("battle_rope") || eq.has("jump_rope")) return ["duration_s", "reps"];
  if (loaded && /\b(carry|farmer'?s?|walk)\b/i.test(r.name_en)) return ["distance_m", "duration_s", "load_kg"];
  if (r.category === "cardio") return ["duration_s", "reps"];
  if (r.category === "plyometrics") return /box/i.test(r.name_en) ? ["reps", "height_cm"] : ["reps"];
  if (r.category === "olympic") return ["reps", "load_kg"];
  if (r.category === "stretching") return isStatic ? ["duration_s"] : ["reps", "duration_s"];
  if (isStatic) return loaded ? ["duration_s", "load_kg"] : ["duration_s"];
  return loaded || eq.has("cable") || [...eq].some((code) => vocab.equipment[code]?.group === "machines")
    ? ["reps", "load_kg", "tempo"]
    : ["reps", "tempo"];
}

// Poses à illustrer : une seule image pour un maintien, une machine cardio ou la course ; début et fin
// en plus pour un mouvement qui va d'une position à une autre.
function recommendedPoses(metrics, disciplines) {
  const staticOnly = metrics.includes("duration_s") && !metrics.includes("reps") && !metrics.includes("distance_m");
  const endurance = metrics.includes("pace_s_per_km") || metrics.includes("pace_s_per_500m") || metrics.includes("calories_kcal") || metrics.includes("speed_kmh");
  if (staticOnly || endurance) return ["main"];
  if (disciplines.includes("warmup") && metrics.includes("distance_m") && !metrics.includes("reps")) return ["main"];
  return ["main", "start", "end"];
}

function illustration(key, poses) {
  return {
    source: "coory",
    status: "missing",
    priority: null,
    recommended_poses: poses,
    storage_paths: Object.fromEntries(["main", "start", "end"].map((pose) => [pose, `exercises/${key}/${pose}.webp`])),
    source_files_expected: poses.map((pose) => `${key}/${pose}.png`),
  };
}

const exercises = new Map();
const repdbImages = new Map();
const duplicates = [];
const sessionTypes = [];
const kitDisciplineMap = { hyrox: "hyrox", running: "running", mobility: "mobility", warmup: "warmup", strength: "strength" };
let removedMedicalTags = 0;
let removedMedicalGoals = 0;

// 1. RepDB : tout est repris, sauf les vrais doublons internes et les simples réglages.
for (const r of repdb) {
  if (repdbDecisions.merges[r.id] || repdbDecisions.presets[r.id]) continue;
  const t = translations[r.id];
  if (!t) { fail(`${r.id} : traduction absente`); continue; }
  const ov = repdbDecisions.overrides[r.id] ?? {};
  const tags = [];
  const disciplines = [...vocab.repdb_category_to_disciplines[r.category]];
  for (const tag of r.tags ?? []) {
    if (vocab.tags_removed_medical[tag]) removedMedicalTags += 1;
    else if (tag === "warm_up") disciplines.push("warmup");
    else if (tag === "cardio") disciplines.push("cardio");
    else if (vocab.tags[tag]) tags.push(vocab.tags[tag].code);
    else if (!vocab.tags_moved[tag]) fail(`${r.id} : tag inconnu « ${tag} »`);
  }
  if (vocab.tags_from_category[r.category]) tags.push(vocab.tags_from_category[r.category].code);
  const equipment = normalizeEquipment(
    [r.equipment, (r.tags ?? []).includes("requires_bench") ? "bench" : null, /landmine/i.test(r.name_en) ? "landmine" : null].filter(Boolean),
    r.id,
  );
  for (const m of [...(r.primary_muscles ?? []), ...(r.secondary_muscles ?? [])]) if (!vocab.muscles[m]) fail(`${r.id} : muscle inconnu « ${m} »`);
  const goals = (r.goals ?? []).filter((g) => {
    if (vocab.goals_removed_medical[g]) { removedMedicalGoals += 1; return false; }
    if (!vocab.goals[g]) fail(`${r.id} : objectif inconnu « ${g} »`);
    return true;
  });
  const nameFr = ov.name_fr ?? t.name_fr.trim();
  const allDisciplines = uniq([...disciplines, ...(ov.add_disciplines ?? [])]);
  const metrics = ov.metrics ?? deriveMetrics(r, equipment);
  const reasons = ["NOM_TRADUIT", "CONSIGNES_TRADUITES", ...(ov.review_reasons ?? [])];
  const notes = uniq([...(t.notes ?? []), ...(ov.review_note ? [ov.review_note] : [])]);
  if ((t.notes ?? []).some((n) => /médical/i.test(n))) reasons.push("FORMULATION_MEDICALE_NEUTRALISEE");
  if ((t.notes ?? []).some((n) => !/médical/i.test(n))) reasons.push("NOTE_TRADUCTION");
  if (!(r.primary_muscles ?? []).length) reasons.push("MUSCLES_ABSENTS");
  repdbImages.set(r.id, { category: r.category, files: r.images?.flat ?? {} });
  exercises.set(r.id, {
    id: stableId(r.id),
    key: r.id,
    scope: "global",
    organization_id: null,
    name_fr: nameFr,
    name_en: r.name_en,
    aliases_fr: uniq([...(ov.aliases_fr ?? []), ...(t.aliases_fr ?? [])]).filter((a) => a.toLowerCase() !== nameFr.toLowerCase()),
    aliases_en: uniq(t.aliases_en ?? []).filter((a) => a.toLowerCase() !== r.name_en.toLowerCase()),
    disciplines: allDisciplines,
    hyrox_station: ov.hyrox_station ?? null,
    family: r.variation_group ?? null,
    variant_of: null,
    equipment,
    primary_muscles: r.primary_muscles ?? [],
    secondary_muscles: r.secondary_muscles ?? [],
    difficulty: r.difficulty ?? null,
    metrics,
    unilateral: Boolean(r.is_unilateral),
    bodyweight: Boolean(r.is_bodyweight),
    force_type: r.force_type ?? null,
    mechanic: r.mechanic ?? null,
    body_part: r.body_part ?? null,
    goals,
    tags: uniq(tags),
    met: r.met ?? null,
    instructions_fr: t.instructions_fr,
    instructions_en: r.instructions_en,
    images: { main: null, start: null, end: null },
    illustration: illustration(r.id, recommendedPoses(metrics, allDisciplines)),
    sources: [{ provider: "repdb", id: r.id, kit_id: `repdb-${r.id}`, license: "RepDB Free Tier v1.0", attribution: "Exercise data by RepDB (repdb.co)" }],
    merged_from: [],
    attribution_required: true,
    exportable: false,
    review: { status: "pending", name_fr: "translation_draft", instructions_fr: "translation_draft", content: "source_repdb", reasons: uniq(reasons), notes },
  });
}

// 2. Kit Coory : nouveaux exercices et variantes d'abord, pour que les fusions trouvent leur cible.
const handled = new Set();
for (const k of kit) {
  const d = kitDecisions[k.id];
  if (!d) { fail(`${k.id} : aucune décision`); continue; }
  if (d.action !== "keep" && d.action !== "variant") continue;
  handled.add(k.id);
  if (exercises.has(d.key)) fail(`${k.id} : la clé « ${d.key} » existe déjà`);
  for (const disc of d.disciplines) if (!vocab.disciplines[disc]) fail(`${k.id} : discipline inconnue « ${disc} »`);
  for (const m of d.metrics) if (!vocab.metrics[m]) fail(`${k.id} : mesure inconnue « ${m} »`);
  const equipment = normalizeEquipment(d.equipment, k.id);
  // Consignes et muscles écrits par Coory (curation/contenu-coory.json), sinon aucun.
  const instructions = coachContent[d.key]?.instructions_fr ?? [];
  const primaryMuscles = coachContent[d.key]?.primary_muscles ?? [];
  for (const m of primaryMuscles) if (!vocab.muscles[m] && !vocab.muscle_groups[m]) fail(`${d.key} : muscle inconnu « ${m} »`);
  const reasons = ["NOM_PROPOSE", "MOUVEMENT_A_VALIDER", ...(instructions.length ? [] : ["CONSIGNES_ABSENTES"]), ...(primaryMuscles.length ? [] : ["MUSCLES_ABSENTS"]), "DIFFICULTE_ABSENTE"];
  if (d.confidence === "a_confirmer") reasons.push(d.action === "variant" || d.equipment.includes("partner") ? "VARIANTE_A_CONFIRMER" : "DOUBLON_POSSIBLE");
  exercises.set(d.key, {
    id: stableId(d.key),
    key: d.key,
    scope: "global",
    organization_id: null,
    name_fr: d.name_fr,
    name_en: k.name_en,
    aliases_fr: uniq([...(d.aliases_fr ?? []), k.name_fr]).filter((a) => a.toLowerCase() !== d.name_fr.toLowerCase()),
    aliases_en: uniq(d.aliases_en ?? []).filter((a) => a.toLowerCase() !== k.name_en.toLowerCase()),
    disciplines: d.disciplines,
    hyrox_station: d.hyrox_station ?? null,
    family: d.family ?? null,
    variant_of: d.variant_of ?? null,
    equipment,
    primary_muscles: primaryMuscles,
    secondary_muscles: [],
    difficulty: null,
    metrics: d.metrics,
    unilateral: Boolean(d.unilateral),
    bodyweight: equipment.every((code) => NO_EXTERNAL_LOAD.has(code)),
    force_type: null,
    mechanic: null,
    body_part: null,
    goals: [],
    tags: [],
    met: null,
    instructions_fr: instructions,
    instructions_en: [],
    images: { main: null, start: null, end: null },
    illustration: illustration(d.key, recommendedPoses(d.metrics, d.disciplines)),
    sources: [{ provider: "coory_kit", id: k.id, license: "Coory, création originale" }],
    merged_from: [],
    attribution_required: false,
    exportable: true,
    review: { status: "pending", name_fr: "proposal_to_review", instructions_fr: instructions.length ? "written_by_coory" : "missing", content: "coach_validation_required", reasons, notes: [d.reason] },
  });
}

function absorb(target, sourceProvider, sourceId, nameFr, nameEn, extraDisciplines) {
  target.merged_from.push(sourceId);
  target.sources.push({ provider: sourceProvider, id: sourceId, role: "doublon fusionné" });
  if (nameFr && nameFr.toLowerCase() !== target.name_fr.toLowerCase()) target.aliases_fr = uniq([...target.aliases_fr, nameFr]);
  if (nameEn && nameEn.toLowerCase() !== target.name_en.toLowerCase()) target.aliases_en = uniq([...target.aliases_en, nameEn]);
  target.disciplines = uniq([...target.disciplines, ...extraDisciplines]);
}

// 3. Doublons internes à RepDB.
for (const [id, d] of Object.entries(repdbDecisions.merges)) {
  const r = repdb.find((x) => x.id === id);
  const target = exercises.get(d.target);
  if (!r || !target) { fail(`fusion RepDB ${id} -> ${d.target} impossible`); continue; }
  absorb(target, "repdb", id, translations[id]?.name_fr, r.name_en, []);
  duplicates.push({ type: "Doublon interne RepDB", source: `repdb-${id}`, source_name: `${translations[id]?.name_fr} (${r.name_en})`, kept: target, reason: d.reason, confidence: "sure" });
}

// 4. Doublons du kit (vers RepDB ou vers une autre entrée du kit) et configurations mises de côté.
for (const k of kit) {
  const d = kitDecisions[k.id];
  if (!d || handled.has(k.id)) continue;
  handled.add(k.id);
  if (d.action === "merge" || d.action === "merge_coory") {
    const target = exercises.get(d.target);
    if (!target) { fail(`${k.id} : cible « ${d.target} » introuvable`); continue; }
    absorb(target, "coory_kit", k.id, k.name_fr, k.name_en, [kitDisciplineMap[k.discipline], ...(d.add_disciplines ?? [])]);
    duplicates.push({
      type: d.action === "merge" ? "Doublon kit Coory / RepDB" : "Doublon interne au kit Coory",
      source: k.id, source_name: `${k.name_fr} (${k.name_en})`, kept: target, reason: d.reason, confidence: d.confidence ?? "sure",
    });
    continue;
  }
  if (!["preset", "technique", "seance", "bloc"].includes(d.action)) { fail(`${k.id} : action inconnue « ${d.action} »`); continue; }
  sessionTypes.push({
    source_id: k.id, provider: "coory_kit", name_fr: k.name_fr, name_en: k.name_en, kind: d.action,
    disciplines: [kitDisciplineMap[k.discipline]], exercises: d.exercises ?? [d.exercise], parameters: d.parameters ?? {},
    reason: d.reason, confidence: d.confidence ?? "sure",
  });
}
for (const [id, d] of Object.entries(repdbDecisions.presets)) {
  const r = repdb.find((x) => x.id === id);
  if (!r) { fail(`preset RepDB ${id} introuvable`); continue; }
  sessionTypes.push({
    source_id: `repdb-${id}`, provider: "repdb", name_fr: translations[id]?.name_fr, name_en: r.name_en, kind: "preset",
    disciplines: vocab.repdb_category_to_disciplines[r.category], exercises: [d.exercise], parameters: d.parameters, reason: d.reason, confidence: d.confidence ?? "sure",
    instructions_fr: translations[id]?.instructions_fr ?? [],
  });
}
for (const k of kit) if (!handled.has(k.id)) fail(`${k.id} : entrée du kit non traitée`);

// 5. Contrôles de cohérence.
const all = [...exercises.values()];
for (const e of all) {
  if (e.variant_of && !exercises.has(e.variant_of)) fail(`${e.key} : variante de « ${e.variant_of} », introuvable`);
  if (e.variant_of && !e.family) e.family = exercises.get(e.variant_of)?.family ?? null;
  for (const disc of e.disciplines) if (!vocab.disciplines[disc]) fail(`${e.key} : discipline inconnue « ${disc} »`);
  for (const m of e.metrics) if (!vocab.metrics[m]) fail(`${e.key} : mesure inconnue « ${m} »`);
  if (e.difficulty && !vocab.difficulty[e.difficulty]) fail(`${e.key} : niveau inconnu`);
  if (e.name_fr.length > 45) e.review.reasons.push("NOM_LONG");
  const text = JSON.stringify([e.name_fr, e.aliases_fr, e.instructions_fr]);
  if (/[—–]/.test(text)) fail(`${e.key} : tiret long dans le texte français`);
}
for (const key of Object.keys(coachContent)) if (exercises.get(key)?.sources[0].provider !== "coory_kit") fail(`contenu Coory : « ${key} » n'est pas un exercice du kit Coory`);
for (const s of sessionTypes) for (const key of s.exercises) if (!exercises.has(key)) fail(`${s.source_id} : exercice « ${key} » introuvable`);
const byName = new Map();
for (const e of all) byName.set(e.name_fr.toLowerCase(), [...(byName.get(e.name_fr.toLowerCase()) ?? []), e]);
for (const group of byName.values()) if (group.length > 1) for (const e of group) e.review.reasons.push("NOM_EN_DOUBLE");
if (new Set(all.map((e) => e.id)).size !== all.length) fail("identifiants internes en double");

// 6. Périmètre de la bibliothèque : catégorie, visible ou masqué, et source des images.
const hyrox = new Set(library.hyrox);
const running = new Set(library.running);
for (const key of [...hyrox, ...running]) if (!exercises.has(key)) fail(`bibliothèque : clé inconnue « ${key} »`);
for (const e of all) {
  const fromRepdb = e.sources[0].provider === "repdb";
  const repdb = repdbImages.get(e.key);
  e.category = hyrox.has(e.key)
    ? "hyrox"
    : fromRepdb ? library.repdb_category_to_category[repdb.category] : library.coory_discipline_to_category[e.disciplines[0]];
  if (!library.categories[e.category]) fail(`${e.key} : catégorie inconnue « ${e.category} »`);
  const hiddenBecause = (library.hidden_keys ?? []).includes(e.key) ? "removed"
    : running.has(e.key) ? "running"
    : !library.visible_categories.includes(e.category) ? "mobility"
    : !fromRepdb && e.category !== "hyrox" ? "coory_without_content"
    : null;
  e.visibility = hiddenBecause ? "hidden" : "active";
  e.hidden_reason = hiddenBecause ? library.hidden_reasons[hiddenBecause] : null;
  // Exercice RepDB hors Hyrox : ses images RepDB (une principale, ou un début et une fin). Sans image
  // principale, l'image de début en tient lieu.
  if (fromRepdb && e.category !== "hyrox") {
    const url = (file) => (file ? library.repdb_image_base_url + file : null);
    const files = { main: url(repdb.files.main), start: url(repdb.files.start), end: url(repdb.files.peak) };
    if (!files.main && !files.start) fail(`${e.key} : aucune image RepDB`);
    e.illustration = {
      source: "repdb",
      status: "available_from_repdb",
      priority: null,
      display_main: files.main ? "main" : "start",
      recommended_poses: Object.keys(files).filter((pose) => files[pose]),
      repdb_files: files,
      storage_paths: Object.fromEntries(Object.keys(files).filter((pose) => files[pose]).map((pose) => [pose, `exercises/${e.key}/${pose}.webp`])),
      source_files_expected: [],
    };
  } else if (e.category === "hyrox") {
    e.illustration.status = "awaiting_coory_upload";
    e.illustration.repdb_images_used = false;
  }
}

// 7. Priorités d'illustration : seulement ce que Coory dessine elle-même.
const rank = new Map();
for (const tier of priorities.tiers) for (const key of tier.keys) {
  if (!exercises.has(key)) fail(`priorité ${tier.code} : clé inconnue « ${key} »`);
  if (rank.has(key)) fail(`priorité : « ${key} » listée deux fois`);
  rank.set(key, { tier, order: rank.size + 1 });
}
for (const e of all) if (rank.has(e.key)) e.illustration.priority = rank.get(e.key).tier.code;
for (const e of all) e.review.reasons = uniq(e.review.reasons);

if (errors.length) {
  console.error(`Échec : ${errors.length} problème(s)\n- ${errors.slice(0, 40).join("\n- ")}`);
  process.exit(1);
}

// 8. Écriture des livrables.
await fs.mkdir(path.join(root, "catalog"), { recursive: true });
const sorted = all.sort((a, b) => a.key.localeCompare(b.key));
const active = sorted.filter((e) => e.visibility === "active");
const generatedAt = new Date().toISOString();
const catalog = {
  schema_version: "coory-exercise-catalog/1.0",
  generated_at: generatedAt,
  id_namespace: NAMESPACE,
  attribution: { text: "Exercise data by RepDB (repdb.co)", url: "https://repdb.co", required_for: "exercices dont attribution_required = true" },
  license_notes: [
    "Données RepDB : usage dans l'application uniquement (Free Tier v1.0) ; ne jamais republier ce fichier ni un dérivé comme jeu de données ou API.",
    "Images RepDB : utilisées dans l'application pour les exercices RepDB hors Hyrox (redimensionner ou recadrer est permis), à copier dans notre stockage ; jamais republiées, jamais données à une IA générative.",
    "Hyrox : images Coory originales uniquement, aucune image RepDB.",
    "Exercices Coory (exportable = true) : création originale, libres d'export.",
  ],
  counts: { exercises: sorted.length, active: active.length, hidden: sorted.length - active.length },
  vocabularies: {
    categories: library.categories,
    disciplines: vocab.disciplines, difficulty: vocab.difficulty, metrics: vocab.metrics, metrics_always_available: vocab.metrics_always_available,
    equipment: vocab.equipment, equipment_groups: vocab.equipment_groups, muscles: vocab.muscles, muscle_groups: vocab.muscle_groups,
    tags: Object.fromEntries([...Object.values(vocab.tags), ...Object.values(vocab.tags_from_category)].map((t) => [t.code, t.label])),
    goals: vocab.goals, force_type: vocab.force_type, mechanic: vocab.mechanic, body_part: vocab.body_part, review_reasons: REASONS,
  },
  exercises: sorted,
};
await fs.writeFile(out("coory-exercise-catalog.json"), JSON.stringify(catalog, null, 2) + "\n");

const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const writeCsv = async (file, header, rows) =>
  fs.writeFile(out(file), "﻿" + [header, ...rows].map((row) => row.map(csvCell).join(";")).join("\n") + "\n");
const join = (list) => (list ?? []).join(" | ");
const label = (dict, code) => (dict[code]?.label ?? dict[code] ?? code);
const discOrder = Object.keys(vocab.disciplines);
const catOrder = Object.keys(library.categories);
const byCategory = (a, b) =>
  (a.visibility === b.visibility ? 0 : a.visibility === "active" ? -1 : 1) ||
  catOrder.indexOf(a.category) - catOrder.indexOf(b.category) ||
  (a.hyrox_station ?? 99) - (b.hyrox_station ?? 99) ||
  a.name_fr.localeCompare(b.name_fr, "fr");
const forHumans = [...sorted].sort(byCategory);

await writeCsv(
  "coory-exercise-catalog.csv",
  ["id", "cle", "nom_fr", "nom_en", "categorie", "visibilite", "raison_masquage", "alias_fr", "alias_en", "disciplines", "station_hyrox", "famille", "variante_de", "materiel", "muscles_principaux", "muscles_secondaires", "niveau", "mesures", "unilateral", "poids_du_corps", "type_de_force", "mecanique", "partie_du_corps", "objectifs", "tags", "met", "consignes_fr", "source", "ids_origine", "fusionne_depuis", "mention_repdb_requise", "exportable", "statut_validation", "motifs_validation", "source_images", "etat_images", "image_principale_affichee", "images_repdb", "fichiers_coory_attendus"],
  forHumans.map((e) => [
    e.id, e.key, e.name_fr, e.name_en, library.categories[e.category], e.visibility === "active" ? "visible" : "masqué", e.hidden_reason,
    join(e.aliases_fr), join(e.aliases_en), join(e.disciplines), e.hyrox_station, e.family, e.variant_of,
    join(e.equipment), join(e.primary_muscles), join(e.secondary_muscles), e.difficulty, join(e.metrics), e.unilateral ? "oui" : "non",
    e.bodyweight ? "oui" : "non", e.force_type, e.mechanic, e.body_part, join(e.goals), join(e.tags), e.met, join(e.instructions_fr),
    e.sources[0].provider, join(e.sources.map((s) => s.kit_id ?? s.id)), join(e.merged_from), e.attribution_required ? "oui" : "non",
    e.exportable ? "oui" : "non", e.review.status, join(e.review.reasons), e.illustration.source, e.illustration.status,
    e.illustration.display_main ?? "", join(Object.values(e.illustration.repdb_files ?? {}).filter(Boolean)), join(e.illustration.source_files_expected),
  ]),
);

await writeCsv(
  "doublons-fusionnes.csv",
  ["type", "id_origine_retire", "nom_origine", "conserve_cle", "conserve_nom_fr", "conserve_source", "justification", "confiance"],
  duplicates.map((d) => [d.type, d.source, d.source_name, d.kept.key, d.kept.name_fr, d.kept.sources[0].provider, d.reason, d.confidence === "sure" ? "sûre" : "à confirmer"]),
);

const kindLabels = { preset: "Réglage d'un exercice", technique: "Travail technique", seance: "Séance type", bloc: "Bloc (enchaînement)" };
const futureType = { preset: "block_template", technique: "block_template", seance: "session_template", bloc: "block_template" };
await fs.writeFile(
  out("seances-types.json"),
  JSON.stringify({
    schema_version: "coory-session-types/1.0",
    generated_at: generatedAt,
    _lisez_moi: "Configurations d'entraînement retirées du catalogue d'exercices (T0). Elles serviront aux onglets Blocs et Séances types (P3-02 et P3-03). Les paramètres ne reprennent que ce que dit le nom d'origine : rien n'est inventé. Toutes sont à valider par un coach.",
    counts: Object.fromEntries(Object.keys(kindLabels).map((k) => [k, sessionTypes.filter((s) => s.kind === k).length])),
    kinds: kindLabels,
    items: sessionTypes.map((s) => ({
      source_id: s.source_id, provider: s.provider, name_fr: s.name_fr, name_en: s.name_en, kind: s.kind, future_type: futureType[s.kind],
      disciplines: s.disciplines, exercises: s.exercises.map((key) => ({ key, id: exercises.get(key).id, name_fr: exercises.get(key).name_fr })),
      parameters: s.parameters, reason: s.reason, review: { status: "pending", confidence: s.confidence, reason: "coach_validation_required" },
      ...(s.instructions_fr?.length ? { instructions_fr_source: s.instructions_fr } : {}),
    })),
  }, null, 2) + "\n",
);

// À valider : seulement ce qui sera visible ; les exercices masqués attendront leur éventuel retour.
const reviewRows = [];
for (const e of active.sort(byCategory)) {
  reviewRows.push([
    "exercice", library.categories[e.category], e.key, e.name_fr, e.name_en, e.sources[0].provider === "repdb" ? "RepDB (traduit)" : "Kit Coory",
    join(e.review.reasons), join(e.review.reasons.map((r) => REASONS[r])), join(e.review.notes), "à valider",
  ]);
}
for (const s of sessionTypes) {
  reviewRows.push([
    "séance type", "", s.source_id, s.name_fr, s.name_en, s.provider === "repdb" ? "RepDB (traduit)" : "Kit Coory",
    s.confidence === "a_confirmer" ? "CONFIGURATION_A_CONFIRMER" : "CONFIGURATION", kindLabels[s.kind], s.reason, "à valider",
  ]);
}
await writeCsv("a-valider.csv", ["type", "categorie", "cle_ou_id", "nom_fr", "nom_en", "origine", "motifs", "motifs_en_clair", "remarques", "statut"], reviewRows);

// Images que Coory doit fournir : une ligne par fichier attendu.
const illusRows = sorted
  .filter((e) => e.illustration.priority)
  .sort((a, b) => rank.get(a.key).order - rank.get(b.key).order)
  .flatMap((e) => e.illustration.recommended_poses.map((pose) => [
    rank.get(e.key).order, e.hyrox_station ?? "variante", e.key, e.name_fr, pose === "main" ? "Image principale" : pose === "start" ? "Début du mouvement" : "Fin du mouvement",
    `${e.key}/${pose}.png`, join(e.equipment.map((c) => label(vocab.equipment, c))) || "Poids du corps", e.illustration.status,
  ]));
await fs.rm(out("illustrations-prioritaires.csv"), { force: true });
await writeCsv("illustrations-hyrox.csv", ["ordre", "station_hyrox", "cle", "nom_fr", "pose", "fichier_attendu", "materiel", "etat"], illusRows);

await writeCsv(
  "exercices-masques.csv",
  ["cle", "nom_fr", "nom_en", "categorie", "origine", "raison", "images"],
  sorted.filter((e) => e.visibility === "hidden").sort(byCategory).map((e) => [
    e.key, e.name_fr, e.name_en, library.categories[e.category], e.sources[0].provider === "repdb" ? "RepDB" : "Kit Coory", e.hidden_reason,
    e.illustration.source === "repdb" ? "Images RepDB disponibles" : "Aucune image",
  ]),
);

// 9. Chiffres pour le rapport.
const count = (fn) => sorted.filter(fn).length;
const countActive = (fn) => active.filter(fn).length;
const stats = {
  generated_at: generatedAt,
  input: { repdb: repdb.length, kit: kit.length, total: repdb.length + kit.length },
  library: {
    active: active.length,
    hidden: sorted.length - active.length,
    active_by_category: Object.fromEntries(catOrder.map((c) => [c, countActive((e) => e.category === c)])),
    hidden_by_reason: Object.fromEntries(Object.entries(library.hidden_reasons).map(([k, v]) => [k, count((e) => e.hidden_reason === v)])),
    active_images: {
      from_repdb: countActive((e) => e.illustration.source === "repdb"),
      repdb_main_image: countActive((e) => e.illustration.display_main === "main"),
      repdb_start_end_only: countActive((e) => e.illustration.display_main === "start"),
      coory_to_import: countActive((e) => e.illustration.status === "awaiting_coory_upload"),
      coory_files_expected: illusRows.length,
    },
    active_missing: {
      instructions_fr: countActive((e) => !e.instructions_fr.length),
      primary_muscles: countActive((e) => !e.primary_muscles.length),
      difficulty: countActive((e) => !e.difficulty),
    },
    active_review: Object.fromEntries(Object.keys(REASONS).map((r) => [r, countActive((e) => e.review.reasons.includes(r))])),
  },
  output: {
    exercises: sorted.length,
    from_repdb: count((e) => e.sources[0].provider === "repdb"),
    from_kit: count((e) => e.sources[0].provider === "coory_kit"),
    kit_variants: count((e) => e.sources[0].provider === "coory_kit" && e.variant_of),
    duplicates_merged: duplicates.length,
    session_types: sessionTypes.length,
    session_types_by_kind: Object.fromEntries(Object.keys(kindLabels).map((k) => [k, sessionTypes.filter((s) => s.kind === k).length])),
  },
  by_discipline_any: Object.fromEntries(discOrder.map((d) => [d, count((e) => e.disciplines.includes(d))])),
  by_discipline_primary: Object.fromEntries(discOrder.map((d) => [d, count((e) => e.disciplines[0] === d)])),
  multi_discipline: count((e) => e.disciplines.length > 1),
  hyrox_stations: sorted.filter((e) => e.hyrox_station).sort((a, b) => a.hyrox_station - b.hyrox_station).map((e) => `${e.hyrox_station}. ${e.name_fr}`),
  by_difficulty: { ...Object.fromEntries(Object.keys(vocab.difficulty).map((d) => [d, count((e) => e.difficulty === d)])), missing: count((e) => !e.difficulty) },
  missing: {
    instructions_fr: count((e) => !e.instructions_fr.length),
    primary_muscles: count((e) => !e.primary_muscles.length),
    difficulty: count((e) => !e.difficulty),
    equipment_listed_as_bodyweight: count((e) => !e.equipment.length),
    illustrations_without_any_source: count((e) => e.illustration.source === "coory" && e.illustration.status === "missing"),
  },
  review: Object.fromEntries(Object.keys(REASONS).map((r) => [r, count((e) => e.review.reasons.includes(r))])),
  licensing: { attribution_required: count((e) => e.attribution_required), exportable: count((e) => e.exportable) },
  medical: { tags_removed: removedMedicalTags, goals_removed: removedMedicalGoals, instructions_neutralized: count((e) => e.review.reasons.includes("FORMULATION_MEDICALE_NEUTRALISEE")) },
};
await fs.writeFile(out("statistiques.json"), JSON.stringify(stats, null, 2) + "\n");
console.log(JSON.stringify(stats, null, 2));
