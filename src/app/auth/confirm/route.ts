import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import {
  isTokenHash,
  RECOVERY_COOKIE,
  RECOVERY_COOKIE_MAX_AGE,
  RECOVERY_COOKIE_PATH,
} from "@/features/auth/recovery";
import { createClient } from "@/lib/supabase/server";

// Retour d'un lien Supabase (réinitialisation de mot de passe, confirmation d'inscription, connexion
// Google / Facebook / Apple) : échange le code à usage unique contre une session, puis envoie vers
// l'étape suivante.
// Liste fermée de destinations : jamais de redirection vers une adresse fournie librement (open redirect).
const ALLOWED_NEXT = new Set(["/nouveau-mot-de-passe", "/bienvenue", "/espace"]);

// redirect() renvoie une adresse RELATIVE et joint les cookies de session posés par l'échange.
// Ne pas la reconstruire depuis request.url : en dev, elle porte l'adresse d'écoute du serveur
// (http://0.0.0.0:3000), injoignable depuis un téléphone.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "";
  const tokenHash = searchParams.get("token_hash");

  // Lien « Mot de passe oublié » du modèle Coory (incident du 20/11/2026) : le jeton est seulement
  // rangé, il sera vérifié à l'enregistrement du nouveau mot de passe (features/auth/recovery.ts).
  if (
    searchParams.get("type") === "recovery" &&
    next === "/nouveau-mot-de-passe" &&
    isTokenHash(tokenHash)
  ) {
    (await cookies()).set(RECOVERY_COOKIE, tokenHash, {
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      path: RECOVERY_COOKIE_PATH,
      maxAge: RECOVERY_COOKIE_MAX_AGE,
    });
    redirect("/nouveau-mot-de-passe");
  }

  if (code && ALLOWED_NEXT.has(next)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      redirect(next);
    }
  }

  // Lien expiré, déjà utilisé, ouvert dans un autre navigateur ou falsifié.
  redirect("/lien-invalide");
}
