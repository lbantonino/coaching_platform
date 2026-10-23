import type { Metadata } from "next";

import { EntryBackLink, EntryTitle } from "@/components/layout/entry-ui";

import { ResetRequestForm } from "./reset-request-form";

export const metadata: Metadata = {
  title: "Mot de passe oublié",
};

// Mot de passe oublié (prompt Claude Design §7.1).
export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-[22px]">
      <EntryBackLink href="/login">Retour à la connexion</EntryBackLink>
      <EntryTitle sub="Indique ton adresse e-mail : on t'envoie un lien pour choisir un nouveau mot de passe.">
        Mot de passe oublié
      </EntryTitle>
      <ResetRequestForm />
    </div>
  );
}
