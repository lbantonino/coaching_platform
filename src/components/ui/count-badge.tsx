// Pastille chiffrée (D-36), en violet (D-77). « solid » : violet plein, texte blanc, cerclé de la couleur
// de la carte (cloche) ; « soft » : fond violet léger et chiffre violet (compteurs du menu). Décorative pour
// les lecteurs d'écran : le nombre est dit dans le nom du lien.
export function CountBadge({
  count,
  tone = "solid",
  className = "",
}: {
  count: number;
  tone?: "solid" | "soft";
  className?: string;
}) {
  if (count <= 0) return null;
  return (
    <span
      aria-hidden
      className={`inline-flex items-center justify-center tabular ${
        tone === "soft"
          ? "h-5 min-w-5 rounded-[5px] bg-violet-soft-2 px-1.5 text-[11px] text-violet-text"
          : "h-4 min-w-4 rounded-[4px] bg-accent px-1 text-[9px] leading-none font-semibold text-on-accent shadow-[0_0_0_2px_var(--surface)]"
      } ${className}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
