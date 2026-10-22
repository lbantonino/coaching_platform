// Boutons du design system Coory (§6) : aplats, sans dégradé ni ombre, uniquement des jetons.
// primary = action principale (rouge, UNE seule par écran) · inverse = action forte neutre (clair sur sombre)
// outline = action secondaire · ghost = action discrète (Annuler).
// Tailles : sm 32 px · md 38 px (ordinateur) · lg 52 px (bouton principal sur téléphone).

type Variant = "primary" | "inverse" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

// Appui = léger enfoncement (scale .98), sans rebond. Désactivé = opacité .4.
const base =
  "inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-[color,background-color,border-color,scale] duration-150 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-on-accent hover:bg-accent-hover disabled:hover:bg-accent",
  inverse: "bg-inv text-on-inv hover:bg-inv/85 disabled:hover:bg-inv",
  outline: "border border-line-2 text-text hover:bg-surface-2",
  ghost: "text-muted hover:bg-surface-2 hover:text-text",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-caption rounded-[8px]",
  md: "h-[38px] px-4 text-small rounded-md",
  lg: "h-[52px] px-6 text-title rounded-[14px]",
};

export function buttonClass({
  variant = "primary",
  size = "md",
  className = "",
}: { variant?: Variant; size?: Size; className?: string } = {}) {
  return `${base} ${variants[variant]} ${sizes[size]} ${className}`.trim();
}

// Bouton icône seule (§6 IconButton) : 38 × 38, fond surface, filet fin. Toujours avec un aria-label.
export function iconButtonClass({ size = "md" }: { size?: "sm" | "md" } = {}) {
  const box = size === "sm" ? "size-8 rounded-[8px]" : "size-[38px] rounded-md";
  return `${box} inline-flex shrink-0 items-center justify-center border border-line bg-surface text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-text`;
}
