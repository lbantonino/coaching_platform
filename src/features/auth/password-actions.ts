"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { isDemoAccount } from "@/features/demo/queries";
import { DEMO_DISABLED } from "@/features/demo/rules";
import { createClient } from "@/lib/supabase/server";

import { fieldErrors } from "./field-errors";
import { getHomePath } from "./guards";
import { newPasswordSchema, passwordResetRequestSchema } from "./schemas";
import { getRecoveryUser } from "./session";

export type ResetRequestState = {
  status: "idle" | "sent" | "error";
  // Erreur générale (bandeau) ; l'erreur de saisie de l'adresse va dans `fields.email`.
  message: string | null;
  fields: Record<string, string>;
  email: string;
};

export async function requestPasswordReset(
  _previous: ResetRequestState,
  formData: FormData,
): Promise<ResetRequestState> {
  const email = String(formData.get("email") ?? "").trim();
  const parsed = passwordResetRequestSchema.safeParse({ email });
  if (!parsed.success) {
    return { status: "error", message: null, fields: fieldErrors(parsed.error), email };
  }

  // L'origine sert à construire le lien de retour ; Supabase n'accepte que les adresses
  // déclarées dans additional_redirect_urls, ce qui empêche un détournement du lien.
  const origin = (await headers()).get("origin");
  if (!origin) {
    return { status: "error", message: "Requête invalide. Recharge la page.", fields: {}, email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/confirm?next=/nouveau-mot-de-passe`,
  });

  if (error?.status === 429) {
    return {
      status: "error",
      message: "Trop de demandes. Réessaie dans quelques minutes.",
      fields: {},
      email,
    };
  }
  // Toute autre erreur (compte inconnu, etc.) reçoit volontairement la même réponse qu'un succès :
  // la page affiche « Si un compte existe pour … » sans jamais révéler qui est inscrit.
  return { status: "sent", message: null, fields: {}, email };
}

export type NewPasswordState = {
  // Erreur générale (bandeau) ; erreurs de saisie sous les champs (password, confirmation).
  error: string | null;
  fields: Record<string, string>;
};

export async function updatePassword(
  _previous: NewPasswordState,
  formData: FormData,
): Promise<NewPasswordState> {
  // La session de récupération ouverte par le lien e-mail est obligatoire (pas une session ordinaire).
  const user = await getRecoveryUser();
  if (!user) {
    return {
      error: "Ce lien de réinitialisation n'est plus valable. Redemande un lien.",
      fields: {},
    };
  }

  const parsed = newPasswordSchema.safeParse({
    password: String(formData.get("password") ?? ""),
    confirmation: String(formData.get("confirmation") ?? ""),
  });
  if (!parsed.success) {
    return { error: null, fields: fieldErrors(parsed.error) };
  }
  if (await isDemoAccount()) return { error: DEMO_DISABLED, fields: {} };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    const message =
      error.code === "same_password"
        ? "Le nouveau mot de passe doit être différent de l'ancien."
        : error.code === "weak_password"
          ? "Ce mot de passe est trop faible. Choisis-en un plus long ou plus varié."
          : "Le mot de passe n'a pas pu être modifié. Redemande un lien de réinitialisation.";
    return { error: message, fields: {} };
  }

  redirect(await getHomePath(user.id, supabase));
}
