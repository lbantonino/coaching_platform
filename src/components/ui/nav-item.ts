// Ligne de menu : 44 px, icône 19, 15/500. Sélection en JAUNE doré à faible opacité (D-71, demande
// d'Antonino du 29/10/2026) : fond --selected sans contour, icône or ; survol en jaune plus léger.
// Partagée par le menu latéral (ordinateur) et le menu hamburger (téléphone).
export function navItemClass(active: boolean) {
  return `flex min-h-11 items-center gap-3 rounded-control border px-3 text-[15px] font-medium transition-colors duration-150 ${
    active
      ? "border-transparent bg-selected text-text [&>svg]:text-accent-text"
      : "border-transparent text-muted hover:bg-selected-hover hover:text-text"
  }`;
}
