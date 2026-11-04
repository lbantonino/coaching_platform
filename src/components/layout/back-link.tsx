"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

// Retour « là où j'étais » (demande d'Antonino du 29/10/2026) : une séance ouverte depuis le tableau
// de bord ramène au tableau de bord, pas à l'agenda, et la flèche porte le nom de cette page
// (« Tableau de bord »). L'app retient la page précédente de cet onglet (sessionStorage) ; si c'est
// une autre page de l'app, le lien y mène directement (pas « page précédente » du navigateur : les
// onglets d'une fiche ajoutent des étapes à l'historique). Sinon (page ouverte directement, ou page
// précédente = une sous-page comme « Modifier »), il garde sa destination et son libellé habituels.
const PREVIOUS = "coory-previous-page";
const CURRENT = "coory-current-page";
const TITLE = "coory-page-title:";

const here = () => window.location.pathname + window.location.search;

// Titre de la page affichée : son h1 visible. Next garde la page quittée cachée dans le DOM
// (display: none), d'où le filtre ; le titre masqué visuellement sur téléphone (sr-only) compte.
function visibleTitle() {
  const titles = document.querySelectorAll<HTMLElement>("main h1");
  const title = Array.from(titles).find((h1) => h1.checkVisibility?.() ?? true);
  return title?.textContent?.trim() || null;
}

// Monté une fois dans la coquille : note la page précédente à chaque changement de page, et le titre
// de la page en cours à chaque clic (juste avant de la quitter).
export function NavigationMemory() {
  const pathname = usePathname();
  useEffect(() => {
    try {
      const current = sessionStorage.getItem(CURRENT);
      const next = here();
      if (current && current.split("?")[0] !== pathname) sessionStorage.setItem(PREVIOUS, current);
      sessionStorage.setItem(CURRENT, next);
    } catch {
      // Stockage bloqué : le retour garde sa destination habituelle.
    }
  }, [pathname]);
  useEffect(() => {
    const remember = () => {
      try {
        // Adresse exacte au moment du clic : l'onglet affiché d'une fiche (?onglet=…) change l'adresse
        // sans changer de page, et c'est sur cet onglet que le retour doit ramener.
        sessionStorage.setItem(CURRENT, here());
        const title = visibleTitle();
        if (title) sessionStorage.setItem(TITLE + window.location.pathname, title);
      } catch {
        // Stockage bloqué : libellé habituel.
      }
    };
    document.addEventListener("click", remember, true);
    return () => document.removeEventListener("click", remember, true);
  }, []);
  return null;
}

// Page précédente vers laquelle revenir, ou null pour garder le lien habituel. À l'arrivée sur la
// page, la flèche peut se lire avant que NavigationMemory ait noté le changement : la page « en
// cours » enregistrée est alors encore la précédente.
function previousPage() {
  const path = window.location.pathname;
  const current = sessionStorage.getItem(CURRENT);
  const previous =
    current && current.split("?")[0] !== path ? current : sessionStorage.getItem(PREVIOUS);
  const previousPath = previous?.split("?")[0];
  // Une page de création (« Créer un exercice », « Nouveau sportif »…) n'est jamais une destination de
  // retour : après l'enregistrement, revenir sur un formulaire vide n'a pas de sens.
  const creation = /\/(nouveau|nouvelle)$/.test(previousPath ?? "");
  if (
    !previous ||
    !previousPath ||
    creation ||
    previousPath === path ||
    previousPath.startsWith(`${path}/`)
  ) {
    return null;
  }
  return { href: previous, title: sessionStorage.getItem(TITLE + previousPath) };
}

// Retour dans la barre du haut du téléphone, entre ☰ et les outils (D-117) : aussi pour les retours
// propres à une page (« ← Conversations » de Messages, « ← Paramètres »).
export const barBackClass =
  "inline-flex min-h-11 min-w-0 items-center gap-2 pl-0.5 text-[15px] font-medium whitespace-nowrap text-muted transition-colors duration-150 active:text-text";

const noSubscription = () => () => {};
const previousTitle = () => {
  try {
    return previousPage()?.title ?? null;
  } catch {
    return null;
  }
};

export function BackLink({
  href,
  label,
  variant = "text",
}: {
  href: string;
  label: string;
  // « bar » : dans la barre du haut du téléphone, entre ☰ et les outils (fiche sportif).
  variant?: "text" | "bar";
}) {
  const router = useRouter();
  // Libellé : le titre de la page précédente, lu dans le navigateur (le serveur rend le libellé
  // habituel). Relu à chaque rendu, donc à chaque changement de page.
  const shown = useSyncExternalStore(noSubscription, previousTitle, () => null) ?? label;
  return (
    <Link
      href={href}
      onClick={(event) => {
        try {
          const previous = previousPage();
          if (previous) {
            event.preventDefault();
            router.push(previous.href);
          }
        } catch {
          // Stockage bloqué : lien normal.
        }
      }}
      className={
        variant === "bar"
          ? barBackClass
          : "inline-flex min-h-9 items-center gap-1.5 self-start text-[14px] text-muted transition-colors duration-150 hover:text-text"
      }
    >
      <ArrowLeft aria-hidden size={16} strokeWidth={1.8} className="shrink-0" />
      <span className={variant === "bar" ? "truncate" : ""}>{shown}</span>
    </Link>
  );
}
