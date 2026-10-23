import type { Metadata } from "next";
import Link from "next/link";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { BRAND } from "@/config/brand";

import { authLinkClass } from "../auth-fields";
import { AuthShell, Hero } from "../auth-shell";
import { SocialButtons } from "../social-buttons";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Connexion",
};

// Page d'arrivée de Coory (COORY_AUTH_PAGES.md §3) : connexion par e-mail, ou par Google / Facebook /
// Apple s'ils sont configurés (D-30).
export default function LoginPage() {
  return (
    <AuthShell variant="login" topRight={<ThemeToggle />}>
      <div className="flex w-full flex-1 flex-col lg:max-w-[400px] lg:flex-none">
        <div className="flex flex-col gap-3 lg:hidden">
          <Hero className="text-[38px] leading-none" />
          <p className="text-[14px] text-muted">{BRAND.tagline}</p>
        </div>
        <hr className="my-6 border-line lg:hidden" />

        <div className="mb-8 hidden flex-col gap-2.5 lg:flex">
          <h2 className="font-display text-[38px] leading-tight font-semibold tracking-[-0.035em]">
            Bon retour.
          </h2>
          <p className="text-[14px] text-muted">
            Pas encore de compte ?{" "}
            <Link href="/inscription" className={authLinkClass}>
              Créer un compte
            </Link>
          </p>
        </div>
        <h2 className="mb-5 font-display text-[24px] font-semibold tracking-[-0.03em] lg:hidden">
          Connexion
        </h2>

        <LoginForm />
        <div className="mt-6">
          <SocialButtons />
        </div>
      </div>
    </AuthShell>
  );
}
