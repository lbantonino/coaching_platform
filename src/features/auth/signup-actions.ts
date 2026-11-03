"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { fieldErrors } from "./field-errors";
import { getHomePath } from "./guards";
import { enabledProviders, type OAuthProvider } from "./providers";
import { requireUser } from "./session";
import { readSignupEmail, rememberSignupEmail } from "./signup-cookie";
import {
  onboardingSchema,
  parseBillingSetup,
  signupSchema,
  TERMS_VERSION,
  type BillingSetupInput,
} from "./signup-schemas";

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
  status: "idle" | "error";
  // Erreur générale, affichée en bandeau au-dessus du formulaire.
  message: string | null;
  // Erreurs de saisie, une par champ, affichées sous chaque champ.
  fields: Record<string, string>;
  attempt: number;
  values: SignupValues | null;
};

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
  const fail = (message: string | null, fields: Record<string, string> = {}): SignupState => ({
    status: "error",
    message,
    fields,
    attempt: previous.attempt + 1,
    values,
  });

  const parsed = signupSchema.safeParse({
    ...values,
    password: field("password"),
    confirmation: field("confirmation"),
    terms: formData.get("terms") ?? undefined,
  });
  if (!parsed.success) {
    return fail("Corrige les champs signalés pour continuer.", fieldErrors(parsed.error));
  }

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
    return fail(null, { password: "Mot de passe trop faible : choisis-en un plus long." });
  if (error && error.code !== "user_already_exists") {
    return fail("L'inscription n'a pas pu aboutir. Réessaie.");
  }
  // Confirmation désactivée (jamais en production) : session ouverte tout de suite.
  if (result?.session) redirect("/bienvenue");

  // Même suite que l'adresse soit nouvelle ou déjà inscrite : ne jamais révéler qui a un compte.
  await rememberSignupEmail(data.email);
  redirect("/verifier-email");
}

export type ResendState = { status: "idle" | "sent" | "error"; message: string | null };

// « Renvoyer l'e-mail » de la page « Vérifie ta boîte mail ». Réponse identique que l'adresse
// existe, soit déjà confirmée ou non ; seule la limite de fréquence de Supabase est signalée.
export async function resendConfirmation(previous: ResendState): Promise<ResendState> {
  // Un seul renvoi par visite de la page (le bouton passe à « E-mail renvoyé ✓ »).
  if (previous.status === "sent") return previous;
  const email = await readSignupEmail();
  const origin = (await headers()).get("origin");
  if (!email || !origin) {
    return {
      status: "error",
      message: "Recommence ton inscription pour recevoir un nouvel e-mail.",
    };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${origin}/auth/confirm?next=/bienvenue` },
  });
  if (error?.status === 429) {
    return { status: "error", message: "Trop de demandes. Réessaie dans quelques minutes." };
  }
  return { status: "sent", message: null };
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
  // Étape « Pays, devise et TVA » du coach (D-69, D-90), renvoyée après une erreur.
  billing?: BillingSetupInput | null;
};

const onboardingErrors: Record<string, string> = {
  email_non_confirme: "Confirme d'abord ton adresse e-mail avec le lien reçu.",
  deja_inscrit: "Ton compte est déjà prêt.",
  conditions_non_acceptees: "Tu dois accepter les conditions pour continuer.",
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
  const billingInput: BillingSetupInput = {
    country: field("country"),
    currency: field("currency"),
    vatChoice: field("vatChoice"),
    vatRate: field("vatRate"),
  };
  const fail = (error: string) => ({
    error,
    attempt: previous.attempt + 1,
    values,
    billing: billingInput,
  });

  const parsed = onboardingSchema.safeParse({
    ...values,
    terms: formData.get("terms") ?? undefined,
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Formulaire invalide.");
  // Coach : pays, devise et TVA (facultative). Sportif : rien à demander.
  const billing = parsed.data.kind === "coach" ? parseBillingSetup(billingInput) : null;
  if (billing && !billing.ok) return fail(billing.error);
  const setup = billing?.ok ? billing.setup : null;

  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_signup", {
    p_kind: parsed.data.kind,
    p_first_name: parsed.data.firstName,
    p_last_name: parsed.data.lastName,
    p_phone: parsed.data.phone ?? "",
    p_organization_name: parsed.data.organizationName ?? "",
    p_terms_version: TERMS_VERSION,
    ...(setup
      ? {
          p_country: setup.country,
          p_currency: setup.currency,
          p_vat_rate: setup.vatRate,
        }
      : {}),
  });
  if (error && error.message !== "deja_inscrit") {
    return fail(onboardingErrors[error.message] ?? "Ton espace n'a pas pu être créé. Réessaie.");
  }
  redirect(await getHomePath(user.id));
}
