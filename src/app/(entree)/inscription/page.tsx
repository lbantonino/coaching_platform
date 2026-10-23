import type { Metadata } from "next";
import Link from "next/link";

import { authLinkClass } from "../auth-fields";
import { SocialButtons } from "../social-buttons";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Créer un compte",
};

// Inscription libre (D-30, prompt Claude Design §7.1) : coach (crée son espace) ou sportif (rattaché
// ensuite par son coach). Le sur-titre du panneau de marque suit le type de compte choisi.
export default function SignupPage() {
  return (
    <div className="flex flex-col gap-[22px]">
      <div className="flex flex-col gap-2.5">
        <h1 className="font-display text-entry font-semibold lg:text-entry-lg">Créer un compte</h1>
        <p className="text-[15px] text-muted">
          Déjà un compte ?{" "}
          <Link href="/login" className={authLinkClass}>
            Se connecter
          </Link>
        </p>
      </div>
      <SignupForm />
      <SocialButtons />
    </div>
  );
}
