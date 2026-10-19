import type { Metadata } from "next";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Connexion | Coaching Platform",
};

// Pas d'inscription publique avant P8 : les comptes coachs sont créés par l'administrateur.
export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-4 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Connexion</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Accès réservé aux comptes créés par l&apos;administrateur de la plateforme.
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
