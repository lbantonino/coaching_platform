import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

// Carte chiffrée (prompt Claude Design §4 « KpiCard ») : fond teinté de sa couleur, grand chiffre en
// Space Grotesk, pastille d'icône de 32 px en haut à droite, libellé 14/500, précision 12 grise.
// Cliquable vers son module quand `href` est donné. Grille : 2 × 2 sur téléphone, 4 colonnes sur
// ordinateur (KpiGrid).
export type KpiColor = "accent" | "run" | "ok" | "strength" | "hyrox" | "hybrid" | "warn" | "amber";

export function KpiCard({
  value,
  label,
  detail,
  color,
  icon: Icon,
  href,
  compact = false,
}: {
  value: string;
  label: string;
  detail?: string;
  color: KpiColor;
  icon?: LucideIcon;
  href?: string;
  // Tableau de bord (demande d'Antonino du 26/10) : carte basse et sobre, pour laisser la place à
  // l'agenda : chiffre et pastille sur une ligne, libellé dessous, précision sur ordinateur seulement.
  compact?: boolean;
}) {
  // Les chiffres longs (« 3 240 € ») passent un cran en dessous pour tenir dans la carte.
  const size =
    value.length > 9
      ? "text-[18px] md:text-[20px]"
      : value.length > 7
        ? "text-[18px] md:text-[30px]"
        : "text-[24px] md:text-[30px]";
  const body = compact ? (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-[20px] leading-none font-semibold tracking-[-0.02em] tabular lg:text-[24px]">
          {value}
        </span>
        {Icon ? (
          <span
            aria-hidden
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-[color-mix(in_srgb,var(--kpi)_16%,transparent)] text-[var(--kpi)]"
          >
            <Icon size={14} strokeWidth={1.8} />
          </span>
        ) : null}
      </div>
      <span className="truncate text-[13px] leading-snug font-medium">{label}</span>
      {detail ? (
        <span className="truncate text-[12px] leading-snug text-muted max-lg:hidden">{detail}</span>
      ) : null}
    </>
  ) : (
    <>
      <div className="flex items-start justify-between gap-2">
        <span
          className={`font-display leading-[1.05] font-semibold tracking-[-0.03em] tabular ${size}`}
        >
          {value}
        </span>
        {Icon ? (
          <span
            aria-hidden
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-[color-mix(in_srgb,var(--kpi)_16%,transparent)] text-[var(--kpi)]"
          >
            <Icon size={16} strokeWidth={1.8} />
          </span>
        ) : null}
      </div>
      <span className="text-[14px] leading-snug font-medium">{label}</span>
      {detail ? <span className="text-[12px] leading-snug text-muted">{detail}</span> : null}
    </>
  );
  const className = `flex min-w-0 flex-col rounded-kpi border border-[color-mix(in_srgb,var(--kpi)_30%,transparent)] bg-[color-mix(in_srgb,var(--kpi)_var(--tint-card),var(--surface))] text-text ${
    compact ? "gap-1 px-3.5 py-3" : "gap-1.5 p-4"
  }`;
  const style = { "--kpi": `var(--${color})` } as CSSProperties;
  return href ? (
    <Link
      href={href}
      style={style}
      className={`${className} transition-[scale] duration-150 active:scale-[.98]`}
    >
      {body}
    </Link>
  ) : (
    <div style={style} className={className}>
      {body}
    </div>
  );
}

// Carte chiffrée avec sa liste (Tâches du tableau de bord), façon widget Rappels de l'iPhone.
// Téléphone (mobile first, demande d'Antonino du 24/10) : petite carte, deux par ligne ; en haut le
// libellé en couleur et le nombre total, en dessous les premières lignes de la liste (intitulé seul,
// avec leur rond). Ordinateur : chiffre et pastille, libellé, puis la liste détaillée.
// Seul le bloc chiffré est un lien : la liste a ses propres boutons (CheckList).
export function KpiListCard({
  value,
  label,
  shortLabel,
  color,
  icon: Icon,
  href,
  children,
}: {
  value: string;
  label: string;
  // Titre du petit widget sur téléphone (« Tâches »).
  shortLabel: string;
  color: KpiColor;
  icon: LucideIcon;
  href: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{ "--kpi": `var(--${color})` } as CSSProperties}
      className="flex min-w-0 flex-col gap-0.5 rounded-kpi border border-[color-mix(in_srgb,var(--kpi)_30%,transparent)] bg-[color-mix(in_srgb,var(--kpi)_var(--tint-card),var(--surface))] px-3.5 py-3 text-text"
    >
      <Link
        href={href}
        aria-label={`${value} ${label}`}
        className="flex min-w-0 flex-col gap-1.5 transition-[scale] duration-150 active:scale-[.98]"
      >
        <span className="flex items-center justify-between gap-2 lg:hidden">
          <span className="text-[15px] font-semibold text-[var(--kpi)]">{shortLabel}</span>
          <span className="font-display text-[24px] leading-none font-semibold tabular">
            {value}
          </span>
        </span>
        {/* Ordinateur : chiffre, libellé et pastille sur une ligne (carte basse, 26/10). */}
        <span className="hidden items-center justify-between gap-2 lg:flex">
          <span className="flex min-w-0 items-baseline gap-2">
            <span className="font-display text-[24px] leading-none font-semibold tracking-[-0.02em] tabular">
              {value}
            </span>
            <span className="truncate text-[13px] font-medium">{label}</span>
          </span>
          <span
            aria-hidden
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-[color-mix(in_srgb,var(--kpi)_16%,transparent)] text-[var(--kpi)]"
          >
            <Icon size={14} strokeWidth={1.8} />
          </span>
        </span>
      </Link>
      {children}
    </div>
  );
}

export function KpiGrid({
  label,
  columns = 4,
  children,
}: {
  label: string;
  columns?: 2 | 4 | 5;
  children: ReactNode;
}) {
  const cols = {
    2: "grid-cols-2",
    4: "grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-2 lg:grid-cols-5",
  };
  return (
    <section aria-label={label} className={`grid gap-3 ${cols[columns]}`}>
      {children}
    </section>
  );
}
