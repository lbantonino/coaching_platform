import type { Metadata } from "next";
import Link from "next/link";

import { SocialButtons } from "../social-buttons";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Connexion",
};

// Connexion par e-mail, ou par Google / Facebook / Apple s'ils sont configurés (D-30).
export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-start gap-8 px-5 pt-6 pb-16 sm:justify-center sm:py-16">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-h2 font-medium">Connexion</h1>
        <p className="text-small text-muted">
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="text-text underline underline-offset-4">
            Créer un compte
          </Link>
        </p>
      </div>
      <LoginForm />
      <SocialButtons />
    </main>
  );
}
