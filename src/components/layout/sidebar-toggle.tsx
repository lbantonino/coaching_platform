"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { CooryLogo } from "@/components/ui/coory-logo";
import { SIDEBAR_STORAGE_KEY } from "@/lib/sidebar";

// Menu de gauche repliable (ordinateur, demande d'Antonino du 29/10/2026, comme ChatGPT) : un petit
// bouton le replie en une barre d'icônes (boucle du logo, icônes des pages, photo du compte), un autre
// le déplie. L'état vit sur <html data-sidebar="hidden"> (posé
// avant l'affichage par sidebarInitScript, pas de saut) et dans ce navigateur (localStorage) ; le CSS
// de globals.css fait le reste. Téléphone : sans effet, le menu y est déjà dans le hamburger.
function setHidden(hidden: boolean) {
  if (hidden) document.documentElement.dataset.sidebar = "hidden";
  else delete document.documentElement.dataset.sidebar;
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, hidden ? "hidden" : "visible");
  } catch {
    // Stockage bloqué : le menu change pour cette visite, sans être retenu.
  }
}

const buttonClass =
  "inline-flex size-[34px] shrink-0 items-center justify-center rounded-[9px] text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-text";

// Dans la barre latérale, à côté du logo.
export function HideSidebarButton() {
  return (
    <button
      type="button"
      aria-label="Replier le menu"
      title="Replier le menu"
      data-sidebar-hide=""
      onClick={() => setHidden(true)}
      className={buttonClass}
    >
      <PanelLeftClose aria-hidden size={18} strokeWidth={1.8} />
    </button>
  );
}

// Menu replié (comme ChatGPT) : UN seul bouton à la place du logo. Au repos, la boucle Coory ; au
// survol ou au focus, l'icône « déplier » ; un clic rouvre le menu. On gagne la place d'une icône.
export function ShowSidebarButton() {
  return (
    <button
      type="button"
      aria-label="Déplier le menu"
      title="Déplier le menu"
      data-sidebar-open=""
      onClick={() => setHidden(false)}
      className={`${buttonClass} group`}
    >
      <span className="inline-flex group-hover:hidden group-focus-visible:hidden">
        <CooryLogo variant="symbol" size={16} />
      </span>
      <PanelLeftOpen
        aria-hidden
        size={18}
        strokeWidth={1.8}
        className="hidden group-hover:block group-focus-visible:block"
      />
    </button>
  );
}
