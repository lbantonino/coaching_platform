import type { Metadata } from "next";
import Link from "next/link";

import { SocialButtons } from "../social-buttons";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Créer un compte",
};

// Inscription libre (D-30) : coach (crée son espace) ou sportif (rattaché ensuite par son coach).
export default function SignupPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-start gap-8 px-5 pt-6 pb-16 sm:py-12">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-h2 font-medium">Créer un compte</h1>
        <p className="text-small text-muted">
          Déjà un compte ?{" "}
          <Link href="/login" className="text-text underline underline-offset-4">
            Se connecter
          </Link>
        </p>
      </div>
      <SignupForm />
      <SocialButtons />
    </main>
  );
}
