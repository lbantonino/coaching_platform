import "server-only";

import { cookies } from "next/headers";

// Adresse de l'inscription en cours, pour la page « Vérifie ta boîte mail » et le renvoi de l'e-mail.
// Cookie httpOnly d'une heure (durée du lien) : l'adresse n'apparaît jamais dans l'URL.
// Module serveur ordinaire (pas une Server Action) : la lecture n'est pas appelable depuis le navigateur.
const SIGNUP_EMAIL_COOKIE = "coory-inscription";

export async function rememberSignupEmail(email: string) {
  (await cookies()).set(SIGNUP_EMAIL_COOKIE, email, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60,
  });
}

export async function readSignupEmail(): Promise<string | null> {
  return (await cookies()).get(SIGNUP_EMAIL_COOKIE)?.value ?? null;
}
