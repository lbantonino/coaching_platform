"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { getHomePath } from "./guards";
import { enabledProviders, type OAuthProvider } from "./providers";
import { requireUser } from "./session";
import { onboardingSchema, signupSchema, TERMS_VERSION } from "./signup-schemas";

// Saisie renvoyée après une erreur (jamais les mots de passe) : React 19 vide le formulaire.
export type SignupValues = {
  kind: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  organizationName: string;
};

export type SignupState = {
  status: "idle" | "sent" | "error";
  message: string | null;
  attempt: number;
  values: SignupValues | null;
};

// Même message que l'adresse soit nouvelle ou déjà inscrite : ne jamais révéler qui a un compte.
const SENT_MESSAGE =
  "Un e-mail de confirmation vient d'être envoyé. Ouvre le lien qu'il contient pour activer ton compte (valable une heure).";

export async function signUp(previous: SignupState, formData: FormData): Promise<SignupState> {
  const field = (name: string) => String(formData.get(name) ?? "");
  const values: SignupValues = {
    kind: field("kind"),
    firstName: field("firstName"),
    lastName: field("lastName"),
    email: field("email").trim(),
    phone: field("phone"),
    organizationName: field("organizationName"),
  };
  const fail = (message: string): SignupState => ({
    status: "error",
    message,
    attempt: previous.attempt + 1,
    values,
  });

  const parsed = signupSchema.safeParse({
    ...values,
    password: field("password"),
    confirmation: field("confirmation"),
    terms: formData.get("terms") ?? undefined,
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Formulaire invalide.");

  // Lien de retour construit sur l'origine de la requête ; Supabase n'accepte que les adresses
  // déclarées (additional_redirect_urls), ce qui empêche de détourner le lien.
  const origin = (await headers()).get("origin");
  if (!origin) return fail("Requête invalide. Recharge la page.");

  const data = parsed.data;
  const supabase = await createClient();
  const { data: result, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm?next=/bienvenue`,
      // Repris par la page « Bienvenue » pour pré-remplir la dernière étape.
      data: {
        kind: data.kind,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        organization_name: data.organizationName,
        terms_version: TERMS_VERSION,
      },
    },
  });

  if (error?.status === 429) return fail("Trop de demandes. Réessaie dans quelques minutes.");
  if (error?.code === "weak_password")
    return fail("Mot de passe trop faible : choisis-en un plus long.");
  if (error && error.code !== "user_already_exists") {
    return fail("L'inscription n'a pas pu aboutir. Réessaie.");
  }
  // Confirmation désactivée (jamais en production) : session ouverte tout de suite.
  if (result?.session) redirect("/bienvenue");

  return { status: "sent", message: SENT_MESSAGE, attempt: previous.attempt + 1, values };
}

// Connexion ou inscription par un fournisseur (Google, Facebook, Apple), s'il est configuré.
export async function signInWithProvider(provider: OAuthProvider) {
  if (!enabledProviders().includes(provider)) redirect("/login");
  const origin = (await headers()).get("origin");
  if (!origin) redirect("/login");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${origin}/auth/confirm?next=/espace` },
  });
  if (error || !data.url) redirect("/lien-invalide");
  redirect(data.url);
}

export type OnboardingState = {
  error: string | null;
  attempt: number;
  values: SignupValues | null;
};

const onboardingErrors: Record<string, string> = {
  email_non_confirme: "Confirme d'abord ton adresse e-mail avec le lien reçu.",
  deja_inscrit: "Ton compte est déjà prêt.",
  conditions_non_acceptees:
    "Accepte les conditions d'utilisation et la politique de confidentialité.",
};

// Dernière étape : crée l'espace du coach (son organisation) ou finalise le compte sportif.
export async function completeSignup(
  previous: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const user = await requireUser();
  const field = (name: string) => String(formData.get(name) ?? "");
  const values: SignupValues = {
    kind: field("kind"),
    firstName: field("firstName"),
    lastName: field("lastName"),
    email: user.email ?? "",
    phone: field("phone"),
    organizationName: field("organizationName"),
  };
  const fail = (error: string) => ({ error, attempt: previous.attempt + 1, values });

  const parsed = onboardingSchema.safeParse({
    ...values,
    terms: formData.get("terms") ?? undefined,
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Formulaire invalide.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_signup", {
    p_kind: parsed.data.kind,
    p_first_name: parsed.data.firstName,
    p_last_name: parsed.data.lastName,
    p_phone: parsed.data.phone ?? "",
    p_organization_name: parsed.data.organizationName ?? "",
    p_terms_version: TERMS_VERSION,
  });
  if (error && error.message !== "deja_inscrit") {
    return fail(onboardingErrors[error.message] ?? "Ton espace n'a pas pu être créé. Réessaie.");
  }
  redirect(await getHomePath(user.id));
}
