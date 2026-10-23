import { CalendarDays } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { ListRow } from "@/components/blocks/list-row";
import { NewSessionButton } from "@/components/blocks/new-session-sheet";
import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardEmpty } from "@/components/ui/card";
import { FilterChips } from "@/components/ui/filter-chips";
import { disciplineLabels, disciplineTones } from "@/domain/training/discipline";
import { dayLabel } from "@/features/agenda/calendar";
import { addDays } from "@/features/agenda/items";
import { formatHours, layoutDays } from "@/features/agenda/week";
import { requireCoach } from "@/features/auth/guards";
import { listSessions } from "@/features/sessions/queries";
import { formatDuration } from "@/features/sessions/schemas";
import { dayShortLabel, nowTimeInBrussels, todayIsoInBrussels } from "@/lib/format";

export const metadata: Metadata = {
  title: "Séances",
};

// Page Séances (demande d'Antonino, 23/10, D-35) : TOUTES les séances à venir, collectives et
// individuelles, jour par jour (le tableau de bord n'en montre que les 5 prochaines), et le bouton
// « Nouvelle séance », qui ouvre la même fenêtre que partout ailleurs. Les séances des programmes et
// les retours des sportifs (prévus ici par le prompt, P6) viendront comme un autre onglet.
const WEEKS = 8;
const kinds = [
  { key: "toutes", label: "Toutes" },
  { key: "individuelles", label: "Individuelles" },
  { key: "collectives", label: "Collectives" },
] as const;
type Kind = (typeof kinds)[number]["key"];

export default function SessionsPage({ searchParams }: PageProps<"/coach/seances">) {
  return (
    <main className={pageMainClass}>
      <Suspense fallback={<PageLoading />}>
        {searchParams.then((query) => (
          <Sessions kind={kinds.find((item) => item.key === query.type)?.key ?? "toutes"} />
        ))}
      </Suspense>
    </main>
  );
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

async function Sessions({ kind }: { kind: Kind }) {
  // Garde-fou serveur : connecté ET membre actif d'une organisation, sinon redirection.
  const { memberships } = await requireCoach();
  const organizationId = memberships[0].organizationId;
  const today = todayIsoInBrussels();
  const nowMinutes = toMinutes(nowTimeInBrussels());
  const sessions = (await listSessions(organizationId)).filter(
    (session) =>
      kind === "toutes" || (kind === "individuelles") === (session.kind === "individual"),
  );

  // Les 8 prochaines semaines, à partir de maintenant (les séances déjà passées aujourd'hui en moins).
  const layout = layoutDays(
    sessions,
    Array.from({ length: WEEKS * 7 }, (_, i) => addDays(today, i)),
  );
  const days = layout.days
    .map((day) => ({
      ...day,
      blocks: day.blocks.filter((block) => day.date > today || block.start >= nowMinutes),
    }))
    .filter((day) => day.blocks.length > 0);
  const count = days.reduce((sum, day) => sum + day.blocks.length, 0);
  const minutes = days.reduce(
    (sum, day) => sum + day.blocks.reduce((total, b) => total + (b.end - b.start), 0),
    0,
  );

  return (
    <>
      <PageHeader
        title="Séances"
        subtitle="Toutes tes séances à venir, collectives et individuelles."
        actions={<NewSessionButton />}
      />
      <PageBody>
        <FilterChips
          label="Filtrer les séances"
          options={kinds.map((item) => ({
            href: item.key === "toutes" ? "/coach/seances" : `/coach/seances?type=${item.key}`,
            label: item.label,
            active: item.key === kind,
          }))}
        />
        <Card
          id="upcoming-sessions-title"
          title="À venir"
          subtitle={`${count} séance${count > 1 ? "s" : ""}${count > 0 ? ` · ${formatHours(minutes)}` : ""} sur les ${WEEKS} prochaines semaines`}
        >
          {days.length === 0 ? (
            <CardEmpty icon={CalendarDays}>
              Aucune séance prévue. Ajoute-en une avec « Nouvelle séance ».
            </CardEmpty>
          ) : (
            <div className="flex flex-col gap-5">
              {days.map((day) => {
                const near = dayShortLabel(day.date, today);
                return (
                  <section key={day.date} aria-labelledby={`day-${day.date}`}>
                    <h3
                      id={`day-${day.date}`}
                      className="pb-1 font-mono text-[11px] font-medium tracking-[0.08em] text-muted uppercase"
                    >
                      {near === "Aujourd'hui" || near === "Demain"
                        ? `${near} · ${dayLabel(day.date)}`
                        : capitalize(dayLabel(day.date))}
                    </h3>
                    <ul className="flex flex-col">
                      {day.blocks.map((block) => (
                        <li key={block.key}>
                          <ListRow
                            href={`/coach/o/${organizationId}/agenda/seances/${block.sessionId}`}
                            leading={
                              <span className="flex w-14 shrink-0 flex-col font-mono text-[12px] leading-tight tabular">
                                <span className="text-[14px] font-medium">
                                  {block.label.slice(0, 5)}
                                </span>
                                <span className="text-muted">
                                  {formatDuration(block.end - block.start)}
                                </span>
                              </span>
                            }
                            title={block.title}
                            sub={
                              block.individual ? block.subtitle : `Collective · ${block.subtitle}`
                            }
                            trailing={
                              <>
                                {block.moved ? <Badge tone="moved">Déplacée</Badge> : null}
                                {block.discipline ? (
                                  <Badge tone={disciplineTones[block.discipline]} dot={false}>
                                    {disciplineLabels[block.discipline]}
                                  </Badge>
                                ) : null}
                              </>
                            }
                          />
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}
        </Card>
      </PageBody>
    </>
  );
}
