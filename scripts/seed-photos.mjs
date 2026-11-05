// Photos de démonstration (D-28) : chargées dans le stockage LOCAL après `supabase db reset`
// (un seed SQL ne peut pas déposer de fichiers). Refuse de tourner ailleurs qu'en local.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";

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
  throw new Error("seed-photos : réservé à la base locale.");
}
// Clé de service locale : contourne la RLS, uniquement pour préparer la démonstration.
const supabase = createClient(env.API_URL, env.SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const ORG_A = "0a000000-0000-4000-8000-0000000000a1";
const ORG_B = "0b000000-0000-4000-8000-0000000000b1";
const athletes = [
  ["sophie", ORG_A, "da000000-0000-4000-8000-000000000001"],
  ["thomas", ORG_A, "da000000-0000-4000-8000-000000000002"],
  ["ines", ORG_A, "da000000-0000-4000-8000-000000000003"],
  ["lucas", ORG_A, "da000000-0000-4000-8000-000000000004"],
  ["nadia", ORG_A, "da000000-0000-4000-8000-000000000005"],
  ["julien", ORG_A, "da000000-0000-4000-8000-000000000006"],
  ["manon", ORG_A, "da000000-0000-4000-8000-000000000007"],
  ["kevin", ORG_A, "da000000-0000-4000-8000-000000000008"],
  ["sarah", ORG_B, "db000000-0000-4000-8000-000000000001"],
  ["hugo", ORG_B, "db000000-0000-4000-8000-000000000002"],
];
const coaches = [
  ["coach-a", "a0000000-0000-4000-8000-00000000000a"],
  ["coach-b", "b0000000-0000-4000-8000-00000000000b"],
];

async function put(file, path) {
  const bytes = readFileSync(new URL(`../supabase/seed-photos/${file}.jpg`, import.meta.url));
  const { error } = await supabase.storage
    .from("profile-photos")
    .upload(path, bytes, { contentType: "image/jpeg", upsert: true });
  if (error) throw new Error(`${file} : ${error.message}`);
}

for (const [file, org, id] of athletes) {
  const path = `org/${org}/athlete/${id}/demo-${file}.jpg`;
  await put(file, path);
  const { error } = await supabase
    .from("athlete_profiles")
    .update({ photo_path: path })
    .eq("id", id);
  if (error) throw new Error(`${file} : ${error.message}`);
}
for (const [file, userId] of coaches) {
  const path = `user/${userId}/demo-${file}.jpg`;
  await put(file, path);
  const { error } = await supabase
    .from("coach_profiles")
    .update({ photo_path: path })
    .eq("user_id", userId);
  if (error) throw new Error(`${file} : ${error.message}`);
}
console.log(`Photos de démonstration : ${athletes.length + coaches.length} chargées.`);

// Documents de démonstration (D-60) : de petits PDF fabriqués ici, au contenu inventé, pour que la page
// Documents ne soit pas vide en développement. Jamais de vrai document.
function demoPdf(title) {
  const esc = (text) => text.replace(/[\\()]/g, (char) => `\\${char}`);
  const content = [
    "BT /F1 20 Tf 72 760 Td",
    `(${esc(title)}) Tj`,
    "0 -32 Td /F1 12 Tf",
    "(Document de démonstration Coory : données inventées.) Tj",
    "0 -18 Td (Aucune information réelle.) Tj ET",
  ].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, "latin1");
}

const COACH_A = "a0000000-0000-4000-8000-00000000000a";
const COACH_B = "b0000000-0000-4000-8000-00000000000b";
const documents = [
  [
    "d0c00000-0000-4000-8000-0000000000a1",
    ORG_A,
    "Contrat de coaching 2026",
    "contrat",
    "da000000-0000-4000-8000-000000000001",
    COACH_A,
  ],
  [
    "d0c00000-0000-4000-8000-0000000000a2",
    ORG_A,
    "Bilan de rentrée",
    "bilan",
    "da000000-0000-4000-8000-000000000002",
    COACH_A,
  ],
  [
    "d0c00000-0000-4000-8000-0000000000a3",
    ORG_A,
    "Programme Hyrox, bloc 1",
    "programme",
    "da000000-0000-4000-8000-000000000003",
    COACH_A,
  ],
  [
    "d0c00000-0000-4000-8000-0000000000a4",
    ORG_A,
    "Facture FAC-2026-014",
    "facture",
    "da000000-0000-4000-8000-000000000004",
    COACH_A,
  ],
  // Six de plus (demande d'Antonino du 05/11, tâche 5) : au-delà de 7 lignes, la page Documents
  // montre « Voir plus » (kit « Coory Pages » 05). Datés des semaines passées (dernier nombre, en
  // jours) : le tri par date a du sens et les documents des tests (plus récents) restent en tête.
  [
    "d0c00000-0000-4000-8000-0000000000a5",
    ORG_A,
    "Questionnaire de santé",
    "bilan",
    "da000000-0000-4000-8000-000000000003",
    COACH_A,
    12,
  ],
  [
    "d0c00000-0000-4000-8000-0000000000a6",
    ORG_A,
    "Plan nutrition, semaine type",
    "programme",
    "da000000-0000-4000-8000-000000000004",
    COACH_A,
    18,
  ],
  [
    "d0c00000-0000-4000-8000-0000000000a7",
    ORG_A,
    "Contrat small group Hyrox",
    "contrat",
    "da000000-0000-4000-8000-000000000005",
    COACH_A,
    25,
  ],
  [
    "d0c00000-0000-4000-8000-0000000000a8",
    ORG_A,
    "Bilan VMA de septembre",
    "bilan",
    "da000000-0000-4000-8000-000000000002",
    COACH_A,
    33,
  ],
  [
    "d0c00000-0000-4000-8000-0000000000a9",
    ORG_A,
    "Facture FAC-2026-009",
    "facture",
    "da000000-0000-4000-8000-000000000006",
    COACH_A,
    41,
  ],
  [
    "d0c00000-0000-4000-8000-0000000000aa",
    ORG_A,
    "Fiche d'inscription au club",
    "autre",
    "da000000-0000-4000-8000-000000000011",
    COACH_A,
    52,
  ],
  // Organisation B : invisible pour le coach A (isolation).
  ["d0c00000-0000-4000-8000-0000000000b1", ORG_B, "Règlement de la salle", "autre", null, COACH_B],
];
// Catégories (D-67) : celles de départ, créées par la base pour chaque organisation.
const labels = {
  programme: "Programme",
  facture: "Facture",
  contrat: "Contrat",
  bilan: "Bilan",
  autre: "Autre",
};
const { data: categories, error: categoriesError } = await supabase
  .from("document_categories")
  .select("id, organization_id, name");
if (categoriesError) throw new Error(`Catégories : ${categoriesError.message}`);
for (const [id, org, name, category, athleteId, createdBy, daysAgo] of documents) {
  const categoryId =
    categories.find((item) => item.organization_id === org && item.name === labels[category])?.id ??
    null;
  const bytes = demoPdf(name);
  const path = `org/${org}/${id}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from("coach-documents")
    .upload(path, bytes, { contentType: "application/pdf", upsert: true });
  if (uploadError) throw new Error(`${name} : ${uploadError.message}`);
  const { error } = await supabase.from("coach_documents").upsert({
    id,
    organization_id: org,
    athlete_id: athleteId,
    name,
    category_id: categoryId,
    storage_path: path,
    mime_type: "application/pdf",
    size_bytes: bytes.length,
    created_by: createdBy,
    ...(daysAgo ? { created_at: new Date(Date.now() - daysAgo * 86_400_000).toISOString() } : {}),
  });
  if (error) throw new Error(`${name} : ${error.message}`);
}
console.log(`Documents de démonstration : ${documents.length} chargés.`);
