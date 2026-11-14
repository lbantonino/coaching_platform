import "server-only";

import { createClient } from "@/lib/supabase/server";

// Le coach connecté utilise-t-il le compte de démonstration partagé (OPEN-24) ?
export async function isDemoAccount(): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("is_demo_account");
  return data === true;
}
