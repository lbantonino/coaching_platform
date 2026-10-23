"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

// « Retour » : page précédente si la personne vient de l'app, sinon la connexion (lien ouvert dans un
// nouvel onglet depuis l'inscription, par exemple).
export function LegalBackLink() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/login"))}
      className="inline-flex min-h-11 items-center gap-1.5 self-start text-[14px] text-muted transition-colors duration-150 hover:text-text"
    >
      <ArrowLeft aria-hidden size={16} strokeWidth={1.8} />
      Retour
    </button>
  );
}
