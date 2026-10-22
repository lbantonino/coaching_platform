// Avatar à initiales (design system §6 : « CM » sur fond chip, police ≈ 34 % de la taille, poids 600).
// Pas de photo tant qu'aucun stockage d'images n'existe.
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters =
    parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? "?").slice(0, 2);
  return letters.toUpperCase();
}

// `colorClass` : fond teinté (ex. couleur de la discipline, D-24) ; les initiales restent en couleur texte.
export function Avatar({
  name,
  size = "md",
  colorClass = "bg-chip",
}: {
  name: string;
  size?: "md" | "lg";
  colorClass?: string;
}) {
  const box = size === "lg" ? "size-16 text-[22px]" : "size-[34px] text-caption";
  return (
    <span
      aria-hidden
      className={`${box} ${colorClass} inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-text`}
    >
      {initials(name)}
    </span>
  );
}
