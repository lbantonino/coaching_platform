"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { getHomePath } from "./guards";
import { newPasswordSchema, passwordResetRequestSchema } from "./schemas";
import { requireUser } from "./session";

export type ResetRequestState = {
  status: "idle" | "sent" | "error";
  message: string | null;
  email: string;
};

// Message identique que le compte existe ou non : ne jamais révéler quels e-mails sont inscrits.
const RESET_SENT_MESSAGE =
  "Si un compte correspond à cette adresse, un e-mail de réinitialisation vient d'être envoyé. " +
  "Le lien est valable une heure.";

export async function requestPasswordReset(
  _previous: ResetRequestState,
  formData: FormData,
): Promise<ResetRequestState> {
  const email = String(formData.get("email") ?? "").trim();
  const parsed = passwordResetRequestSchema.safeParse({ email });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? null, email };
  }

  // L'origine sert à construire le lien de retour ; Supabase n'accepte que les adresses
  // déclarées dans additional_redirect_urls, ce qui empêche un détournement du lien.
  const origin = (await headers()).get("origin");
  if (!origin) {
    return { status: "error", message: "Requête invalide. Recharge la page.", email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/confirm?next=/nouveau-mot-de-passe`,
  });

  if (error?.status === 429) {
    return {
      status: "error",
      message: "Trop de demandes. Réessaie dans quelques minutes.",
      email,
    };
  }
  // Toute autre erreur (compte inconnu, etc.) reçoit volontairement la même réponse qu'un succès.
  return { status: "sent", message: RESET_SENT_MESSAGE, email };
}

export type NewPasswordState = { error: string | null };

export async function updatePassword(
  _previous: NewPasswordState,
  formData: FormData,
): Promise<NewPasswordState> {
  // La session de récupération ouverte par le lien e-mail est obligatoire.
  const user = await requireUser();

  const parsed = newPasswordSchema.safeParse({
    password: String(formData.get("password") ?? ""),
    confirmation: String(formData.get("confirmation") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    const message =
      error.code === "same_password"
        ? "Le nouveau mot de passe doit être différent de l'ancien."
        : error.code === "weak_password"
          ? "Ce mot de passe est trop faible. Choisis-en un plus long ou plus varié."
          : "Le mot de passe n'a pas pu être modifié. Redemande un lien de réinitialisation.";
    return { error: message };
  }

  redirect(await getHomePath(user.id, supabase));
}
