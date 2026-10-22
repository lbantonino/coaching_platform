"use client";

import Link from "next/link";

import { buttonClass } from "@/components/ui/button";

// Erreur inattendue pendant le rendu d'une page. On n'affiche JAMAIS le détail technique
// (il peut contenir des informations sensibles) : seulement un message et une sortie claire.
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-5 py-24">
      <p className="font-mono text-data text-accent-text">ERREUR</p>
      <h1 className="font-display text-h2 font-medium">Un problème est survenu</h1>
      <p className="text-muted">
        La page n&apos;a pas pu s&apos;afficher. Réessaie dans un instant ; si le problème persiste,
        contacte l&apos;administrateur de la plateforme.
      </p>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={reset} className={buttonClass({ variant: "inverse" })}>
          Réessayer
        </button>
        <Link href="/" className={buttonClass({ variant: "outline" })}>
          Accueil
        </Link>
      </div>
    </main>
  );
}
