import type { Metadata } from "next";
import Link from "next/link";

import { entryLinkClass, EntryTitle } from "@/components/layout/entry-ui";
import { SocialButtons } from "@/components/layout/social-buttons";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Connexion",
};

// Connexion (maquette d'Antonino du 06/11/2026, écran 01, D-139). La coquille (photo du coureur,
// liens légaux) vient du layout du groupe (auth). Ordinateur : formulaire centré dans la colonne,
// « Pas encore de compte ? » en bas ; téléphone : tout s'enchaîne sous la photo.
// Google / Facebook / Apple : seulement s'ils sont configurés (D-30), sinon ni « ou » ni bouton.
export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col lg:my-auto">
        <EntryTitle sub="Connecte-toi à ton espace Coory." className="pt-1 lg:pt-0 lg:pb-1.5">
          Connexion
        </EntryTitle>
        <LoginForm />
        <SocialButtons />
      </div>
      <p className="pt-4 text-center text-[14px] font-medium text-dlg-ink-2 lg:pt-6 lg:text-[13.5px]">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className={entryLinkClass}>
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
