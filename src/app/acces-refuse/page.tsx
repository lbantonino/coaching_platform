import type { Metadata } from "next";
import Link from "next/link";

import { LogoutButton } from "@/components/ui/logout-button";

export const metadata: Metadata = {
  title: "Accès refusé | Coaching Platform",
  robots: { index: false },
};

// Même page pour « espace interdit » et « ressource inexistante ou d'une autre organisation » :
// ne jamais révéler l'existence d'une donnée à laquelle on n'a pas droit.
export default function AccessDeniedPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Accès refusé</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Ton compte n&apos;a pas accès à cette page. Si tu penses que c&apos;est une erreur,
          contacte l&apos;administrateur de la plateforme.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/" className="h-11 content-center rounded-lg px-4 font-medium underline">
          Retour à l&apos;accueil
        </Link>
        <LogoutButton />
      </div>
    </main>
  );
}
