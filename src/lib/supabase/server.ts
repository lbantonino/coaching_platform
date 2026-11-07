import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";

import { publicEnv } from "@/lib/env";

import type { Database } from "./database.types";
import { REMEMBER_COOKIE, remembers, sessionCookieOptions } from "./session-cookies";

// Client Supabase pour Server Components, Server Actions et Route Handlers.
// Un nouveau client par requête : ne jamais le partager entre utilisateurs.
// `remember` : choix « Se souvenir de moi » de la connexion en cours ; sinon, celui mémorisé dans
// le cookie (voir session-cookies.ts).
export async function createClient(options: { remember?: boolean } = {}) {
  // Données personnelles : toujours calculées à la requête, jamais prérendues ni mises en cache.
  // (Le client Supabase compare l'expiration du jeton à Date.now(), interdit pendant un prérendu.)
  await connection();
  const cookieStore = await cookies();
  const remember = options.remember ?? remembers(cookieStore.get(REMEMBER_COOKIE)?.value);

  return createServerClient<Database>(publicEnv.supabaseUrl, publicEnv.supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, sessionCookieOptions(options, remember)),
          );
        } catch {
          // Appelé depuis un Server Component : les cookies ne peuvent pas y être écrits.
          // Sans conséquence, le proxy rafraîchit déjà la session à chaque requête.
        }
      },
    },
  });
}
