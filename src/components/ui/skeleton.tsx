// Chargement (prompt Claude Design §4 « Skeleton ») : barres de 12 px, rayon 6, fond surface-2,
// pulsation d'opacité 1 → .45 en 1,4 s. Composant serveur : utilisable dans les loading.tsx et les
// replis de <Suspense>.
export function SkeletonLines({
  widths = ["40%", "90%", "75%", "60%"],
  label = "Chargement…",
}: {
  widths?: string[];
  label?: string;
}) {
  return (
    <div
      role="status"
      className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4"
    >
      {widths.map((width, index) => (
        <span
          key={index}
          aria-hidden
          style={{ width }}
          className="block h-3 animate-pulse-soft rounded-[6px] bg-surface-2"
        />
      ))}
      <span className="text-[13px] text-muted">{label}</span>
    </div>
  );
}

export function SkeletonBar({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`block h-3 animate-pulse-soft rounded-[6px] bg-surface-2 ${className}`}
    />
  );
}
