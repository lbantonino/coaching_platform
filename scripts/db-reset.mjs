// `npm run db:reset` (développement local) : garde la session et le profil d'Antonino (dev-keep), remet
// la base à zéro, recharge les photos de démonstration, puis restaure. La restauration a lieu MÊME si
// le reset échoue, pour ne jamais laisser la base sans la session ni le profil.
import { spawnSync } from "node:child_process";

const run = (command, args) =>
  spawnSync(command, args, { stdio: ["ignore", "inherit", "inherit"] }).status ?? 1;

run("node", ["scripts/dev-keep.mjs", "save"]);
const reset = run("npx", ["supabase", "db", "reset"]);
if (reset === 0) run("node", ["scripts/seed-photos.mjs"]);
run("node", ["scripts/dev-keep.mjs", "restore"]);
process.exit(reset);
