import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

// Retour d'un lien Supabase (réinitialisation de mot de passe, confirmation d'inscription, connexion
// Google / Facebook / Apple) : échange le code à usage unique contre une session, puis envoie vers
// l'étape suivante.
// Liste fermée de destinations : jamais de redirection vers une adresse fournie librement (open redirect).
const ALLOWED_NEXT = new Set(["/nouveau-mot-de-passe", "/bienvenue", "/espace"]);

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "";

  if (code && ALLOWED_NEXT.has(next)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // Lien expiré, déjà utilisé, ouvert dans un autre navigateur ou falsifié.
  return NextResponse.redirect(new URL("/lien-invalide", request.url));
}
