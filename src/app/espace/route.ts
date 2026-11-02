import { redirect } from "next/navigation";

import { getHomePath } from "@/features/auth/guards";
import { getCurrentUser } from "@/features/auth/session";

// Aiguillage après connexion : envoie chaque utilisateur vers l'espace correspondant à ses rôles.
// Route Handler plutôt que page : une vraie redirection HTTP, sans rendu.
// redirect() renvoie une adresse RELATIVE. Ne pas la reconstruire depuis request.url : en dev, elle
// porte l'adresse d'écoute du serveur (http://0.0.0.0:3000), injoignable depuis un téléphone.
export async function GET() {
  const user = await getCurrentUser();
  redirect(user ? await getHomePath(user.id) : "/login");
}
