import type { ReactNode } from "react";

// Barre d'actions fixe du téléphone (kit « Coory Pages », MOBILE-ACTIONBAR, D-119) : en bas de
// l'écran, sur un fondu de la couleur de la page ; l'action principale prend toute la largeur
// (« Générer le lien d'invitation », « Enregistrer »…), « Annuler » éventuellement à sa gauche.
// 12 px au-dessus du bouton, 30 px dessous (ou la zone du geste de l'iPhone si elle est plus grande).
// `data-mobile-actionbar` : le corps de la page garde 110 px en bas pour passer au-dessus
// (globals.css). Cachée sur ordinateur : la page y montre ses boutons à leur place.
export function MobileActionBar({ children }: { children: ReactNode }) {
  return (
    <div
      data-mobile-actionbar=""
      className="fixed inset-x-0 bottom-0 z-30 flex gap-2.5 px-4 pt-3 pb-[max(30px,env(safe-area-inset-bottom))] [background:linear-gradient(to_bottom,transparent,var(--bg)_30%)] lg:hidden"
    >
      {children}
    </div>
  );
}

// Bouton principal de la barre : 54 px, rayon 15, encre, 16 px demi-gras, ombre douce.
export const mobileActionPrimaryClass =
  "inline-flex h-[54px] min-w-0 flex-1 items-center justify-center gap-2 rounded-[15px] bg-cta px-5 text-[16px] leading-[normal] font-semibold text-on-cta shadow-[0_12px_28px_-10px_rgba(22,18,40,0.45)] transition-[scale,opacity] duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

// « Annuler » à gauche du bouton principal (kit, pages 06, 10, 11, 12, 13) : 54 px, rayon 15, fond
// de carte et filet, 15 px ; il revient à l'écran précédent.
export const mobileActionSecondaryClass =
  "inline-flex h-[54px] shrink-0 items-center justify-center rounded-[15px] bg-surface px-5 text-[15px] leading-[normal] font-medium text-text inset-ring inset-ring-line-2 transition-[scale,background-color] duration-150 active:scale-[0.98] active:bg-surface-2";
