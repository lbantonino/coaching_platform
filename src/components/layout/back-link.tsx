"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useSyncExternalStore } from "react";

// Retour « là où j'étais » (demande d'Antonino du 29/10/2026) : une séance ouverte depuis le tableau
// de bord ramène au tableau de bord, pas à l'agenda, et la flèche porte le nom de cette page
// (« Tableau de bord »). L'app retient la page précédente de cet onglet (sessionStorage) ; si c'est
// une autre page de l'app, le lien y mène directement (pas « page précédente » du navigateur : les
// onglets d'une fiche ajoutent des étapes à l'historique). Sinon (page ouverte directement, ou page
// précédente = une sous-page comme « Modifier »), il garde sa destination et son libellé habituels.
const PREVIOUS = "coory-previous-page";
const CURRENT = "coory-current-page";
const TITLE = "coory-page-title:";
// La page précédente a-t-elle été quittée par une navigation normale (lien, bouton) ? « 0 » si l'on
// est arrivé ici par le geste de retour (alors l'historique ne mène pas à elle).
const FORWARD = "coory-previous-forward";
// Page à recharger en y revenant par l'historique (ses données ont pu changer entre-temps).
const REFRESH = "coory-refresh-on-return";
// Dernier « Précédent / Suivant » du navigateur (geste de retour) : une arrivée dans la seconde vient
// de l'historique.
let poppedAt = 0;

const here = () => window.location.pathname + window.location.search;

// Titre de la page affichée : son h1 visible. Next garde la page quittée cachée dans le DOM
// (display: none), d'où le filtre ; le titre masqué visuellement sur téléphone (sr-only) compte.
// innerText : seul le texte affiché (« Inviter Sophie » sur téléphone, « Inviter Sophie Lambert »
// sur ordinateur, D-119), pas les deux versions d'un titre qui change selon l'écran.
function visibleTitle() {
  const titles = document.querySelectorAll<HTMLElement>("main h1");
  const title = Array.from(titles).find((h1) => h1.checkVisibility?.() ?? true);
  return title?.innerText?.trim() || null;
}

// Monté une fois dans la coquille : note la page précédente à chaque changement de page, et le titre
// de la page en cours à chaque clic (juste avant de la quitter).
export function NavigationMemory() {
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    const onPop = () => {
      poppedAt = Date.now();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  useEffect(() => {
    try {
      const current = sessionStorage.getItem(CURRENT);
      const next = here();
      if (current && current.split("?")[0] !== pathname) {
        sessionStorage.setItem(PREVIOUS, current);
        sessionStorage.setItem(FORWARD, Date.now() - poppedAt < 1000 ? "0" : "1");
      }
      sessionStorage.setItem(CURRENT, next);
      // Revenu par l'historique sur une page dont les données ont changé : on la recharge.
      const stale = sessionStorage.getItem(REFRESH);
      if (stale) {
        sessionStorage.removeItem(REFRESH);
        if (stale === pathname) router.refresh();
      }
    } catch {
      // Stockage bloqué : le retour garde sa destination habituelle.
    }
  }, [pathname, router]);
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
  // « …/nouveau-programme » aussi (revue MVP du 13/11, C8 : l'assistant depuis la fiche).
  const creation = /\/(nouveau|nouvelle)(-[a-z]+)?$/.test(previousPath ?? "");
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

// Revenir à `href` en RECULANT dans l'historique quand c'est la page d'où l'on vient par une navigation
// normale : le geste de retour suit alors ce retour au lieu de rouvrir la page quittée (cas signalé au
// test sur iPhone du 15/11 : « Modifier la séance » puis « ← Semaine 1 »). Ses données sont rechargées
// à l'arrivée. false : ce n'est pas la page d'avant, le lien l'ouvre normalement.
// `steps` : les étapes de cette page à remonter d'un coup (2 : l'éditeur d'une séance ouvert depuis le
// détail de la séance, dont « ← Semaine 1 » ramène à la semaine).
export function returnByHistory(href: string, steps = 1): boolean {
  try {
    const previous = previousPage();
    const path = href.split("?")[0];
    if (!previous || previous.href.split("?")[0] !== path) return false;
    if (sessionStorage.getItem(FORWARD) !== "1") return false;
    sessionStorage.setItem(REFRESH, path ?? "");
    window.history.go(-steps);
    return true;
  } catch {
    return false;
  }
}

// Une page qui enregistre toute seule (éditeur de programme, de séance) donne son propre départ
// (revue MVP du 13/11, C7) : le retour de l'en-tête enregistre d'abord ce qui attend, et prévient si
// l'enregistrement échoue, au lieu de quitter la page en perdant la dernière modification.
const BackGuardContext = createContext<((href: string) => void) | null>(null);
export const BackGuardProvider = BackGuardContext.Provider;

// Retour dans la barre du haut du téléphone, entre ☰ et les outils (D-117) : aussi pour les retours
// propres à une page (« ← Conversations » de Messages, « ← Paramètres »). Violet, 16 px (kit
// « Coory Pages », décision d'Antonino du 04/11, D-119) ; flèche de 18 px (barBackIcon).
export const barBackClass =
  "inline-flex min-h-11 min-w-0 items-center gap-1.5 pl-0.5 text-[16px] leading-[normal] font-medium whitespace-nowrap text-violet-text transition-opacity duration-150 active:opacity-70";
export const barBackIcon = { size: 18, strokeWidth: 2 } as const;

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
  variant = "path",
}: {
  href: string;
  label: string;
  // « bar » : dans la barre du haut du téléphone, entre ☰ et les outils.
  // « path » : le début du chemin de l'en-tête sur ordinateur, sur la même ligne que la page en cours
  // (« ← Bibliothèque · Créer un exercice », règle d'Antonino du 05/11/2026, D-124) : 15 px comme le
  // titre, en gris, le nom coupé par « … » s'il est trop long.
  variant?: "bar" | "path";
}) {
  const router = useRouter();
  const guard = useContext(BackGuardContext);
  // Libellé : le titre de la page précédente, lu dans le navigateur (le serveur rend le libellé
  // habituel). Relu à chaque rendu, donc à chaque changement de page.
  const shown = useSyncExternalStore(noSubscription, previousTitle, () => null) ?? label;
  return (
    <Link
      href={href}
      onClick={(event) => {
        let target: string | null = null;
        try {
          target = previousPage()?.href ?? null;
        } catch {
          // Stockage bloqué : lien normal.
        }
        if (guard) {
          event.preventDefault();
          guard(target ?? href);
        } else if (target) {
          event.preventDefault();
          router.push(target);
        }
      }}
      className={
        variant === "bar"
          ? barBackClass
          : "inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-[4px] text-[15px] leading-[normal] font-medium whitespace-nowrap text-muted transition-colors duration-150 hover:text-text"
      }
    >
      <ArrowLeft
        aria-hidden
        {...(variant === "bar" ? barBackIcon : { size: 15, strokeWidth: 2 })}
        className="shrink-0"
      />
      <span className="min-w-0 truncate">{shown}</span>
    </Link>
  );
}
