import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getHomePath } from "@/features/auth/guards";
import { requireUser } from "@/features/auth/session";
import { TERMS_VERSION } from "@/features/auth/signup-schemas";
import { createClient } from "@/lib/supabase/server";

import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = {
  title: "Bienvenue",
};

// Dernière étape d'une inscription (D-30), après confirmation de l'e-mail ou après Google /
// Facebook / Apple : le compte existe, il reste à choisir coach ou sportif et à accepter les conditions.
export default function WelcomePage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-start gap-8 px-5 pt-6 pb-16 sm:py-12">
      <Suspense fallback={<p className="text-muted">Chargement…</p>}>
        <Welcome />
      </Suspense>
    </main>
  );
}

const text = (value: unknown) => (typeof value === "string" ? value : "");

async function Welcome() {
  const user = await requireUser();
  // Compte déjà finalisé (ou rôle déjà attribué) : direction son espace.
  const home = await getHomePath(user.id);
  if (home !== "/bienvenue") redirect(home);

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const meta = data.user?.user_metadata ?? {};
  // Inscription par e-mail : nos champs ; Google / Facebook / Apple : given_name, family_name, name.
  const fullName = text(meta.full_name || meta.name).split(" ");
  const initial = {
    kind: text(meta.kind) || "coach",
    firstName: text(meta.first_name) || text(meta.given_name) || fullName[0] || "",
    lastName: text(meta.last_name) || text(meta.family_name) || fullName.slice(1).join(" "),
    email: user.email ?? "",
    phone: text(meta.phone),
    organizationName: text(meta.organization_name),
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-h2 font-medium">Bienvenue sur Coory</h1>
        <p className="text-small text-muted">
          Ton adresse {user.email} est confirmée. Dernière étape : vérifie ces informations.
        </p>
      </div>
      <OnboardingForm
        initial={initial}
        termsAlreadyAccepted={text(meta.terms_version) === TERMS_VERSION}
      />
    </>
  );
}
