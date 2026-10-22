import type { LucideIcon } from "lucide-react";
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

// Teintes des cartes de statistique non héro (D-25) : filet, fond léger, pastille d'icône et chiffre colorés.
const statTones = {
  neutral: {
    box: "border-line bg-surface",
    icon: "border border-line-2 bg-chip text-muted",
    value: "",
  },
  blue: {
    box: "border-blue/35 bg-[color-mix(in_srgb,var(--blue)_5%,var(--surface))]",
    icon: "border border-blue/50 bg-blue-soft text-blue",
    value: "text-blue",
  },
  amber: {
    box: "border-amber/35 bg-[color-mix(in_srgb,var(--amber)_5%,var(--surface))]",
    icon: "border border-amber/50 bg-amber-soft text-amber",
    value: "text-amber",
  },
  green: {
    box: "border-green/35 bg-[color-mix(in_srgb,var(--green)_5%,var(--surface))]",
    icon: "border border-green/50 bg-green-soft text-green",
    value: "text-green",
  },
} as const;

export type StatTone = keyof typeof statTones;

// Carte de statistique. `hero` = la seule stat rouge de la ligne (règle du design system) :
// fond rouge et TOUT le texte en blanc. Les autres prennent une teinte (`tone`).
export function StatCard({
  label,
  value,
  unit,
  hint,
  icon: Icon,
  tone = "neutral",
  hero = false,
  className = "",
}: {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
  icon?: LucideIcon;
  tone?: StatTone;
  hero?: boolean;
  className?: string;
}) {
  const colors = statTones[tone];
  const box = hero ? "bg-accent border-accent text-on-accent" : `${colors.box} text-text`;
  const secondary = hero ? "text-on-accent" : "text-muted";
  const iconClass = hero
    ? "border border-on-accent/40 bg-on-accent/15 text-on-accent"
    : colors.icon;
  return (
    <div
      className={`flex flex-col gap-3 rounded-card border p-4 sm:gap-[18px] sm:p-5 ${box} ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-small font-medium">{label}</p>
        {Icon ? (
          <span
            aria-hidden
            className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full ${iconClass}`}
          >
            <Icon size={17} strokeWidth={1.75} />
          </span>
        ) : null}
      </div>
      <p
        className={`font-display text-h1 font-medium tabular sm:text-display ${hero ? "" : colors.value}`}
      >
        {value}
        {unit ? <span className={`ml-1 text-[24px] ${secondary}`}>{unit}</span> : null}
      </p>
      {hint ? <p className={`text-caption ${secondary}`}>{hint}</p> : null}
    </div>
  );
}
