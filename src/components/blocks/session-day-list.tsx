import { ListRow } from "@/components/blocks/list-row";
import { Badge } from "@/components/ui/badge";
import { disciplineLabels, disciplineTones } from "@/domain/training/discipline";
import { dayLabel } from "@/features/agenda/calendar";
import type { WeekBlock } from "@/features/agenda/week";
import { formatDuration } from "@/features/sessions/schemas";
import { dayShortLabel, daysBetween } from "@/lib/format";

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

// Séances groupées par jour (demande d'Antonino du 26/10) : « Aujourd'hui » marqué d'une barre or,
// « Demain » d'une barre ambre, les jours suivants en gris ; chaque séance garde la barre de son
// jour, pour voir d'un coup d'œil où s'arrête la journée. Sert aux « Séances à venir » du tableau
// de bord et à la vue Liste de l'Agenda (29/10/2026, qui remplace la page Séances) ; `detailed` :
// le jour en entier (« Aujourd'hui · jeudi 29 octobre ») et la durée sous l'heure.
export function SessionDayList({
  blocks,
  today,
  sessionHref,
  detailed = false,
}: {
  blocks: WeekBlock[];
  today: string;
  sessionHref: (sessionId: string) => string;
  detailed?: boolean;
}) {
  const days = [...new Set(blocks.map((block) => block.date))];
  return (
    <div className={`flex flex-col pt-1 ${detailed ? "gap-5" : "gap-3"}`}>
      {days.map((day) => {
        const gap = daysBetween(today, day);
        const bar = gap === 0 ? "bg-accent" : gap === 1 ? "bg-amber" : "bg-line-2";
        const text = gap === 0 ? "text-accent-text" : gap === 1 ? "text-amber" : "text-muted";
        const near = dayShortLabel(day, today);
        const title = !detailed
          ? near
          : gap === 0 || gap === 1
            ? `${near} · ${dayLabel(day)}`
            : capitalize(dayLabel(day));
        return (
          <section key={day} aria-label={title} className="flex gap-3">
            <span aria-hidden className={`w-1 shrink-0 rounded-pill ${bar}`} />
            <div className="flex min-w-0 flex-1 flex-col">
              <h3 className={`text-[12px] font-semibold tracking-[0.04em] uppercase ${text}`}>
                {title}
              </h3>
              {blocks
                .filter((block) => block.date === day)
                .map((block) => (
                  <ListRow
                    key={block.key}
                    href={sessionHref(block.sessionId)}
                    leading={
                      detailed ? (
                        <span className="flex w-14 shrink-0 flex-col font-mono text-[12px] leading-tight tabular">
                          <span className="text-[14px] font-medium">{block.label.slice(0, 5)}</span>
                          <span className="text-muted">
                            {formatDuration(block.end - block.start)}
                          </span>
                        </span>
                      ) : (
                        <span className="w-12 shrink-0 font-mono text-[14px] font-medium tabular">
                          {block.label.slice(0, 5)}
                        </span>
                      )
                    }
                    title={block.title}
                    sub={block.individual ? block.subtitle : `Collective · ${block.subtitle}`}
                    trailing={
                      <>
                        {detailed && block.moved ? <Badge tone="moved">Déplacée</Badge> : null}
                        {block.discipline ? (
                          <Badge tone={disciplineTones[block.discipline]} dot={false}>
                            {disciplineLabels[block.discipline]}
                          </Badge>
                        ) : null}
                      </>
                    }
                  />
                ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
