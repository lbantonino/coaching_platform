import Link from "next/link";

import { buttonClass } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="px-4 py-5 sm:px-8">
        <Logo />
      </header>
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 pb-24">
        <p className="font-mono text-data text-accent">ERREUR 404</p>
        <h1 className="text-h2 font-medium">Page introuvable</h1>
        <p className="text-muted">
          Cette adresse n&apos;existe pas ou plus. Vérifie le lien, ou repars de l&apos;accueil.
        </p>
        <Link
          href="/"
          className={buttonClass({ variant: "secondary", size: "md", className: "w-fit" })}
        >
          Retour à l&apos;accueil
        </Link>
      </main>
    </div>
  );
}
