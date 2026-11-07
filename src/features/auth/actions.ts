"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { REMEMBER_COOKIE } from "@/lib/supabase/session-cookies";

import { fieldErrors } from "./field-errors";
import { getHomePath } from "./guards";
import { loginSchema } from "./schemas";

export type LoginState = {
  // Erreur générale (identifiants refusés, trop de tentatives), affichée en bandeau.
  error: string | null;
  // Erreurs de saisie, affichées sous chaque champ (email, password).
  fields: Record<string, string>;
  email: string;
};

// Server Action : appelable directement par n'importe qui, donc tout est revalidé ici.
export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const raw = {
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: null, fields: fieldErrors(parsed.error), email: raw.email };
  }

  // « Se souvenir de moi » (D-139) : case décochée, la session sera effacée à la fermeture du
  // navigateur. Le choix est retenu dans un cookie de navigateur, relu par le proxy à chaque visite.
  const remember = formData.get("remember") === "on";
  const cookieStore = await cookies();
  if (remember) {
    cookieStore.delete(REMEMBER_COOKIE);
  } else {
    cookieStore.set(REMEMBER_COOKIE, "0", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }

  const supabase = await createClient({ remember });
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user) {
    // Message volontairement générique : ne pas révéler si le compte existe.
    const message =
      error?.status === 429
        ? "Trop de tentatives. Réessaie dans quelques minutes."
        : "Adresse e-mail ou mot de passe incorrect. Vérifie tes informations ou réinitialise ton mot de passe.";
    return { error: message, fields: {}, email: raw.email };
  }

  // Redirection directe vers l'espace correspondant aux rôles réels (coach -> /coach,
  // admin -> /admin), avec la session qui vient d'être ouverte. Pas de saut intermédiaire :
  // le routeur client ne mettrait pas l'adresse à jour après une double redirection.
  redirect(await getHomePath(data.user.id, supabase));
}

// Déconnexion de CET appareil seulement (scope « local ») : les autres appareils du compte restent
// connectés, comme partout ailleurs. Une « déconnexion de tous les appareils » sera un choix à part.
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login");
}
