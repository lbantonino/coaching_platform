// DÉVELOPPEMENT LOCAL UNIQUEMENT (demande d'Antonino, 24/10/2026) : `npm run db:reset` remet la base
// de démo à zéro, ce qui déconnectait Antonino et effaçait le profil qu'il a saisi pour le coach A
// (nom, entreprise, photo). Ce script garde les deux d'un reset à l'autre :
//   node scripts/dev-keep.mjs save     (avant le reset)
//   node scripts/dev-keep.mjs restore  (après le reset et seed-photos)
// Sessions (auth.sessions + auth.refresh_tokens) et profil du coach A seulement, copiés dans
// supabase/.temp (jamais commité). Refuse de tourner ailleurs qu'en local ; un échec n'empêche pas
// le reset (simple avertissement).
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";

const COACH_A = "a0000000-0000-4000-8000-00000000000a";
const CONTAINER = "supabase_db_coaching-platform";
const DIR = "supabase/.temp/dev-keep";
const mode = process.argv[2];

const psql = (sql) =>
  execFileSync(
    "docker",
    ["exec", "-i", CONTAINER, "psql", "-U", "postgres", "-At", "-v", "ON_ERROR_STOP=1"],
    {
      input: sql,
      encoding: "utf8",
    },
  ).trim();

function localApi() {
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
  return createClient(env.API_URL, env.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}

// Sessions actives depuis moins de 14 jours (connexion ou rafraîchissement) : celle d'Antonino en fait
// partie dès qu'il utilise l'app ; les sessions laissées par les tests s'éteignent d'elles-mêmes.
// (Toutes portent l'agent « node » : la connexion passe par le serveur, on ne peut pas les trier.)
const RECENT = `coalesce(t.refreshed_at, t.updated_at, t.created_at) > now() - interval '14 days'`;

async function save() {
  mkdirSync(DIR, { recursive: true });
  const kept = {
    sessions: JSON.parse(
      psql(
        `select coalesce(json_agg(t), '[]') from auth.sessions t where t.user_id = '${COACH_A}' and ${RECENT};`,
      ),
    ),
    refreshTokens: JSON.parse(
      psql(
        `select coalesce(json_agg(r), '[]') from auth.refresh_tokens r join auth.sessions t on t.id = r.session_id where t.user_id = '${COACH_A}' and ${RECENT};`,
      ),
    ),
    profile: JSON.parse(
      psql(
        `select coalesce(row_to_json(t), 'null') from public.coach_profiles t where t.user_id = '${COACH_A}';`,
      ),
    ),
  };
  // La photo saisie par Antonino (pas celle de démonstration) est copiée aussi.
  const photo = kept.profile?.photo_path;
  if (photo && !photo.includes("/demo-")) {
    const { data } = await localApi().storage.from("profile-photos").download(photo);
    if (data) writeFileSync(`${DIR}/photo.bin`, Buffer.from(await data.arrayBuffer()));
  }
  writeFileSync(`${DIR}/kept.json`, JSON.stringify(kept));
  console.log(`dev-keep : ${kept.sessions.length} session(s) et le profil du coach A gardés.`);
}

const literal = (value) => `$json$${JSON.stringify(value)}$json$`;

async function restore() {
  if (!existsSync(`${DIR}/kept.json`)) return console.log("dev-keep : rien à restaurer.");
  const kept = JSON.parse(readFileSync(`${DIR}/kept.json`, "utf8"));
  if (kept.sessions.length > 0) {
    psql(`
      insert into auth.sessions select * from json_populate_recordset(null::auth.sessions, ${literal(kept.sessions)})
        on conflict do nothing;
      insert into auth.refresh_tokens select * from json_populate_recordset(null::auth.refresh_tokens, ${literal(kept.refreshTokens)})
        on conflict do nothing;
      select setval(pg_get_serial_sequence('auth.refresh_tokens', 'id'), (select max(id) from auth.refresh_tokens));
    `);
  }
  const profile = kept.profile;
  if (profile) {
    const photo = profile.photo_path;
    if (photo && !photo.includes("/demo-") && existsSync(`${DIR}/photo.bin`)) {
      const type = photo.endsWith(".png")
        ? "image/png"
        : photo.endsWith(".webp")
          ? "image/webp"
          : "image/jpeg";
      await localApi()
        .storage.from("profile-photos")
        .upload(photo, readFileSync(`${DIR}/photo.bin`), { contentType: type, upsert: true });
    }
    psql(`
      update public.coach_profiles p set first_name = k.first_name, last_name = k.last_name,
        company_name = k.company_name, photo_path = k.photo_path
      from json_populate_record(null::public.coach_profiles, ${literal(profile)}) k
      where p.user_id = '${COACH_A}';
    `);
  }
  console.log(`dev-keep : ${kept.sessions.length} session(s) et le profil du coach A restaurés.`);
}

try {
  if (mode === "save") await save();
  else if (mode === "restore") await restore();
  else throw new Error("usage : node scripts/dev-keep.mjs save|restore");
} catch (error) {
  console.warn(`dev-keep : ignoré (${error.message.split("\n")[0]}).`);
}
