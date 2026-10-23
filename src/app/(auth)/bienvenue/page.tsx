import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { EntryTitle } from "@/components/layout/entry-ui";
import { SkeletonBar } from "@/components/ui/skeleton";
import { getHomePath } from "@/features/auth/guards";
import { requireUser } from "@/features/auth/session";
import { TERMS_VERSION } from "@/features/auth/signup-schemas";
import { createClient } from "@/lib/supabase/server";

import { OnboardingForm } from "./onboarding-form";
import { WelcomeReady } from "./welcome-ready";

export const metadata: Metadata = {
  title: "Bienvenue",
};

// Dernière étape d'une inscription (D-30), après confirmation de l'e-mail ou après Google /
// Facebook / Apple. Inscription par e-mail : tout est déjà connu, la page souhaite la bienvenue
// (prompt Claude Design §7.1) et un clic ouvre l'espace. Sinon : formulaire pré-rempli.
export default function WelcomePage() {
  return (
    <div className="flex flex-col gap-[22px]">
      <Suspense fallback={<WelcomeLoading />}>
        <Welcome />
      </Suspense>
    </div>
  );
}

function WelcomeLoading() {
  return (
    <div role="status" className="flex flex-col gap-4">
      <SkeletonBar className="size-14 rounded-[7px]" />
      <SkeletonBar className="h-7 w-[70%] rounded-[7px]" />
      <SkeletonBar className="h-3.5 w-[90%] rounded-[7px]" />
      <SkeletonBar className="h-3.5 w-[60%] rounded-[7px]" />
      <span className="text-[14px] text-muted">Création de ton espace…</span>
    </div>
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
  const termsAccepted = text(meta.terms_version) === TERMS_VERSION;
  // Tout vient de l'inscription par e-mail (type, nom, conditions acceptées) : écran de bienvenue.
  const ready =
    (text(meta.kind) === "coach" || text(meta.kind) === "athlete") &&
    initial.firstName !== "" &&
    initial.lastName !== "" &&
    termsAccepted;

  if (ready) return <WelcomeReady values={initial} />;

  return (
    <>
      <EntryTitle
        sub={`Ton adresse ${user.email} est confirmée. Dernière étape : vérifie ces informations.`}
      >
        Bienvenue sur Coory
      </EntryTitle>
      <OnboardingForm initial={initial} termsAlreadyAccepted={termsAccepted} />
    </>
  );
}
