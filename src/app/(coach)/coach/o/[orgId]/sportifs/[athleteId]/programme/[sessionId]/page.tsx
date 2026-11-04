import {
  CircleDashed,
  Clock,
  ListChecks,
  MessageSquare,
  Repeat,
  Target,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { disciplineLabels, disciplineStyles, type Discipline } from "@/domain/training/discipline";
import type { ProgramSessionStep } from "@/domain/training/program-session";
import { getAthlete } from "@/features/athletes/queries";
import { requireOrgAccess } from "@/features/auth/guards";
import { getCoachProfile } from "@/features/coach/profile";
import { getProgramSession } from "@/features/programs/queries";
import {
  parseSegment,
  sessionTimeline,
  stepLine,
  stepRole,
  type Timeline,
  type TimelineStep,
} from "@/features/programs/session-display";
import { formatDuration } from "@/features/sessions/schemas";

export const metadata: Metadata = {
  title: "Séance du programme",
};

// Détail d'une séance du programme d'un sportif (D-46), d'après la maquette « Sportifs » du
// 03/11/2026 (page 2d). Ordinateur : la carte de la séance (en-tête, étapes, déroulé en bas) et, à
// droite sur 300 px, le récapitulatif puis le conseil du coach ; le tout jusqu'au bas de l'écran.
// Téléphone : la séance, le récapitulatif, le conseil, l'un sous l'autre. Lecture de la version
// PUBLIÉE, celle que le sportif suit. La validation par le sportif (« Je l'ai faite », ressenti,
// commentaire) arrive avec son espace (tranche 3).
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

// Couleur pleine de chaque discipline (numéro du bloc principal, efforts du déroulé).
const fillVar: Record<Discipline, string> = {
  running: "var(--run-fill)",
  strength: "var(--strength-fill)",
  hyrox: "var(--hyrox-fill)",
  hybrid: "var(--hybrid-fill)",
};
const textVar: Record<Discipline, string> = {
  running: "var(--run)",
  strength: "var(--strength)",
  hyrox: "var(--hyrox)",
  hybrid: "var(--hybrid)",
};
const onFillVar: Record<Discipline, string> = {
  running: "var(--on-run-fill)",
  strength: "var(--on-strength-fill)",
  hyrox: "var(--on-hyrox-fill)",
  hybrid: "var(--on-hybrid-fill)",
};

const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? "s" : ""}`;
const dayMonth = new Intl.DateTimeFormat("fr-BE", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const utc = (day: string) => new Date(`${day}T00:00:00Z`);
// « d'Inès », « de Julien ».
const ofName = (name: string) =>
  /^[aeiouyhàâéèêëîïôöûü]/i.test(name) ? `d'${name}` : `de ${name}`;

// Numéro rond d'une étape (28 px) : noir pour l'échauffement et le retour au calme, couleur de la
// discipline pour les autres.
function StepNumber({ index, colored }: { index: number; colored: boolean }) {
  return (
    <span
      aria-hidden
      className={`grid size-7 shrink-0 place-items-center rounded-full text-[12.5px] font-bold ${
        colored ? "bg-[var(--fill)] text-[var(--on-fill)]" : "bg-text text-surface"
      }`}
    >
      {index}
    </span>
  );
}

// Une étape : fond gris clair ; un bloc répété a un fond teinté de la discipline, « Répéter 5 fois »
// à droite et ses lignes en rangées blanches (barre de couleur : effort plein, récupération pâle).
function Step({ step, index }: { step: ProgramSessionStep; index: number }) {
  const role = stepRole(step);
  if (!step.repeat) {
    return (
      <li className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-x-3.5 gap-y-1 rounded-2xl bg-surface-2 px-5 py-[18px]">
        <StepNumber index={index} colored={role === "main"} />
        <h3 className="text-[16px] leading-5 font-semibold">{step.title}</h3>
        {step.badge ? (
          <span className="text-[14px] leading-[17.5px] font-semibold whitespace-nowrap">
            {step.badge}
          </span>
        ) : (
          <span />
        )}
        {step.lines.map((line) => (
          <p
            key={line}
            className="col-start-2 col-end-4 text-[14px] leading-[1.5] break-words text-text-2"
          >
            {stepLine(line, step.badge)}
          </p>
        ))}
      </li>
    );
  }
  const segments = step.repeat.lines.map(parseSegment);
  return (
    <li className="flex flex-col gap-3 rounded-2xl bg-[color-mix(in_srgb,var(--fill)_9%,var(--surface))] px-[18px] py-4">
      <div className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3.5">
        <StepNumber index={index} colored />
        <h3 className="text-[16px] leading-5 font-semibold">{step.title}</h3>
        <span className="flex items-center gap-1.5 text-[13px] leading-[16.5px] font-semibold whitespace-nowrap text-[var(--fill-text)]">
          <Repeat aria-hidden size={15} strokeWidth={2} />
          Répéter {step.repeat.times} fois
        </span>
      </div>
      {/* Le résumé du bloc (« 5 répétitions de 4 min à 4:55 min/km ») répète les rangées
          dessous : il n'est écrit que si une rangée n'a pas pu être lue. */}
      {segments.every((segment) => segment.value !== null)
        ? null
        : step.lines.map((line) => (
            <p
              key={line}
              className="text-[14px] leading-[1.5] break-words text-text-2 lg:ml-[42px]"
            >
              {stepLine(line, step.badge)}
            </p>
          ))}
      <ul className="flex flex-col gap-1.5 lg:ml-[42px]">
        {segments.map((segment, i) => {
          const line = step.repeat!.lines[i];
          const recovery = segment.kind === "recovery";
          return (
            <li
              key={line}
              className={`grid grid-cols-[4px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-3.5 py-3 ${
                recovery ? "bg-surface/55" : "bg-surface"
              }`}
            >
              <span
                aria-hidden
                className={`h-8 rounded-[2px] ${
                  recovery
                    ? "bg-[color-mix(in_srgb,var(--fill)_40%,var(--surface))]"
                    : "bg-[var(--fill)]"
                }`}
              />
              <span className="flex min-w-0 flex-col gap-px">
                <span className="text-[14.5px] leading-[18px] font-semibold break-words">
                  {segment.label}
                </span>
                {segment.detail ? (
                  <span className="text-[13.5px] leading-[17px] text-text-2">{segment.detail}</span>
                ) : null}
              </span>
              {segment.value ? (
                <span className="text-[14px] leading-[17.5px] font-semibold whitespace-nowrap">
                  {segment.value}
                </span>
              ) : (
                <span />
              )}
            </li>
          );
        })}
      </ul>
    </li>
  );
}

// Un morceau du déroulé : sa largeur suit sa durée (au moins 6 sur ordinateur, 8 sur téléphone,
// pour que sa légende tienne) ; échauffement en pente montante, retour au calme en pente
// descendante, bloc répété en barres (efforts pleins, récupérations basses).
function TimelinePart({ part, last }: { part: TimelineStep; last: boolean }) {
  const { role, step, index } = part;
  const title = `${index} · ${step.badge ?? formatDuration(Math.round(part.minutes))}`;
  const aside = step.repeat
    ? part.recovery
      ? `Récup. ${part.recovery}`
      : null
    : last
      ? null
      : step.title;
  return (
    <div
      style={{ "--f": part.minutes } as CSSProperties}
      className={`flex min-w-0 [flex:max(var(--f),8)_1_0%] flex-col gap-1.5 lg:[flex:max(var(--f),6)_1_0%] ${
        last ? "items-end" : ""
      }`}
    >
      <div aria-hidden className="flex h-[22px] w-full items-end gap-0.5">
        {role === "warmup" ? (
          <span className="h-[60%] w-full rounded-[4px] bg-[var(--effort-easy)] [clip-path:polygon(0_45%,100%_0,100%_100%,0_100%)]" />
        ) : role === "cooldown" ? (
          <span className="h-[45%] w-full rounded-[4px] bg-[var(--effort-easy)] [clip-path:polygon(0_0,100%_50%,100%_100%,0_100%)]" />
        ) : part.bars.length > 0 ? (
          part.bars.map((bar, i) => (
            <span
              key={i}
              style={{ flexGrow: bar.minutes }}
              className={`basis-0 rounded-[3px] ${
                bar.kind === "recovery"
                  ? "h-[32%] bg-[color-mix(in_srgb,var(--fill)_40%,var(--surface))]"
                  : "h-full bg-[var(--fill)]"
              }`}
            />
          ))
        ) : (
          <span className="h-full w-full rounded-[3px] bg-[var(--fill)]" />
        )}
      </div>
      {/* Légende : coupée par « … » si le morceau est trop étroit (jamais sur le morceau voisin). */}
      <span className="flex max-w-full min-w-0 flex-col gap-px overflow-hidden text-[11.5px] leading-[1.35] whitespace-nowrap text-muted lg:flex-row lg:gap-1">
        <b
          className={`truncate font-semibold lg:shrink-0 ${role === "main" ? "text-[var(--fill-text)]" : "text-text"}`}
        >
          {title}
        </b>
        {aside ? <span className="min-w-0 truncate">{aside}</span> : null}
      </span>
    </div>
  );
}

function SessionTimeline({ timeline }: { timeline: Timeline }) {
  const legend = [
    timeline.effort !== null
      ? {
          key: "effort",
          label: timeline.effort ? `Effort · ${timeline.effort}` : "Effort",
          className: "bg-[var(--fill)]",
        }
      : null,
    timeline.recovery !== null
      ? {
          key: "recovery",
          label: timeline.recovery ? `Récup · ${timeline.recovery}` : "Récup",
          className: "bg-[color-mix(in_srgb,var(--fill)_40%,var(--surface))]",
        }
      : null,
    timeline.easy
      ? { key: "easy", label: "Allure facile", className: "bg-[var(--effort-easy)]" }
      : null,
  ].filter((item) => item !== null);
  return (
    <section
      aria-label="Déroulé de la séance"
      className="mt-auto flex flex-col gap-2.5 rounded-[14px] bg-[color-mix(in_srgb,var(--surface-2)_60%,var(--surface))] px-3.5 py-3 inset-ring inset-ring-line-soft"
    >
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5">
        <h2 className="text-[13px] leading-[16.5px] font-semibold whitespace-nowrap">
          Déroulé de la séance
        </h2>
        <span className="text-[12px] leading-[15.5px] font-medium whitespace-nowrap text-muted">
          ≈ {formatDuration(Math.round(timeline.totalMinutes))}
        </span>
        <span aria-hidden className="max-lg:hidden lg:flex-1" />
        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] leading-[14.5px] font-medium text-text-2 max-lg:basis-full">
          {legend.map((item) => (
            <li key={item.key} className="flex items-center gap-[5px] whitespace-nowrap">
              <span aria-hidden className={`size-2 rounded-[2px] ${item.className}`} />
              {item.label}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex gap-1">
        {timeline.steps.map((part, i) => (
          <TimelinePart key={part.index} part={part} last={i === timeline.steps.length - 1} />
        ))}
      </div>
    </section>
  );
}

// Une ligne du récapitulatif : pictogramme dans un carré gris, intitulé, valeur.
function RecapRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-3.5 py-2.5">
      <span
        aria-hidden
        className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-bg text-text-2"
      >
        <Icon size={17} strokeWidth={1.8} />
      </span>
      <div className="flex min-w-0 flex-col gap-px">
        <span className="text-[12.5px] leading-[1.4] whitespace-nowrap text-muted">{label}</span>
        {children}
      </div>
    </div>
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
  const { user, membership } = await requireOrgAccess(orgId);
  const athlete = await getAthlete(membership.organizationId, athleteId);
  if (!athlete) notFound();
  const found = await getProgramSession(membership.organizationId, athlete.id, sessionId);
  // Séance inconnue ou d'un autre sportif : même réponse (404), sans révéler son existence.
  if (!found) notFound();
  const { program, week, session } = found;
  const { content } = session;
  const discipline = content.discipline;
  const athletePath = `/coach/o/${membership.organizationId}/sportifs/${athlete.id}`;
  const timeline = sessionTimeline(content);
  // Les conseils sont signés par le coach qui a créé le programme (sinon le coach connecté).
  const coach = content.coachTips
    ? await getCoachProfile(
        program.createdBy
          ? { id: program.createdBy, email: null }
          : { id: user.id, email: user.email ?? null },
      )
    : null;
  const range = `${dayMonth.format(utc(week.monday))} – ${dayMonth.format(utc(week.sunday))}`;
  // Couleurs de la discipline pour toute la carte : aplat, texte sur l'aplat, texte coloré.
  const colors = {
    "--fill": discipline ? fillVar[discipline] : "var(--violet)",
    "--on-fill": discipline ? onFillVar[discipline] : "var(--on-accent)",
    "--fill-text": discipline ? textVar[discipline] : "var(--violet-text)",
  } as CSSProperties;

  return (
    <>
      <PageHeader
        back={{ href: `${athletePath}?onglet=agenda`, label: athlete.displayName }}
        title={content.title}
        visibleTitle={false}
      />
      <PageBody fill>
        <div className="mx-auto flex w-full max-w-[1600px] min-w-0 flex-col gap-4 max-lg:-mt-0.5 lg:grid lg:flex-1 lg:grid-cols-[minmax(0,1fr)_300px] lg:grid-rows-[minmax(0,1fr)] lg:items-stretch">
          {/* La séance. */}
          <article
            style={colors}
            className="flex min-w-0 flex-col gap-5 rounded-[20px] bg-surface px-4 py-5 inset-ring inset-ring-line-soft lg:p-[26px]"
          >
            <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2.5">
              <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-1.5">
                <p
                  className={`text-[11.5px] leading-[14.5px] font-semibold tracking-[0.08em] uppercase ${
                    discipline ? disciplineStyles[discipline].text : "text-muted"
                  }`}
                >
                  {discipline ? `${disciplineLabels[discipline]} · ` : ""}Séance {session.slotIndex}{" "}
                  sur {week.sessions.length}
                </p>
                {/* Le titre de la page (h1) est dans l'en-tête, lu par les lecteurs d'écran. */}
                <p
                  aria-hidden
                  className="text-[26px] leading-[1.2] font-semibold tracking-[-0.02em] break-words"
                >
                  {content.title}
                </p>
                <p className="text-[13.5px] leading-[1.5] text-muted">
                  Semaine {week.index} · {range} ·{" "}
                  {content.withCoach ? "avec le coach" : `au jour choisi par ${athlete.firstName}`}
                </p>
              </div>
              <span className="text-[13px] leading-[16.5px] font-medium whitespace-nowrap text-muted">
                {plural(content.steps.length, "bloc")} · {formatDuration(content.durationMinutes)}
              </span>
            </div>

            <ol aria-label="Étapes de la séance" className="flex flex-col gap-3">
              {content.steps.map((step, i) => (
                <Step key={`${i}-${step.title}`} step={step} index={i + 1} />
              ))}
            </ol>

            {timeline ? <SessionTimeline timeline={timeline} /> : null}
          </article>

          {/* Récapitulatif et conseil du coach. */}
          <div className="flex min-w-0 flex-col gap-4">
            <section
              aria-labelledby="session-recap-title"
              className="flex flex-col gap-0.5 rounded-[20px] bg-surface p-2 inset-ring inset-ring-line-soft"
            >
              <h2
                id="session-recap-title"
                className="px-3.5 pt-3 pb-1.5 text-[15px] leading-[19px] font-semibold"
              >
                Récapitulatif
              </h2>
              <RecapRow icon={Clock} label="Durée estimée">
                <span className="text-[15px] leading-[19px] font-semibold">
                  {formatDuration(content.durationMinutes)}
                </span>
              </RecapRow>
              <RecapRow icon={ListChecks} label="Type de séance">
                <span className="text-[15px] leading-[19px] font-semibold">
                  {content.sessionType}
                </span>
              </RecapRow>
              {content.objective ? (
                <RecapRow icon={Target} label="Objectif">
                  <span className="text-[15px] leading-[1.35] font-semibold break-words">
                    {content.objective}
                  </span>
                </RecapRow>
              ) : null}
              <RecapRow icon={CircleDashed} label="Suivi">
                <span className="text-[15px] leading-[19px] font-semibold">À faire</span>
                <span className="text-[12px] leading-[1.4] text-muted">
                  Ressenti et commentaire {ofName(athlete.firstName)} ici
                </span>
              </RecapRow>
            </section>

            {content.coachTips && coach ? (
              <section
                aria-labelledby="session-tips-title"
                className="flex flex-col gap-3 rounded-[20px] bg-surface px-[22px] py-5 inset-ring inset-ring-line-soft lg:flex-1"
              >
                <h2
                  id="session-tips-title"
                  className="flex items-center gap-2 text-[15px] leading-[19px] font-semibold"
                >
                  <MessageSquare
                    aria-hidden
                    size={17}
                    strokeWidth={1.8}
                    className="text-violet-text"
                  />
                  Conseil du coach
                </h2>
                <p className="text-[14.5px] leading-[1.6] text-text">{content.coachTips}</p>
                <div className="mt-auto flex items-center gap-2.5 pt-1.5">
                  <span className="flex [&_span]:text-on-inv!">
                    <Avatar
                      name={coach.displayName}
                      size="sm"
                      photoPath={coach.photoPath}
                      colorClass="bg-inv"
                    />
                  </span>
                  <span className="flex flex-col gap-px">
                    <span className="text-[13.5px] leading-[17px] font-semibold whitespace-nowrap">
                      {coach.displayName}
                    </span>
                    <span className="text-[12px] leading-[17.5px] text-muted">Ton coach</span>
                  </span>
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </PageBody>
    </>
  );
}
