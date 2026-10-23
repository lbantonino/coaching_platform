import type { Metadata } from "next";
import Link from "next/link";

import { entryLinkClass, EntryTitle } from "@/components/layout/entry-ui";

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
      <EntryTitle
        sub={
          <>
            Déjà un compte ?{" "}
            <Link href="/login" className={entryLinkClass}>
              Se connecter
            </Link>
          </>
        }
      >
        Créer un compte
      </EntryTitle>
      <SignupForm />
      <SocialButtons />
    </div>
  );
}
