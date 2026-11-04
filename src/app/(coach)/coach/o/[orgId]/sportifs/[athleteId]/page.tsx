import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

import { PageBody, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { disciplineStyles } from "@/domain/training/discipline";
import { listAthleteActivity } from "@/features/activity/queries";
import { addDays, buildAgendaItems, type AgendaItem } from "@/features/agenda/items";
import { mondayOf, parseDay } from "@/features/agenda/week";
import { getAthlete } from "@/features/athletes/queries";
import { requireOrgAccess } from "@/features/auth/guards";
import { listGoals } from "@/features/goals/queries";
import { goalDiscipline, goalTypeLabels } from "@/features/goals/schemas";
import { getAthleteNotes } from "@/features/notes/queries";
import { listReferences } from "@/features/references/queries";
import { getAthleteProgram } from "@/features/programs/queries";
import { listSessions } from "@/features/sessions/queries";
import { removeAthletePhoto, uploadAthletePhoto } from "@/features/photos/actions";
import { todayIsoInBrussels } from "@/lib/format";

import { PhotoForm } from "../../../../photo-form";

import {
  AGENDA_VIEWS,
  agendaRange,
  AthleteAgendaSection,
  AthleteProgramSection,
  type AgendaView,
} from "./athlete-agenda";
import { AthleteEditForm } from "./athlete-edit-form";
import { ProgramWeeksSection, type ProgramView } from "./program-weeks";
import { AthleteDocuments } from "./athlete-documents";
import { ActivityTimeline } from "./activity-timeline";
import { AthleteHeader, AthleteIdentity } from "./athlete-header";
import { AvailabilitySection } from "./availability-section";
import { GoalsSection } from "./goals-section";
import { NotesSection } from "./notes-section";
import { AthleteOverview } from "./overview";
import { RecordsSection } from "./records-section";
import { ReferencesSection } from "./references-section";

export const metadata: Metadata = {
  title: "Fiche sportif",
};

// Onglets de la fiche (P2-04). L'onglet est dans l'adresse (?onglet=…) ; une valeur inconnue
// retombe sur la vue d'ensemble.
// Ordre de la maquette « Sportifs », choisi par Antonino le 03/11/2026 (il remplace celui du 26/10).
const TABS = [
  { key: "vue", label: "Vue d'ensemble" },
  { key: "profil", label: "Profil" },
  { key: "agenda", label: "Agenda" },
  { key: "programme", label: "Programme" },
  { key: "objectifs", label: "Objectifs" },
  { key: "reperes", label: "Repères" },
  { key: "disponibilites", label: "Disponibilités" },
  { key: "notes", label: "Notes" },
  // Documents liés au sportif (D-67).
  { key: "documents", label: "Documents" },
  { key: "historique", label: "Historique" },
] as const;
type TabKey = (typeof TABS)[number]["key"];
const tabSchema = z.enum(TABS.map((tab) => tab.key) as [TabKey, ...TabKey[]]).catch("vue");
// Vue de l'onglet Agenda (?vue=jour|semaine|mois, la semaine par défaut) et jour affiché (?date=).
const agendaViewSchema = z.enum(AGENDA_VIEWS).catch("semaine");

type Sessions = Awaited<ReturnType<typeof listSessions>>;
type Goals = Awaited<ReturnType<typeof listGoals>>["current"];

// Compétitions à venir du sportif (objectifs en cours avec un nom et une date), pour l'agenda.
function competitionEvents(goals: Goals, athlete: { id: string; name: string }) {
  return goals.flatMap((goal) =>
    goal.competitionName && goal.targetDate
      ? [
          {
            id: goal.id,
            date: goal.targetDate,
            athleteId: athlete.id,
            athleteName: athlete.name,
            title: goal.competitionName,
            detail: [goalTypeLabels[goal.type], goal.competitionLocation]
              .filter(Boolean)
              .join(" · "),
            discipline: goalDiscipline(goal.type),
            achieved: false,
          },
        ]
      : [],
  );
}

// Carte « Prochaines séances » : 4 séances encadrées au plus sur 30 jours, et la prochaine
// compétition, toujours visible même quand les séances hebdomadaires remplissent la liste.
function upcomingFor(
  sessions: Sessions,
  goals: Goals,
  athlete: { id: string; name: string },
  today: string,
): AgendaItem[] {
  const filter = { discipline: null, athleteId: athlete.id };
  const nextSessions = buildAgendaItems(sessions, [], today, addDays(today, 30), filter).slice(
    0,
    4,
  );
  const nextCompetition = buildAgendaItems(
    [],
    competitionEvents(goals, athlete),
    today,
    addDays(today, 730),
    filter,
  ).slice(0, 1);
  return [...nextSessions, ...nextCompetition].sort((a, b) => a.date.localeCompare(b.date));
}

function groupByMonday(items: AgendaItem[]): Map<string, AgendaItem[]> {
  const weeks = new Map<string, AgendaItem[]>();
  for (const item of items) {
    const monday = mondayOf(item.date);
    weeks.set(monday, [...(weeks.get(monday) ?? []), item]);
  }
  return weeks;
}

// Onglet « Agenda » : tout ce qui concerne le sportif sur la période de la vue choisie.
function agendaFor(
  sessions: Sessions,
  goals: Goals,
  athlete: { id: string; name: string },
  range: { from: string; to: string },
): AgendaItem[] {
  return buildAgendaItems(sessions, competitionEvents(goals, athlete), range.from, range.to, {
    discipline: null,
    athleteId: athlete.id,
  });
}

export default function AthletePage({
  params,
  searchParams,
}: PageProps<"/coach/o/[orgId]/sportifs/[athleteId]">) {
  return (
    <main className={pageMainClass}>
      <Suspense fallback={<PageLoading />}>
        {Promise.all([params, searchParams]).then(([{ orgId, athleteId }, query]) => (
          <AthleteSection
            orgId={orgId}
            athleteId={athleteId}
            tab={tabSchema.parse(query.onglet)}
            agendaView={agendaViewSchema.parse(query.vue)}
            agendaDate={typeof query.date === "string" ? query.date : undefined}
            programView={query.vue === "toutes" ? "toutes" : "semaine"}
            programWeek={
              typeof query.semaine === "string" ? Number.parseInt(query.semaine, 10) || null : null
            }
            creationIncomplete={query.creation === "incomplete"}
          />
        ))}
      </Suspense>
    </main>
  );
}

async function AthleteSection({
  orgId,
  athleteId,
  tab,
  agendaView,
  agendaDate,
  programView,
  programWeek,
  creationIncomplete,
}: {
  orgId: string;
  athleteId: string;
  tab: TabKey;
  agendaView: AgendaView;
  agendaDate: string | undefined;
  // Agenda d'un sportif avec programme (maquette 2c) : une semaine (?semaine=…) ou toutes (?vue=toutes).
  programView: ProgramView;
  programWeek: number | null;
  // Page « Nouveau sportif » (D-54) : la fiche est créée, mais son objectif ou son accord santé
  // n'a pas pu être enregistré.
  creationIncomplete: boolean;
}) {
  const { membership } = await requireOrgAccess(orgId);
  const athlete = await getAthlete(membership.organizationId, athleteId);
  // ID inconnu ou d'une autre organisation : même réponse (404), sans révéler son existence.
  if (!athlete) notFound();

  const organizationId = membership.organizationId;
  const listPath = `/coach/o/${organizationId}/sportifs`;
  const basePath = `${listPath}/${athlete.id}`;
  const today = todayIsoInBrussels();
  const { current: goals } = await listGoals(organizationId, athlete.id);
  const agendaDay = parseDay(agendaDate, today);
  const program =
    tab === "agenda" || tab === "programme"
      ? await getAthleteProgram(organizationId, athlete.id)
      : null;

  return (
    <>
      <AthleteHeader athlete={athlete} organizationId={organizationId} listPath={listPath} />
      <PageBody>
        {/* La fiche : 1600 px au plus, centrée (maquette « Sportifs » : très grands écrans) ; téléphone :
            16 px sous la barre, comme la maquette. */}
        <div className="mx-auto flex w-full max-w-[1600px] min-w-0 flex-col gap-3.5 max-lg:-mt-0.5">
          <AthleteIdentity
            athlete={athlete}
            organizationId={organizationId}
            listPath={listPath}
            invitePath={`${basePath}/inviter`}
            tabs={TABS.map((item) => ({
              key: item.key,
              href: item.key === "vue" ? basePath : `${basePath}?onglet=${item.key}`,
              label: item.label,
              active: item.key === tab,
            }))}
          />
          {creationIncomplete ? (
            <p
              role="alert"
              className="rounded-wide border border-warn/50 bg-warn-soft p-4 text-[14px]"
            >
              La fiche est créée, mais son objectif ou son accord santé n&apos;a pas pu être
              enregistré. Ajoute-les depuis les onglets Objectifs et Profil.
            </p>
          ) : null}
          {tab === "vue" ? (
            <AthleteOverview
              athlete={athlete}
              goals={goals}
              references={(await listReferences(organizationId, athlete.id)).current}
              notes={await getAthleteNotes(organizationId, athlete.id)}
              activity={await listAthleteActivity(organizationId, athlete)}
              // Prochaines séances encadrées avec ce sportif (4 au plus, sur 30 jours) et sa prochaine
              // compétition, toujours visible même quand les séances hebdomadaires remplissent la liste.
              upcoming={upcomingFor(
                await listSessions(organizationId),
                goals,
                { id: athlete.id, name: athlete.displayName },
                today,
              )}
              agendaPath={`/coach/o/${organizationId}/agenda`}
              today={today}
              basePath={basePath}
            />
          ) : tab === "profil" ? (
            // Onglet Profil (maquette « Sportifs » du 03/11/2026, page 2b) : la carte photo, puis la
            // carte Informations, en pleine largeur.
            <div className="flex flex-col gap-4">
              <section
                aria-labelledby="photo-title"
                className="rounded-[20px] bg-surface px-[22px] py-[18px] inset-ring inset-ring-line-soft"
              >
                <PhotoForm
                  look="fiche"
                  name={athlete.displayName}
                  photoPath={athlete.photoPath}
                  colorClass={
                    athlete.programType ? disciplineStyles[athlete.programType].avatar : undefined
                  }
                  upload={uploadAthletePhoto.bind(null, organizationId, athlete.id)}
                  remove={removeAthletePhoto.bind(null, organizationId, athlete.id)}
                />
              </section>
              <section
                aria-labelledby="infos-title"
                className="flex flex-col gap-4 rounded-[20px] bg-surface p-[22px] inset-ring inset-ring-line-soft"
              >
                <h2
                  id="infos-title"
                  className="text-[17px] leading-[21.5px] font-semibold tracking-[-0.01em]"
                >
                  Informations
                </h2>
                <AthleteEditForm
                  organizationId={organizationId}
                  athleteId={athlete.id}
                  hasAccount={athlete.hasAccount}
                  values={{
                    firstName: athlete.firstName,
                    lastName: athlete.lastName ?? "",
                    sex: athlete.sex ?? "",
                    email: athlete.email ?? "",
                    phone: athlete.phone ?? "",
                    status: athlete.status,
                    preferredContact: athlete.preferredContact ?? "",
                    level: athlete.level ?? "",
                    experience: athlete.experience ?? "",
                    trainingPlaces: athlete.trainingPlaces,
                    equipment: athlete.equipment ?? "",
                    addressLine: athlete.addressLine ?? "",
                    postalCode: athlete.postalCode ?? "",
                    city: athlete.city ?? "",
                    country: athlete.country,
                  }}
                />
              </section>
            </div>
          ) : tab === "reperes" ? (
            // Onglet Repères (maquette « Sportifs », page 2g) : pleine largeur, deux cartes.
            <div className="flex flex-col gap-4">
              <ReferencesSection
                organizationId={organizationId}
                athleteId={athlete.id}
                today={today}
              />
              <RecordsSection
                organizationId={organizationId}
                athleteId={athlete.id}
                today={today}
              />
            </div>
          ) : tab === "objectifs" ? (
            // Onglet Objectifs (maquette « Sportifs », page 2f) : pleine largeur, deux cartes.
            <GoalsSection organizationId={organizationId} athleteId={athlete.id} today={today} />
          ) : tab === "agenda" ? (
            program ? (
              <ProgramWeeksSection
                name={athlete.firstName}
                sex={athlete.sex}
                view={programView}
                requestedWeek={programWeek}
                program={program}
                today={today}
                basePath={basePath}
                agendaPath={`/coach/o/${organizationId}/agenda`}
                coachItemsByMonday={groupByMonday(
                  agendaFor(
                    await listSessions(organizationId),
                    goals,
                    { id: athlete.id, name: athlete.displayName },
                    {
                      from: program.weeks[0].monday,
                      to: program.weeks[program.weeks.length - 1].sunday,
                    },
                  ),
                )}
              />
            ) : (
              // Pas encore de programme : l'agenda de ce qui a un jour (séances avec le coach,
              // compétitions), en trois vues.
              <div className="flex w-full max-w-3xl flex-col gap-6">
                <AthleteAgendaSection
                  name={athlete.firstName}
                  view={agendaView}
                  date={agendaDay}
                  today={today}
                  items={agendaFor(
                    await listSessions(organizationId),
                    goals,
                    { id: athlete.id, name: athlete.displayName },
                    agendaRange(agendaView, agendaDay),
                  )}
                  basePath={basePath}
                  agendaPath={`/coach/o/${organizationId}/agenda`}
                  goalsHref={`${basePath}?onglet=objectifs`}
                />
              </div>
            )
          ) : tab === "programme" ? (
            <div className="flex w-full max-w-3xl flex-col gap-6">
              <AthleteProgramSection
                name={athlete.firstName}
                program={program}
                agendaHref={`${basePath}?onglet=agenda`}
              />
            </div>
          ) : (
            // Les onglets de saisie gardent une largeur de lecture confortable.
            <div className="flex w-full max-w-3xl flex-col gap-6">
              {tab === "disponibilites" ? (
                <AvailabilitySection organizationId={organizationId} athlete={athlete} />
              ) : null}
              {tab === "notes" ? (
                <NotesSection organizationId={organizationId} athlete={athlete} />
              ) : null}
              {tab === "documents" ? (
                <AthleteDocuments
                  organizationId={organizationId}
                  athleteId={athlete.id}
                  athleteName={athlete.displayName}
                />
              ) : null}
              {tab === "historique" ? (
                <section
                  aria-labelledby="history-title"
                  className="flex flex-col gap-5 rounded-card border border-line bg-surface p-5 md:p-[22px]"
                >
                  <div className="flex flex-col gap-1">
                    <h2 id="history-title" className="text-title font-medium">
                      Historique
                    </h2>
                    <p className="text-small text-muted">
                      Tout ce qui s&apos;est passé sur cette fiche, du plus récent au plus ancien.
                    </p>
                  </div>
                  <ActivityTimeline
                    events={await listAthleteActivity(organizationId, athlete)}
                    label="Historique de la fiche"
                  />
                </section>
              ) : null}
            </div>
          )}
        </div>
      </PageBody>
    </>
  );
}
