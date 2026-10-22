import type { Metadata } from "next";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Connexion",
};

// Pas d'inscription publique avant P8 : les comptes coachs sont créés par l'administrateur.
export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-start gap-8 px-5 pt-6 pb-16 sm:justify-center sm:py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-h2 font-medium">Connexion</h1>
        <p className="text-small text-muted">
          Accès réservé aux comptes créés par l&apos;administrateur de la plateforme.
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
