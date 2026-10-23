import type { Metadata } from "next";
import Link from "next/link";

import { BRAND } from "@/config/brand";

import { authLinkClass } from "../auth-fields";
import { AuthShell, Eyebrow, Hero } from "../auth-shell";
import { SocialButtons } from "../social-buttons";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Créer un compte",
};

// Inscription libre (D-30), présentation COORY_AUTH_PAGES.md §4 : coach (crée son espace) ou sportif
// (rattaché ensuite par son coach).
export default function SignupPage() {
  return (
    <AuthShell
      variant="signup"
      topRight={
        <Link href="/login" className="text-[13px] text-muted hover:text-text">
          Se connecter
        </Link>
      }
    >
      <div className="flex w-full flex-col lg:max-w-[440px]">
        {/* Téléphone : carte d'accroche au-dessus du formulaire. */}
        <div className="mb-6 flex flex-col gap-3 rounded-[20px] border border-line bg-surface p-5 lg:hidden">
          <Eyebrow variant="signup" />
          <Hero className="text-[28px] leading-none" />
          <p className="text-[13px] text-muted">{BRAND.tagline}</p>
        </div>

        <div className="mb-6 flex flex-col gap-2.5 lg:mb-7">
          <h2 className="font-display text-[26px] leading-tight font-semibold tracking-[-0.035em] lg:text-[38px]">
            Créer un compte
          </h2>
          <p className="hidden text-[14px] text-muted lg:block">
            Déjà un compte ?{" "}
            <Link href="/login" className={authLinkClass}>
              Se connecter
            </Link>
          </p>
        </div>

        <SignupForm />
        <div className="mt-6">
          <SocialButtons />
        </div>
      </div>
    </AuthShell>
  );
}
