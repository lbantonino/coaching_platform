import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { EntryTitle } from "@/components/layout/entry-ui";
import { SkeletonLines } from "@/components/ui/skeleton";
import { getRecoveryUser } from "@/features/auth/session";

import { NewPasswordForm } from "./new-password-form";

export const metadata: Metadata = {
  title: "Nouveau mot de passe",
  robots: { index: false },
};

// Nouveau mot de passe (prompt Claude Design §7.1), ouvert par le lien de réinitialisation.
export default function NewPasswordPage() {
  return (
    <div className="flex flex-col gap-[22px]">
      <Suspense fallback={<SkeletonLines label="Vérification du lien…" />}>
        <RecoverySession />
      </Suspense>
    </div>
  );
}

// Accessible uniquement avec la session ouverte par le lien de réinitialisation (moins d'une heure) :
// une session ordinaire change son mot de passe dans les Paramètres, avec l'ancien.
async function RecoverySession() {
  const user = await getRecoveryUser();
  if (!user) redirect("/lien-invalide");
  return (
    <>
      <EntryTitle sub={`Compte : ${user.email}`}>Nouveau mot de passe</EntryTitle>
      <NewPasswordForm />
    </>
  );
}
