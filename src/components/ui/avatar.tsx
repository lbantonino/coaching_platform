// Avatar à initiales (design system : « CM »). Pas de photo tant qu'aucun stockage d'images n'existe.
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters =
    parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? "?").slice(0, 2);
  return letters.toUpperCase();
}

export function Avatar({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  const box = size === "lg" ? "size-14 text-title" : "size-9 text-caption";
  return (
    <span
      aria-hidden
      className={`${box} inline-flex shrink-0 items-center justify-center rounded-full border border-line-2 bg-surface-2 font-medium text-text`}
    >
      {initials(name)}
    </span>
  );
}
