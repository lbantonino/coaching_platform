"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

// « Retour » des pages légales : page précédente si la personne vient de l'app, sinon la connexion
// (lien ouvert dans un nouvel onglet depuis l'inscription, par exemple). `compact` : bouton carré du
// téléphone, icône seule.
export function LegalBackLink({
  className,
  compact = false,
}: {
  className: string;
  compact?: boolean;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/login"))}
      aria-label={compact ? "Retour" : undefined}
      className={className}
    >
      <ArrowLeft aria-hidden size={compact ? 17 : 16} strokeWidth={2} />
      {compact ? null : "Retour"}
    </button>
  );
}
