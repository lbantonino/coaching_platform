import {
  CircleDashed,
  Clock,
  FileText,
  ListChecks,
  Repeat,
  Target,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { disciplineIcons } from "@/components/ui/discipline-icon";
import { disciplineLabels, disciplineStyles } from "@/domain/training/discipline";
import type { ProgramSessionStep } from "@/domain/training/program-session";
import { getAthlete } from "@/features/athletes/queries";
import { requireOrgAccess } from "@/features/auth/guards";
import { getProgramSession } from "@/features/programs/queries";
import { formatDuration } from "@/features/sessions/schemas";

import { weekRange } from "../../program-weeks";

export const metadata: Metadata = {
  title: "Séance du programme",
};

// Détail d'une séance du programme d'un sportif (D-46, maquette d'Antonino du 26/10) : en-tête
// (discipline, semaine, statut), chiffres clés, étapes numérotées avec leurs blocs répétés, conseils
// du coach. Lecture de la version PUBLIÉE, celle que le sportif suit. La validation par le sportif
// (« Je l'ai faite », ressenti, commentaire) arrive avec son espace (tranche 3).
export default function ProgramSessionPage({
  params,
}: PageProps<"/coach/o/[orgId]/sportifs/[athleteId]/programme/[sessionId]">) {
  return (
    <main className={pageMainClass}>
      <Suspense fallback={<PageLoading />}>
        {params.then(({ orgId, athleteId, sessionId }) => (
          <SessionDetail orgId={orgId} athleteId={athleteId} sessionId={sessionId} />
        ))}
      </Suspense>
    </main>
  );
}

function Figure({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-card border border-line bg-surface p-4">
      <span
        aria-hidden
        className="inline-flex size-9 items-center justify-center rounded-full border border-line-2 bg-chip text-muted"
      >
        <Icon size={16} strokeWidth={1.8} />
      </span>
      <span className="text-[13px] text-muted">{label}</span>
      <span className="text-[16px] leading-snug font-semibold break-words">{value}</span>
    </div>
  );
}

function Step({ step, index, last }: { step: ProgramSessionStep; index: number; last: boolean }) {
  return (
    <li className="relative flex gap-3.5 pb-5 last:pb-0">
      {/* Fil vertical entre les numéros. */}
      {last ? null : (
        <span aria-hidden className="absolute top-9 bottom-0 left-[15px] w-px bg-line" />
      )}
      <span
        aria-hidden
        className="z-[1] inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-line-2 bg-bg font-mono text-[14px] font-semibold tabular"
      >
        {index}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[16px] font-semibold">{step.title}</h3>
          {step.badge ? (
            <span className="shrink-0 rounded-pill bg-chip px-2.5 py-1 font-mono text-[12px] font-medium tabular">
              {step.badge}
            </span>
          ) : null}
        </div>
        {step.lines.map((line) => (
          <p key={line} className="text-small break-words text-muted">
            {line}
          </p>
        ))}
        {step.repeat ? (
          <div className="mt-1 flex gap-3 rounded-[12px] border border-line bg-bg p-3.5">
            <Repeat
              aria-hidden
              size={18}
              strokeWidth={1.8}
              className="mt-0.5 shrink-0 text-accent-text"
            />
            <div className="flex min-w-0 flex-col gap-1">
              <p className="font-medium">Répéter {step.repeat.times} fois</p>
              <ul className="flex list-disc flex-col gap-0.5 pl-4 text-small text-muted">
                {step.repeat.lines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>
    </li>
  );
}

async function SessionDetail({
  orgId,
  athleteId,
  sessionId,
}: {
  orgId: string;
  athleteId: string;
  sessionId: string;
}) {
  const { membership } = await requireOrgAccess(orgId);
  const athlete = await getAthlete(membership.organizationId, athleteId);
  if (!athlete) notFound();
  const found = await getProgramSession(membership.organizationId, athlete.id, sessionId);
  // Séance inconnue ou d'un autre sportif : même réponse (404), sans révéler son existence.
  if (!found) notFound();
  const { week, session } = found;
  const { content } = session;
  const Icon = content.discipline ? disciplineIcons[content.discipline] : ListChecks;
  const styles = content.discipline ? disciplineStyles[content.discipline] : null;
  const athletePath = `/coach/o/${membership.organizationId}/sportifs/${athlete.id}`;

  return (
    <>
      <PageHeader
        back={{ href: `${athletePath}?onglet=agenda`, label: athlete.displayName }}
        title={content.title}
        titleAside={
          <span
            aria-hidden
            className={`inline-flex size-10 shrink-0 items-center justify-center rounded-full ${
              styles ? styles.icon : "border border-line-2 bg-chip text-muted"
            }`}
          >
            <Icon size={18} strokeWidth={2} />
          </span>
        }
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            {content.discipline ? (
              <span
                className={`rounded-pill px-2.5 py-1 text-[12px] font-medium ${styles?.icon ?? ""}`}
              >
                {disciplineLabels[content.discipline]}
              </span>
            ) : null}
            <span className="rounded-pill bg-chip px-2.5 py-1 text-[12px] font-medium text-muted">
              {weekRange(week)} · Séance {session.slotIndex}
            </span>
            <span className="inline-flex items-center gap-1 rounded-pill bg-warn-soft px-2.5 py-1 text-[12px] font-medium text-warn">
              <CircleDashed aria-hidden size={12} strokeWidth={2.2} />À faire
            </span>
          </span>
        }
      />
      <PageBody>
        <div className="grid gap-4 lg:grid-cols-12 lg:items-start">
          <div className="flex min-w-0 flex-col gap-4 lg:col-span-8">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <Figure
                icon={Clock}
                label="Durée estimée"
                value={formatDuration(content.durationMinutes)}
              />
              <Figure icon={ListChecks} label="Type de séance" value={content.sessionType} />
              {content.objective ? (
                <div className="col-span-2 md:col-span-1">
                  <Figure icon={Target} label="Objectif" value={content.objective} />
                </div>
              ) : null}
            </div>

            <section
              aria-labelledby="session-steps-title"
              className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5 md:p-[22px]"
            >
              <h2 id="session-steps-title" className="text-title font-medium">
                Détail de la séance
              </h2>
              <ol aria-label="Étapes de la séance" className="flex flex-col">
                {content.steps.map((step, i) => (
                  <Step
                    key={`${i}-${step.title}`}
                    step={step}
                    index={i + 1}
                    last={i === content.steps.length - 1}
                  />
                ))}
              </ol>
            </section>

            {content.coachTips ? (
              <section
                aria-labelledby="session-tips-title"
                className="flex flex-col gap-3 rounded-card border border-line bg-surface p-5 md:p-[22px]"
              >
                <h2
                  id="session-tips-title"
                  className="flex items-center gap-2.5 text-title font-medium"
                >
                  <FileText aria-hidden size={17} strokeWidth={1.7} className="text-accent-text" />
                  Conseils du coach
                </h2>
                <p className="rounded-[12px] bg-bg p-4 text-small leading-relaxed">
                  {content.coachTips}
                </p>
              </section>
            ) : null}
          </div>

          <aside
            aria-labelledby="session-follow-title"
            className="flex flex-col gap-3 rounded-card border border-line bg-surface p-5 md:p-[22px] lg:col-span-4"
          >
            <h2 id="session-follow-title" className="text-title font-medium">
              Suivi de la séance
            </h2>
            <p className="inline-flex w-fit items-center gap-1.5 rounded-pill bg-warn-soft px-3 py-1.5 text-[13px] font-medium text-warn">
              <CircleDashed aria-hidden size={14} strokeWidth={2.2} />À faire
            </p>
            <p className="text-small text-muted">
              {athlete.firstName} fait cette séance le jour de son choix dans sa semaine (
              {weekRange(week).toLowerCase()}). Depuis son espace, {athlete.firstName} indiquera si
              la séance est faite, son ressenti et un commentaire pour toi : tu le verras ici.
            </p>
          </aside>
        </div>
      </PageBody>
    </>
  );
}
