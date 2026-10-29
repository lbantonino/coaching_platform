// Ligne de menu : 44 px, icône 19, 15/500. Graphite & Or (29/10/2026) : inactive en gris, active en
// texte principal sur fond relevé (le surlignement suffit, sans point or : demande du 29/10). Partagée par le menu
// latéral (ordinateur) et le menu hamburger (téléphone).
export function navItemClass(active: boolean) {
  return `flex min-h-11 items-center gap-3 rounded-control border px-3 text-[15px] font-medium transition-colors duration-150 ${
    active
      ? "border-transparent bg-surface-2 text-text"
      : "border-transparent text-muted hover:bg-surface-2 hover:text-text"
  }`;
}
