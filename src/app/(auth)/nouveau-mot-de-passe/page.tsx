import type { Metadata } from "next";
import { Suspense } from "react";

import { requireUser } from "@/features/auth/session";

import { NewPasswordForm } from "./new-password-form";

export const metadata: Metadata = {
  title: "Nouveau mot de passe | Coaching Platform",
  robots: { index: false },
};

export default function NewPasswordPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Nouveau mot de passe</h1>
      <Suspense fallback={<p className="text-zinc-500">Vérification du lien…</p>}>
        <RecoverySession />
      </Suspense>
    </main>
  );
}

// Accessible uniquement avec la session ouverte par le lien de réinitialisation (ou une session normale).
async function RecoverySession() {
  const user = await requireUser();
  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Compte : <span className="font-medium text-current">{user.email}</span>
      </p>
      <NewPasswordForm />
    </div>
  );
}
