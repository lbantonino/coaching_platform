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
