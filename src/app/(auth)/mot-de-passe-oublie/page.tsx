import type { Metadata } from "next";
import Link from "next/link";

import { ResetRequestForm } from "./reset-request-form";

export const metadata: Metadata = {
  title: "Mot de passe oublié | Coaching Platform",
};

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-4 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Mot de passe oublié</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Indique l&apos;adresse e-mail de ton compte : tu recevras un lien pour choisir un nouveau
          mot de passe.
        </p>
      </div>
      <ResetRequestForm />
      <Link href="/login" className="text-sm underline">
        Retour à la connexion
      </Link>
    </main>
  );
}
