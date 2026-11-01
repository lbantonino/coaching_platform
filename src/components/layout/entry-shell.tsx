import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import { CooryLogo, CooryWatermark } from "@/components/ui/coory-logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

import { DefaultEyebrow, EntryEyebrow } from "./entry-eyebrow";

// Coquille des pages d'entrée (prompt Claude Design §5.1) : connexion, inscription, bienvenue,
// mot de passe, invitation, pages d'erreur.
// Ordinateur (≥ 1024 px) : panneau de marque à gauche (44 %, 680 px max, collant), formulaire à droite
// centré verticalement, 440 px max. Téléphone : une colonne, logo et thème en tête, contenu en haut.

function EntryFooter() {
  return (
    <footer className="flex flex-wrap justify-center gap-x-[18px] gap-y-1.5 pt-6 text-[13px] text-muted">
      <Link href="/conditions" className="flex min-h-8 items-center hover:text-text">
        Conditions
      </Link>
      <Link href="/confidentialite" className="flex min-h-8 items-center hover:text-text">
        Confidentialité
      </Link>
      <Link href="/mentions-legales" className="flex min-h-8 items-center hover:text-text">
        Mentions légales
      </Link>
    </footer>
  );
}

// Accroche de la marque : panneau de marque sur ordinateur, carte de la connexion sur téléphone.
export function BrandPitch({ size }: { size: "panel" | "card" }) {
  const panel = size === "panel";
  return (
    <>
      <p
        className={`font-display leading-[0.98] font-semibold tracking-[-0.045em] ${
          panel ? "text-[64px]" : "text-[34px]"
        }`}
      >
        Programmer,
        <br />
        publier et suivre
        <br />
        <span className="text-accent-text">tes sportifs.</span>
      </p>
      <p
        className={
          panel
            ? "max-w-[460px] text-[17px] leading-[1.55] text-muted"
            : "text-[15px] leading-[1.5] text-muted"
        }
      >
        Programmation et suivi d&apos;entraînements Running, Musculation, Hyrox et Hybride.
      </p>
    </>
  );
}

export function EntryShell({ children }: { children: ReactNode }) {
  return (
    <div className="group/auth flex min-h-dvh flex-1">
      <aside className="sticky top-4 m-4 hidden min-h-[calc(100dvh-32px)] w-[44%] max-w-[680px] shrink-0 flex-col justify-between self-start overflow-hidden rounded-[24px] border border-line bg-panel px-12 py-11 lg:flex">
        <CooryWatermark className="absolute -right-[420px] -bottom-[140px] w-[700px] opacity-[0.05]" />
        <CooryLogo size={20} />
        <div className="relative flex flex-col gap-6">
          <Suspense fallback={<DefaultEyebrow />}>
            <EntryEyebrow />
          </Suspense>
          <BrandPitch size="panel" />
        </div>
        <span className="relative text-[13px] text-muted">© 2026 Coory · Bruxelles</span>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col px-5 pt-2.5 pb-7 lg:pt-6 lg:pr-10 lg:pb-7 lg:pl-6">
        <div className="flex min-h-11 items-center gap-2.5">
          <Link href="/login" aria-label="Accueil" className="rounded-sm lg:hidden">
            <CooryLogo size={17} />
          </Link>
          <div className="flex-1" />
          <ThemeToggle />
        </div>
        <main className="flex flex-1 flex-col justify-start pt-4 pb-2 lg:justify-center lg:py-8">
          {/* Une page marquée data-mobile-fill (la connexion) reçoit toute la hauteur sur téléphone,
              pour y centrer son formulaire. Les autres pages restent alignées en haut. */}
          <div className="mx-auto w-full max-w-[440px] max-lg:has-[[data-mobile-fill]]:flex max-lg:has-[[data-mobile-fill]]:flex-1 max-lg:has-[[data-mobile-fill]]:flex-col">
            {children}
          </div>
        </main>
        <EntryFooter />
      </div>
    </div>
  );
}

// Pages légales (conditions, confidentialité, mentions) : lecture longue de 720 px, sans panneau.
export function LegalShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col px-5 pt-2.5 pb-7 lg:px-10 lg:pt-6">
      <div className="flex min-h-11 items-center gap-2.5">
        <Link href="/login" aria-label="Accueil" className="rounded-sm">
          <CooryLogo size={17} />
        </Link>
        <div className="flex-1" />
        <ThemeToggle />
      </div>
      <main className="flex flex-1 flex-col pt-4 pb-2 lg:py-8">
        <div className="mx-auto w-full max-w-[720px]">{children}</div>
      </main>
      <EntryFooter />
    </div>
  );
}
