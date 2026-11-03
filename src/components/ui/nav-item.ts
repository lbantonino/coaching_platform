// Ligne de menu : sur ordinateur, 34 px, icône 16, 13,5 px (maquette « Sportifs » du 03/11/2026) ; dans
// le menu hamburger du téléphone (`large`), 44 px et 16 px pour le doigt. Page active : fond violet léger
// sans contour (icône violette dans le menu du téléphone) ; survol : fond neutre très léger.
export function navItemClass(active: boolean, large = false) {
  const size = large
    ? "min-h-11 gap-3 rounded-control px-3 text-[16px]"
    : "h-[34px] gap-2.5 rounded-[9px] px-3 text-[13.5px]";
  return `flex items-center ${size} transition-colors duration-150 ${
    active
      ? `bg-selected text-text ${large ? "font-medium [&>svg]:text-violet-text" : ""}`
      : "text-muted hover:bg-selected-hover hover:text-text"
  }`;
}
