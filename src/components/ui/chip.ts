// Pastille (prompt Claude Design §4 « Chip / filtre ») : 44 px de haut (zone tactile minimale, audit
// apple-design du 28/10 ; le prototype disait 40), rayon 20, 14/500, contour line-2. Sélectionnée =
// couleurs inversées (jamais rouge).
export const chipClass =
  "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-pill border px-3.5 text-[14px] font-medium whitespace-nowrap transition-colors duration-150";
export const chipActiveClass = "border-inv bg-inv text-on-inv";
export const chipIdleClass = "border-line-2 text-text hover:bg-surface";
