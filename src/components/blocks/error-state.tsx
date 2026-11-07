"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, useEffect, useRef } from "react";

import { ThemedCooryLogo } from "@/components/brand/themed-logo";
import { useMarkErrorPage } from "@/components/layout/error-page-flag";
import { MobileBarTitle } from "@/components/layout/mobile-bar";
import { LEGAL } from "@/config/legal";
import { formatErrorRef } from "@/lib/error-ref";

import {
  ErrorArrowLeft,
  ErrorArrowRight,
  ErrorRefresh,
  Illustration404,
  Illustration500,
} from "./error-illustrations";

// Pages d'erreur (maquette « Coory Erreurs » du 06/11/2026, D-147) : UN composant pour la 404 et la
// 500. Ordinateur : carte blanche qui remplit la place sous l'en-tête, contenu centré (470 px au plus),
// boutons côte à côte, pied 56 px dessous. Téléphone : carte de rayon 26, texte centré dans le haut,
// boutons empilés en bas (zone du pouce), pied dessous. Aucun appel réseau : la page s'affiche même
// quand le reste de l'app n'a pas chargé.
// Le texte passe à la ligne là où Antonino l'a voulu : 2 lignes sur ordinateur (une phrase par ligne),
// 3 sur téléphone.
export type ErrorVariant = "not-found" | "server-error";

const copy = {
  "not-found": {
    badge: "Erreur 404",
    title: "Page introuvable",
    desktop: [
      "Cette page n’existe pas ou a été déplacée.",
      "Vérifie l’adresse ou reviens à ton tableau de bord.",
    ],
    phone: [
      "Cette page n’existe pas ou a été",
      "déplacée. Vérifie l’adresse ou",
      "reviens à ton tableau de bord.",
    ],
  },
  "server-error": {
    badge: "Erreur 500",
    title: "Une erreur est survenue",
    desktop: [
      "Quelque chose s’est mal passé de notre côté.",
      "Tes données sont en sécurité, réessaie dans un instant.",
    ],
    phone: [
      "Quelque chose s’est mal passé de",
      "notre côté. Tes données sont en",
      "sécurité, réessaie dans un instant.",
    ],
  },
} as const;

const lines = (parts: readonly string[]) =>
  parts.map((part, index) => (
    <Fragment key={index}>
      {index > 0 ? <br /> : null}
      {part}
    </Fragment>
  ));

// Boutons : 52 px pleine largeur sur téléphone, 44 px sur ordinateur (maquette).
const buttonBase =
  "inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[13px] text-[15px] leading-none font-semibold whitespace-nowrap transition-[background-color,scale] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet active:scale-[0.98] lg:h-11 lg:w-auto lg:rounded-[11px] lg:text-[14px]";
const primaryClass = `${buttonBase} bg-cta px-[18px] text-on-cta hover:bg-cta-hover`;
const secondaryClass = `${buttonBase} bg-surface px-4 text-text inset-ring inset-ring-line-2 hover:bg-surface-2`;
const linkClass =
  "rounded-[4px] font-semibold text-violet-text transition-colors duration-150 hover:text-violet";

export function ErrorState({
  variant,
  digest,
  onRetry,
  inShell = true,
}: {
  variant: ErrorVariant;
  // Identifiant de l'erreur donné par Next.js (500) : affiché en « Réf. XXXX-XXXX », masqué sinon.
  digest?: string;
  onRetry?: () => void;
  // Dans la coquille de l'app (menu, en-tête) ; sinon page seule (StandaloneError).
  inShell?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const primaryLink = useRef<HTMLAnchorElement>(null);
  const primaryButton = useRef<HTMLButtonElement>(null);
  const text = copy[variant];
  const ref = formatErrorRef(digest);

  // Focus sur le bouton principal à l'arrivée (maquette, accessibilité), sans afficher son contour :
  // il apparaît dès qu'on se sert du clavier. Titre de l'onglet : celui de l'erreur, même quand la page
  // d'origine en avait posé un autre (« Exercice »).
  useEffect(() => {
    (primaryLink.current ?? primaryButton.current)?.focus({
      preventScroll: true,
      focusVisible: false,
    } as FocusOptions);
    document.title = variant === "not-found" ? "Page introuvable · Coory" : "Erreur · Coory";
  }, [variant]);

  const subject =
    variant === "not-found"
      ? `Lien cassé : ${pathname}`
      : `Erreur dans Coory${ref ? ` (Réf. ${ref})` : ""}`;
  const support = `mailto:${LEGAL.contactEmail}?subject=${encodeURIComponent(subject)}`;

  const back = () => {
    // Pas de page précédente dans l'onglet (adresse ouverte directement) : le tableau de bord.
    if (window.history.length > 1) router.back();
    else router.push("/");
  };

  return (
    <section
      aria-labelledby="error-title"
      className="flex flex-1 flex-col rounded-[26px] bg-surface px-6 pt-7 pb-6 lg:items-center lg:justify-center lg:rounded-[20px] lg:p-12 lg:inset-ring lg:inset-ring-line-soft"
    >
      {inShell ? <ShellMarks /> : null}
      <div className="flex flex-1 flex-col items-center justify-center text-center lg:w-full lg:max-w-[470px] lg:flex-none">
        {variant === "not-found" ? (
          <Illustration404 className="h-[68px] w-[172px] lg:h-[90px] lg:w-[228px]" />
        ) : (
          <Illustration500 className="h-[68px] w-[172px] lg:h-[90px] lg:w-[228px]" />
        )}
        <span className="mt-[30px] rounded-full bg-violet-soft px-[11px] py-[5px] text-[12px] leading-[normal] font-semibold text-violet-text lg:mt-9">
          {text.badge}
        </span>
        <h1
          id="error-title"
          className="mt-3 text-[28px] leading-[1.12] font-bold tracking-[-0.035em] text-balance text-text lg:mt-3.5 lg:text-[34px] lg:leading-[1.1]"
        >
          {text.title}
          <span className="text-violet">.</span>
        </h1>
        <p className="mt-3 text-[15px] leading-[1.6] text-muted">
          <span className="lg:hidden">{lines(text.phone)}</span>
          <span className="max-lg:hidden">{lines(text.desktop)}</span>
        </p>
      </div>

      <div className="flex w-full flex-col gap-2.5 lg:mt-[30px] lg:w-auto lg:flex-row">
        {variant === "not-found" ? (
          <>
            <Link ref={primaryLink} href="/" className={primaryClass}>
              Retour au tableau de bord
              <ErrorArrowRight aria-hidden size={16} strokeWidth={2} />
            </Link>
            <button type="button" onClick={back} className={secondaryClass}>
              <ErrorArrowLeft aria-hidden size={16} strokeWidth={2} />
              Page précédente
            </button>
          </>
        ) : (
          <>
            <button
              ref={primaryButton}
              type="button"
              onClick={() => (onRetry ? onRetry() : window.location.reload())}
              className={primaryClass}
            >
              <ErrorRefresh aria-hidden size={16} strokeWidth={2} />
              Réessayer
            </button>
            <Link href="/" className={secondaryClass}>
              Retour au tableau de bord
            </Link>
          </>
        )}
      </div>

      <div className="mt-5 flex items-center justify-center gap-2.5 text-[13px] leading-[normal] font-medium whitespace-nowrap text-dlg-faint lg:mt-14 lg:gap-3.5">
        {variant === "not-found" ? (
          <span>
            Un lien cassé ?{" "}
            <a href={support} className={linkClass}>
              Signale-le<span className="max-lg:hidden"> au support</span>
            </a>
          </span>
        ) : (
          <>
            <span>
              <span className="max-lg:hidden">Le problème persiste ? </span>
              <a href={support} className={linkClass}>
                Contacter le support
              </a>
            </span>
            {ref ? (
              <>
                <span aria-hidden className="h-3.5 w-px bg-lib-field-ring max-lg:hidden" />
                <span className="rounded-[6px] bg-bg px-[7px] py-[3px] text-[11.5px] font-medium text-muted tabular lg:px-2 lg:text-[12px]">
                  Réf. {ref}
                </span>
              </>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}

// Dans la coquille : aucun lien du menu actif, et le logo à la place du nom de la page dans la barre
// du téléphone (maquette).
function ShellMarks() {
  useMarkErrorPage();
  return (
    <MobileBarTitle>
      <span className="flex flex-1 justify-center">
        <ThemedCooryLogo height={12} />
      </span>
    </MobileBarTitle>
  );
}

// Page seule, hors de la coquille (PROPOSED validé le 06/11) : visiteur non connecté, adresse inconnue
// hors de l'espace coach, ou coquille qui a elle-même planté. Fond de l'app, logo en haut (à gauche sur
// ordinateur, centré sur téléphone), puis la même carte.
export function StandaloneError(props: {
  variant: ErrorVariant;
  digest?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col gap-3 bg-bg px-3.5 pt-[max(14px,env(safe-area-inset-top))] pb-[calc(28px+env(safe-area-inset-bottom))] lg:gap-4 lg:p-3.5">
      <header className="flex h-12 shrink-0 items-center justify-center lg:h-16 lg:justify-start lg:px-[22px]">
        <Link href="/" aria-label="Coory, accueil" className="flex rounded-sm">
          <span className="flex lg:hidden">
            <ThemedCooryLogo height={12} />
          </span>
          <span className="flex max-lg:hidden">
            <ThemedCooryLogo height={15} />
          </span>
        </Link>
      </header>
      <ErrorState {...props} inShell={false} />
    </div>
  );
}
