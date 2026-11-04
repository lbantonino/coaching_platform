import type { Metadata } from "next";
import Link from "next/link";

import { DefaultEyebrow } from "@/components/layout/entry-eyebrow";
import { BrandPitch } from "@/components/layout/entry-shell";
import { entryLinkClass, EntryTitle } from "@/components/layout/entry-ui";

import { SocialButtons } from "../social-buttons";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Connexion",
};

// Page d'arrivée de Coory (prompt Claude Design §7.1, COORY_AUTH_PAGES.md §3) : connexion par
// e-mail, ou par Google / Facebook / Apple s'ils sont configurés (D-30). La coquille (panneau de
// marque, logo, thème, pied de page) vient du layout du groupe (entree).
// Téléphone uniquement (demande d'Antonino du 23/10) : carte de marque (sans filigrane depuis le logo
// définitif du 04/11), puis le formulaire centré dans la hauteur restante (data-mobile-fill).
export default function LoginPage() {
  return (
    <div data-mobile-fill className="flex flex-col gap-[22px] max-lg:flex-1">
      <section
        aria-label="Coory, plateforme de coaching"
        className="relative overflow-hidden rounded-[20px] border border-line bg-panel p-5 lg:hidden"
      >
        <div className="relative flex flex-col gap-4">
          <DefaultEyebrow />
          <BrandPitch size="card" />
        </div>
      </section>

      <div className="flex flex-col gap-[22px] max-lg:my-auto">
        <EntryTitle
          sub={
            <>
              Pas encore de compte ?{" "}
              <Link href="/inscription" className={entryLinkClass}>
                Créer un compte
              </Link>
            </>
          }
        >
          Bon retour.
        </EntryTitle>
        <LoginForm />
        <SocialButtons />
      </div>
    </div>
  );
}
