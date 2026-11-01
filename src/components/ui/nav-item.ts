// Ligne de menu (D-77, maquette v6) : sur ordinateur, 32 px, icône 16, 13 px ; dans le menu hamburger du
// téléphone (`large`), 44 px et 16 px pour le doigt. Page active : fond violet léger sans contour, icône
// violette ; survol : fond neutre très léger.
export function navItemClass(active: boolean, large = false) {
  const size = large
    ? "min-h-11 gap-3 rounded-control px-3 text-[16px]"
    : "h-8 gap-2.5 rounded-lg px-2.5 text-[13px]";
  return `flex items-center ${size} border border-transparent transition-colors duration-150 ${
    active
      ? "bg-selected font-medium text-text [&>svg]:text-violet-text"
      : "text-muted hover:bg-selected-hover hover:text-text"
  }`;
}
