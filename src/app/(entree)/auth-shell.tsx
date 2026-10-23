import Link from "next/link";
import type { ReactNode } from "react";

import { CooryLogo, CooryWatermark } from "@/components/ui/coory-logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { BRAND } from "@/config/brand";

// Cadre des pages Connexion et Inscription (COORY_AUTH_PAGES.md) : sur ordinateur, panneau de marque à
// gauche et formulaire à droite ; sur téléphone, une seule colonne. Couleurs du projet uniquement.
// Le sur-titre de l'inscription suit le type de compte choisi dans le formulaire, sans JavaScript :
// la case « sportif » cochée (n'importe où dans la page) bascule le texte par :has().

const eyebrowClass =
  "font-mono text-[12px] font-medium tracking-[0.08em] text-accent-text uppercase";

export function Eyebrow({ variant }: { variant: "login" | "signup" }) {
  if (variant === "login") return <p className={eyebrowClass}>Plateforme de coaching</p>;
  return (
    <p className={eyebrowClass}>
      <span className="group-has-[[value=athlete]:checked]/auth:hidden">Espace coach</span>
      <span className="hidden group-has-[[value=athlete]:checked]/auth:inline">Espace sportif</span>
    </p>
  );
}

// Accroche « Programmer, publier et suivre tes sportifs. » (rouge sur « tes sportifs. »).
export function Hero({ className }: { className: string }) {
  return (
    <h1 className={`font-display font-semibold tracking-[-0.045em] ${className}`}>
      Programmer,
      <br />
      publier et suivre
      <br />
      <span className="text-accent-text">tes sportifs.</span>
    </h1>
  );
}

export function AuthShell({
  variant,
  topRight,
  children,
}: {
  variant: "login" | "signup";
  // Barre haute sur téléphone, à droite du logo (bouton thème, ou lien « Se connecter »).
  topRight: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="group/auth relative flex min-h-dvh flex-1 overflow-hidden">
      <aside className="relative m-4 hidden w-[51%] max-w-[740px] shrink-0 flex-col justify-between overflow-hidden rounded-[24px] border border-line bg-surface px-12 py-11 lg:flex">
        <CooryLogo size={26} />
        <div className="relative flex flex-col gap-6">
          <Eyebrow variant={variant} />
          <Hero className="text-[68px] leading-[0.98]" />
          <p className="max-w-[470px] text-[17px] leading-[1.55] text-muted">{BRAND.tagline}</p>
        </div>
        <span />
        <CooryWatermark className="absolute -right-[420px] -bottom-[150px] w-[1180px] text-text opacity-[0.035]" />
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col gap-6 px-[22px] pt-3.5 pb-7 lg:py-7 lg:pr-10 lg:pl-6">
        {variant === "login" ? (
          <CooryWatermark className="absolute top-10 -right-[300px] w-[620px] text-text opacity-[0.04] lg:hidden" />
        ) : null}
        <div className="relative flex items-center justify-between lg:justify-end">
          <span className="lg:hidden">
            <CooryLogo size={24} />
          </span>
          <span className="lg:hidden">{topRight}</span>
          <span className="hidden lg:inline-flex">
            <ThemeToggle />
          </span>
        </div>
        <main className="relative flex flex-1 flex-col lg:items-center lg:justify-center">
          {children}
        </main>
        <footer className="relative flex items-center justify-between gap-4 text-[12px] text-faint">
          <span>© 2026 {BRAND.name}</span>
          <span>
            <Link href="/conditions" className="hover:text-text">
              Conditions
            </Link>{" "}
            ·{" "}
            <Link href="/confidentialite" className="hover:text-text">
              Confidentialité
            </Link>
          </span>
        </footer>
      </div>
    </div>
  );
}
