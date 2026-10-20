import "server-only";

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { publicEnv } from "@/lib/env";

import type { Database } from "./database.types";

// Client ADMINISTRATEUR (clé secrète) : il contourne la RLS. Usage strictement limité aux procédures
// de confiance listées ici, jamais pour lire ou écrire des données métier :
//   - créer le compte d'un sportif qui accepte une invitation valide (inscription libre fermée).
// `server-only` fait échouer le build si ce fichier est importé côté navigateur.
export function createAdminClient() {
  const secretKey = z.string().min(1).safeParse(process.env.SUPABASE_SECRET_KEY);
  if (!secretKey.success) {
    throw new Error("SUPABASE_SECRET_KEY manquante : voir .env.example.");
  }

  return createClient<Database>(publicEnv.supabaseUrl, secretKey.data, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
