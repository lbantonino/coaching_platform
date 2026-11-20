import "server-only";

import type { SupabaseServerClient } from "@/features/auth/session";
import { createClient } from "@/lib/supabase/server";

// Le coach connecté utilise-t-il le compte de démonstration partagé (OPEN-24) ?
// `client` : une session tout juste ouverte dans la même requête (lien de réinitialisation vérifié).
export async function isDemoAccount(client?: SupabaseServerClient): Promise<boolean> {
  const supabase = client ?? (await createClient());
  const { data } = await supabase.rpc("is_demo_account");
  return data === true;
}
