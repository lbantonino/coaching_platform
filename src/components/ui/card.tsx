import type { ComponentPropsWithoutRef } from "react";

// Carte : surface + filet fin, rayon 16. « Des bordures, pas des ombres. »
// Les éléments posés DANS une carte utilisent bg-bg (profondeur inversée).
export function Card({ className = "", ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={`rounded-card border border-line bg-surface p-5 sm:p-[22px] ${className}`}
      {...props}
    />
  );
}

// Carte de statistique. `hero` = la seule stat rouge de la ligne (règle du design system) :
// fond rouge et TOUT le texte en blanc.
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
  const box = hero ? "bg-accent border-accent text-on-accent" : "bg-surface border-line text-text";
  const secondary = hero ? "text-on-accent" : "text-muted";
  return (
    <div
      className={`flex flex-col gap-3 rounded-card border p-4 sm:gap-[18px] sm:p-5 ${box} ${className}`}
    >
      <p className="text-small font-medium">{label}</p>
      <p className="text-h1 font-medium tabular sm:text-display">
        {value}
        {unit ? <span className={`ml-1 text-[24px] ${secondary}`}>{unit}</span> : null}
      </p>
      {hint ? <p className={`text-caption ${secondary}`}>{hint}</p> : null}
    </div>
  );
}
