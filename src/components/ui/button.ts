// Boutons du design system Coory (prompt Claude Design §4) : aplats, sans dégradé ni ombre, uniquement
// des jetons. primary = action principale (rouge, UNE seule par écran) · inverse = action forte neutre
// (clair sur sombre) · outline = action secondaire · ghost = action discrète (Annuler).
// Tailles : sm 36 px · md 44 px (cible tactile minimale) · lg 54 px (pleine largeur sur téléphone).

type Variant = "primary" | "inverse" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

// Appui = léger enfoncement (scale .98), sans rebond. Désactivé = opacité .45.
const base =
  "inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-[color,background-color,border-color,scale] duration-150 ease-coory active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-on-accent hover:bg-accent-hover disabled:hover:bg-accent",
  inverse: "bg-inv text-on-inv hover:bg-inv/85 disabled:hover:bg-inv",
  outline: "border border-line-2 text-text hover:bg-surface",
  ghost: "text-muted hover:bg-surface hover:text-text",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[14px] rounded-md",
  md: "h-11 px-[18px] text-[15px] rounded-control",
  lg: "h-[54px] px-6 text-[15px] rounded-wide",
};

export function buttonClass({
  variant = "primary",
  size = "md",
  className = "",
}: { variant?: Variant; size?: Size; className?: string } = {}) {
  return `${base} ${variants[variant]} ${sizes[size]} ${className}`.trim();
}

// Bouton icône seule (§4 IconButton) : 44 × 44, rayon 12, fond surface, filet fin, icône 18.
// Toujours avec un aria-label. Taille sm (36 px) pour les barres compactes (barre du haut mobile).
export function iconButtonClass({ size = "md" }: { size?: "sm" | "md" } = {}) {
  const box = size === "sm" ? "size-9 rounded-md" : "size-11 rounded-control";
  return `${box} relative inline-flex shrink-0 items-center justify-center border border-line bg-surface text-text transition-colors duration-150 hover:bg-surface-2`;
}
