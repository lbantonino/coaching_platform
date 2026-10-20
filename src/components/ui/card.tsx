import type { ComponentPropsWithoutRef } from "react";

// Carte : surface + filet fin. « Les bordures fines définissent les cartes, pas les ombres. »
export function Card({ className = "", ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div className={`rounded-[14px] border border-line bg-surface p-5 ${className}`} {...props} />
  );
}

// Carte de statistique. `hero` = la seule stat orange de la ligne (règle du design system).
export function StatCard({
  label,
  value,
  unit,
  hint,
  hero = false,
  className = "",
}: {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
  hero?: boolean;
  className?: string;
}) {
  const box = hero ? "bg-accent border-accent text-white" : "bg-surface border-line text-text";
  const secondary = hero ? "text-white/85" : "text-muted";
  return (
    <div
      className={`flex flex-col gap-2 rounded-[16px] border p-4 sm:gap-3 sm:p-5 ${box} ${className}`}
    >
      <p className="text-small font-medium">{label}</p>
      <p className="text-h1 font-medium tabular sm:text-display">
        {value}
        {unit ? <span className={`ml-1 text-h3 ${secondary}`}>{unit}</span> : null}
      </p>
      {hint ? <p className={`text-small ${secondary}`}>{hint}</p> : null}
    </div>
  );
}
