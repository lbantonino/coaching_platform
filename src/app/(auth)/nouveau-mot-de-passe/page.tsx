import type { Metadata } from "next";
import { Suspense } from "react";

import { requireUser } from "@/features/auth/session";

import { NewPasswordForm } from "./new-password-form";

export const metadata: Metadata = {
  title: "Nouveau mot de passe",
  robots: { index: false },
};

export default function NewPasswordPage() {
  return (
    <div className="flex w-full flex-col gap-8">
      <h1 className="font-display text-h2 font-medium">Nouveau mot de passe</h1>
      <Suspense fallback={<p className="text-muted">Vérification du lien…</p>}>
        <RecoverySession />
      </Suspense>
    </div>
  );
}

// Accessible uniquement avec la session ouverte par le lien de réinitialisation (ou une session normale).
async function RecoverySession() {
  const user = await requireUser();
  return (
    <div className="flex flex-col gap-6">
      <p className="text-small text-muted">
        Compte : <span className="font-medium text-current">{user.email}</span>
      </p>
      <NewPasswordForm />
    </div>
  );
}
