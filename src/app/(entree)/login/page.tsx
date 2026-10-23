import type { Metadata } from "next";
import Link from "next/link";

import { authLinkClass } from "../auth-fields";
import { SocialButtons } from "../social-buttons";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Connexion",
};

// Page d'arrivée de Coory (prompt Claude Design §7.1, COORY_AUTH_PAGES.md §3) : connexion par
// e-mail, ou par Google / Facebook / Apple s'ils sont configurés (D-30). La coquille (panneau de
// marque, logo, thème, pied de page) vient du layout du groupe (entree).
export default function LoginPage() {
  return (
    <div className="flex flex-col gap-[22px]">
      <div className="flex flex-col gap-2.5">
        <h1 className="font-display text-entry font-semibold lg:text-entry-lg">Bon retour.</h1>
        <p className="text-[15px] text-muted">
          Pas encore de compte ?{" "}
          <Link href="/inscription" className={authLinkClass}>
            Créer un compte
          </Link>
        </p>
      </div>
      <LoginForm />
      <SocialButtons />
    </div>
  );
}
