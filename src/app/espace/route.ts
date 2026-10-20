import { NextResponse, type NextRequest } from "next/server";

import { getHomePath } from "@/features/auth/guards";
import { getCurrentUser } from "@/features/auth/session";

// Aiguillage après connexion : envoie chaque utilisateur vers l'espace correspondant à ses rôles.
// Route Handler plutôt que page : une vraie redirection HTTP, sans rendu.
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  const path = user ? await getHomePath(user.id) : "/login";
  return NextResponse.redirect(new URL(path, request.url));
}
