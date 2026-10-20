import type { Metadata } from "next";
import Link from "next/link";

import { ResetRequestForm } from "./reset-request-form";

export const metadata: Metadata = {
  title: "Mot de passe oublié",
};

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-start gap-8 px-4 pt-6 pb-16 sm:justify-center sm:py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-h2 font-medium">Mot de passe oublié</h1>
        <p className="text-small text-muted">
          Indique l&apos;adresse e-mail de ton compte : tu recevras un lien pour choisir un nouveau
          mot de passe.
        </p>
      </div>
      <ResetRequestForm />
      <Link
        href="/login"
        className="text-small text-muted underline underline-offset-4 hover:text-text"
      >
        Retour à la connexion
      </Link>
    </main>
  );
}
