"use client";

import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useLayoutEffect } from "react";

import { ThemedCooryMark } from "@/components/brand/themed-logo";
import { SIDEBAR_STORAGE_KEY } from "@/lib/sidebar";

// Menu de gauche repliable (ordinateur, demande d'Antonino du 29/10/2026, comme ChatGPT) : un petit
// bouton le replie en une barre d'icônes (boucle du logo, icônes des pages, photo du compte), un autre
// le déplie. L'état vit sur <html data-sidebar="hidden"> (posé
// avant l'affichage par sidebarInitScript, pas de saut) et dans ce navigateur (localStorage) ; le CSS
// de globals.css fait le reste. Téléphone : sans effet, le menu y est déjà dans le hamburger.
function setHidden(hidden: boolean) {
  // Un choix fait à la main remplace le repli automatique de la page Agenda.
  delete document.documentElement.dataset.sidebarAuto;
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
        {/* Icône du logo définitif (04/11) : 30 px de large, dans le bouton de 34 px, menu à 68 px. */}
        <ThemedCooryMark height={15} />
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

// Page Agenda (D-78, comme Google Agenda) : en arrivant, le menu se replie en icônes pour laisser la
// place au panneau de l'agenda, SANS changer le choix retenu ; en repartant, il reprend ce choix (sauf
// si on l'a déplié ou replié à la main entre-temps). Au premier chargement, sidebarInitScript l'a déjà
// replié avant l'affichage. Marque aussi la page (data-agenda). Téléphone
// (02/11) : la barre du navigateur, tout en haut, prend la couleur du fond de la page (meta
// theme-color), pour qu'il remplisse tout l'écran sans bande d'une autre couleur au-dessus ; elle suit le
// thème et reprend sa couleur en quittant l'Agenda.
export function AgendaSidebarCollapse() {
  useLayoutEffect(() => {
    const html = document.documentElement;
    html.dataset.agenda = "";
    const metas = [...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')];
    const colors = metas.map((meta) => meta.content);
    const paint = () => {
      const color = getComputedStyle(document.body).backgroundColor;
      for (const meta of metas) meta.content = color;
    };
    paint();
    const themeWatch = new MutationObserver(paint);
    themeWatch.observe(html, { attributes: true, attributeFilter: ["data-theme"] });
    if (html.dataset.sidebar !== "hidden") {
      html.dataset.sidebar = "hidden";
      html.dataset.sidebarAuto = "";
    }
    return () => {
      themeWatch.disconnect();
      metas.forEach((meta, index) => {
        meta.content = colors[index];
      });
      delete html.dataset.agenda;
      delete html.dataset.agendaPanel;
      if (!("sidebarAuto" in html.dataset)) return;
      delete html.dataset.sidebarAuto;
      let stored: string | null = null;
      try {
        stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      } catch {
        // Stockage bloqué : on rouvre le menu.
      }
      if (stored !== "hidden") delete html.dataset.sidebar;
    };
  }, []);
  return null;
}

// Barre de l'Agenda (ordinateur, comme le ☰ de Google Agenda) : masque ou montre le panneau de
// l'agenda (petit calendrier, filtres) pour donner toute la largeur au calendrier.
export function AgendaPanelToggle() {
  return (
    <button
      type="button"
      aria-label="Masquer ou afficher le panneau de l'agenda"
      title="Masquer ou afficher le panneau"
      onClick={() => {
        const html = document.documentElement;
        if ("agendaPanel" in html.dataset) delete html.dataset.agendaPanel;
        else html.dataset.agendaPanel = "hidden";
      }}
      className="grid size-8 shrink-0 place-items-center rounded-lg text-muted transition-colors duration-150 hover:bg-selected-hover hover:text-text"
    >
      <Menu aria-hidden size={17} strokeWidth={1.8} />
    </button>
  );
}
