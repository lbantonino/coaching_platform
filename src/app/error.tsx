"use client";

import Link from "next/link";

import { buttonClass } from "@/components/ui/button";

// Erreur inattendue pendant le rendu d'une page. On n'affiche JAMAIS le détail technique
// (il peut contenir des informations sensibles) : seulement un message et une sortie claire.
// Graphite & Or (29/10/2026) : « Erreur » en or, police de l'interface, un seul bouton or.
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-5 py-24">
      <p className="text-[13px] font-semibold tracking-[0.08em] text-accent-text uppercase">
        Erreur
      </p>
      <h1 className="font-display text-h2 font-semibold tracking-[-0.03em]">
        Un problème est survenu
      </h1>
      <p className="text-muted">
        La page n&apos;a pas pu s&apos;afficher. Réessaie dans un instant ; si le problème persiste,
        contacte l&apos;administrateur de la plateforme.
      </p>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={reset} className={buttonClass()}>
          Réessayer
        </button>
        <Link href="/" className={buttonClass({ variant: "outline" })}>
          Accueil
        </Link>
      </div>
    </main>
  );
}
