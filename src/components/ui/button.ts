// Boutons du design system Athlix : aplats, sans dégradé ni ombre.
// primary = action principale (orange, une seule par zone) · secondary = action forte neutre (clair)
// outline = action secondaire · ghost = action discrète (Annuler).
// Tailles : sm 32 px · md 38 px · lg 52 px (mobile, cibles tactiles).

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-hover disabled:hover:bg-accent",
  secondary: "bg-text text-page hover:bg-white",
  outline: "border border-line-2 text-text hover:bg-surface-2",
  ghost: "text-muted hover:text-text",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-caption rounded-[7px]",
  md: "h-[38px] px-4 text-small rounded-[9px]",
  lg: "h-[52px] px-6 text-title rounded-[12px]",
};

export function buttonClass({
  variant = "primary",
  size = "md",
  className = "",
}: { variant?: Variant; size?: Size; className?: string } = {}) {
  return `${base} ${variants[variant]} ${sizes[size]} ${className}`.trim();
}
