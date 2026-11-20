import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { EntryTitle } from "@/components/layout/entry-ui";
import { SkeletonLines } from "@/components/ui/skeleton";
import { isTokenHash, RECOVERY_COOKIE } from "@/features/auth/recovery";
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

// Accessible uniquement avec le lien de réinitialisation : soit sa session (moins d'une heure), soit
// son jeton, rangé par /auth/confirm et vérifié à l'enregistrement (incident du 20/11/2026 : le lien
// marche alors depuis n'importe quel appareil). Une session ordinaire change son mot de passe dans les
// Paramètres, avec l'ancien.
async function RecoverySession() {
  const user = await getRecoveryUser();
  if (user) {
    return (
      <>
        <EntryTitle sub={`Compte : ${user.email}`}>Nouveau mot de passe</EntryTitle>
        <NewPasswordForm />
      </>
    );
  }
  if (!isTokenHash((await cookies()).get(RECOVERY_COOKIE)?.value)) redirect("/lien-invalide");
  return (
    <>
      <EntryTitle sub="Choisis le nouveau mot de passe de ton compte Coory.">
        Nouveau mot de passe
      </EntryTitle>
      <NewPasswordForm />
    </>
  );
}
