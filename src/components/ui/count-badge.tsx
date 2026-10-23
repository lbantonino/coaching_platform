// Pastille rouge chiffrée, comme sur l'iPhone (D-36) : messages non lus sur « Messages » et sur la
// cloche. Décorative pour les lecteurs d'écran : le nombre est dit dans le nom du lien.
export function CountBadge({ count, className = "" }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      aria-hidden
      className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] leading-none font-semibold text-on-accent tabular ${className}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
