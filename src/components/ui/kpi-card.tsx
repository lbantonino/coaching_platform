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
}: {
  value: string;
  label: string;
  detail?: string;
  color: KpiColor;
  icon?: LucideIcon;
  href?: string;
}) {
  // Les chiffres longs (« 3 240 € ») passent un cran en dessous pour tenir dans la carte.
  const size =
    value.length > 9
      ? "text-[18px] md:text-[20px]"
      : value.length > 7
        ? "text-[18px] md:text-[30px]"
        : "text-[24px] md:text-[30px]";
  const body = (
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
  const className =
    "flex min-w-0 flex-col gap-1.5 rounded-kpi border border-[color-mix(in_srgb,var(--kpi)_30%,transparent)] bg-[color-mix(in_srgb,var(--kpi)_var(--tint-card),var(--surface))] p-4 text-text";
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

// Carte chiffrée avec sa liste (Tâches, Messages du tableau de bord), façon widget de l'iPhone.
// Téléphone : pleine largeur, pastille en haut à gauche, chiffre et libellé en bas, liste à droite.
// Ordinateur : une colonne de la grille, chiffre et pastille en haut, liste en dessous. Seul le bloc
// chiffré est un lien vers le module : la liste a ses propres boutons (CheckList).
export function KpiListCard({
  value,
  label,
  color,
  icon: Icon,
  href,
  children,
}: {
  value: string;
  label: string;
  color: KpiColor;
  icon: LucideIcon;
  href: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{ "--kpi": `var(--${color})` } as CSSProperties}
      className="col-span-2 flex min-w-0 gap-3 rounded-kpi border border-[color-mix(in_srgb,var(--kpi)_30%,transparent)] bg-[color-mix(in_srgb,var(--kpi)_var(--tint-card),var(--surface))] p-4 text-text lg:col-span-1 lg:flex-col lg:gap-1"
    >
      <Link
        href={href}
        className="flex w-[92px] shrink-0 flex-col gap-1.5 transition-[scale] duration-150 active:scale-[.98] lg:w-auto"
      >
        <span className="flex flex-1 flex-col-reverse items-start justify-between gap-3 lg:flex-row lg:gap-2">
          <span className="font-display text-[24px] leading-[1.05] font-semibold tracking-[-0.03em] tabular md:text-[30px]">
            {value}
          </span>
          <span
            aria-hidden
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-[color-mix(in_srgb,var(--kpi)_16%,transparent)] text-[var(--kpi)]"
          >
            <Icon size={16} strokeWidth={1.8} />
          </span>
        </span>
        <span className="text-[14px] leading-snug font-medium">{label}</span>
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
