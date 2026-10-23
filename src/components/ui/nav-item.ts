// Ligne de menu (prompt Claude Design §5.2) : 44 px, rayon 12, icône 19, 15/500. Active = fond rouge
// doux + filet rouge. Partagée par le menu latéral (ordinateur) et le menu hamburger (téléphone).
export function navItemClass(active: boolean) {
  return `flex min-h-11 items-center gap-3 rounded-control border px-3 text-[15px] font-medium transition-colors duration-150 ${
    active
      ? "border-accent-line bg-accent-soft text-text"
      : "border-transparent text-text hover:bg-surface-2"
  }`;
}
