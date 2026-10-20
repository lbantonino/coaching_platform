"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { loginSchema } from "./schemas";

export type LoginState = {
  error: string | null;
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
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide.", email: raw.email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Message volontairement générique : ne pas révéler si le compte existe.
    const message =
      error.status === 429
        ? "Trop de tentatives. Réessaie dans quelques minutes."
        : "E-mail ou mot de passe incorrect.";
    return { error: message, email: raw.email };
  }

  // Aiguillage selon les rôles réels (coach -> /coach, admin -> /admin).
  redirect("/espace");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
