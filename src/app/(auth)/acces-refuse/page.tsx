import type { Metadata } from "next";
import Link from "next/link";

import { LogoutButton } from "@/components/ui/logout-button";

export const metadata: Metadata = {
  title: "Accès refusé",
  robots: { index: false },
};

// Même page pour « espace interdit » et « ressource inexistante ou d'une autre organisation » :
// ne jamais révéler l'existence d'une donnée à laquelle on n'a pas droit.
export default function AccessDeniedPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-start gap-6 px-5 pt-6 pb-16 sm:justify-center sm:py-16">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-h2 font-medium">Accès refusé</h1>
        <p className="text-muted">
          Ton compte n&apos;a pas accès à cette page. Si tu penses que c&apos;est une erreur,
          contacte l&apos;administrateur de la plateforme.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/"
          className="h-11 content-center rounded-lg px-4 font-medium text-text underline underline-offset-4"
        >
          Retour à l&apos;accueil
        </Link>
        <LogoutButton />
      </div>
    </main>
  );
}
