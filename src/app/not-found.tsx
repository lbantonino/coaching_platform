import Link from "next/link";

import { buttonClass } from "@/components/ui/button";
import { CooryLogo } from "@/components/ui/coory-logo";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="px-5 py-5 sm:px-8">
        <CooryLogo size={24} />
      </header>
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-5 pb-24">
        <p className="text-[13px] font-semibold tracking-[0.08em] text-accent-text uppercase">
          Erreur 404
        </p>
        <h1 className="font-display text-h2 font-semibold tracking-[-0.03em]">Page introuvable</h1>
        <p className="text-muted">
          Cette adresse n&apos;existe pas ou plus. Vérifie le lien, ou repars de l&apos;accueil.
        </p>
        <Link href="/" className={buttonClass({ size: "md", className: "w-fit" })}>
          Retour à l&apos;accueil
        </Link>
      </main>
    </div>
  );
}
