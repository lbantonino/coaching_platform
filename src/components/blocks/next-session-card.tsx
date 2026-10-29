import { ArrowUpRight, CalendarDays, MessageSquare } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { disciplineLabels, disciplineTones } from "@/domain/training/discipline";
import type { WeekBlock } from "@/features/agenda/week";

// Carte « Prochaine séance » du tableau de bord (design system Graphite & Or, §6, demande d'Antonino
// du 29/10/2026) : la séance la plus proche, calculée à partir des vraies séances. Contour et libellé
// or ; heure géante ; nom, détail ; discipline et type ; petites icônes « Ouvrir la séance » et
// « Message ».
const iconLink =
  "inline-flex size-9 items-center justify-center rounded-[9px] border border-line-2 text-text transition-colors duration-150 hover:bg-surface-2 active:bg-surface-2";

function untilLabel(block: WeekBlock, today: string, nowMinutes: number, dayLabel: string) {
  if (block.date !== today) return dayLabel.toLowerCase();
  const minutes = block.start - nowMinutes;
  if (minutes <= 0) return "maintenant";
  if (minutes < 60) return `dans ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `dans ${hours} h${rest > 0 ? ` ${String(rest).padStart(2, "0")}` : ""}`;
}

export function NextSessionCard({
  block,
  rank,
  dayLabel,
  today,
  nowMinutes,
  sessionHref,
  messageHref,
  location,
}: {
  block: WeekBlock | null;
  // Rang de la séance dans sa journée (« 1 / 6 »).
  rank: { index: number; total: number } | null;
  dayLabel: string;
  today: string;
  nowMinutes: number;
  sessionHref: string | null;
  // Séance individuelle : la conversation avec son sportif.
  messageHref: string | null;
  location: string | null;
}) {
  return (
    <section
      aria-labelledby="next-session-title"
      // Toute la carte ouvre la séance (29/10/2026) : le lien du titre la couvre entièrement ;
      // les deux petites icônes passent au-dessus et gardent leur propre action.
      className="relative flex h-full min-w-0 flex-col gap-3 rounded-card border border-accent-line bg-gold-surface p-[18px] transition-colors duration-150 hover:border-accent"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2
          id="next-session-title"
          className="text-[12.5px] font-medium whitespace-nowrap text-accent-text"
        >
          {block && sessionHref ? (
            <Link
              href={sessionHref}
              className="after:absolute after:inset-0 after:rounded-card focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-accent"
            >
              Prochaine séance · {untilLabel(block, today, nowMinutes, dayLabel)}
            </Link>
          ) : (
            <>
              Prochaine séance
              {block ? ` · ${untilLabel(block, today, nowMinutes, dayLabel)}` : ""}
            </>
          )}
        </h2>
        {rank ? (
          <span className="font-mono text-[12px] whitespace-nowrap text-muted tabular">
            {rank.index} / {rank.total}
          </span>
        ) : null}
      </div>

      {block ? (
        <>
          <div className="flex min-w-0 items-center gap-4">
            <span className="font-display text-[36px] leading-none font-semibold tracking-[-0.04em] whitespace-nowrap tabular">
              {block.label.slice(0, 5)}
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-[17px] font-semibold">{block.title}</span>
              <span className="truncate text-[13px] text-muted">
                {[
                  block.individual ? block.subtitle : `Collective · ${block.subtitle}`,
                  `${block.end - block.start} min`,
                  location,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </span>
          </div>
          {/* Discipline et type, puis deux petites icônes (29/10/2026) : ouvrir la séance, écrire au
              sportif. La carte garde ainsi la hauteur des deux autres cartes du haut. */}
          <div className="mt-auto flex flex-wrap items-center gap-2">
            {block.discipline ? (
              <Badge tone={disciplineTones[block.discipline]} dot={false}>
                {disciplineLabels[block.discipline]}
              </Badge>
            ) : null}
            <Badge>{block.individual ? "Individuelle" : "Collective"}</Badge>
            <span className="relative z-10 ml-auto flex gap-1.5">
              {sessionHref ? (
                <Link
                  href={sessionHref}
                  aria-label="Ouvrir la séance"
                  title="Ouvrir la séance"
                  className={iconLink}
                >
                  <ArrowUpRight aria-hidden size={16} strokeWidth={1.9} />
                </Link>
              ) : null}
              {messageHref ? (
                <Link
                  href={messageHref}
                  aria-label={`Écrire à ${block.title}`}
                  title={`Écrire à ${block.title}`}
                  className={iconLink}
                >
                  <MessageSquare aria-hidden size={15} strokeWidth={1.8} />
                </Link>
              ) : null}
            </span>
          </div>
        </>
      ) : (
        <p className="flex items-center gap-2 text-[14px] text-muted">
          <CalendarDays aria-hidden size={16} strokeWidth={1.8} />
          Rien de prévu pour l&apos;instant.
        </p>
      )}
    </section>
  );
}
