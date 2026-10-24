import {
  CirclePause,
  Flag,
  MailCheck,
  MessageSquare,
  Plus,
  Search,
  UserPen,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { FilterChips } from "@/components/ui/filter-chips";
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card";
import { SexMark } from "@/components/ui/sex-mark";
import {
  disciplineLabels,
  disciplineStyles,
  disciplineTones,
  type Discipline,
} from "@/domain/training/discipline";
import { completionLabel } from "@/features/athletes/completeness";
import { listAthletes, type AthleteListItem } from "@/features/athletes/queries";
import {
  athleteLevelLabels,
  athleteListFilterSchema,
  athleteStatusLabels,
  type AthleteListFilter,
} from "@/features/athletes/schemas";
import { requireOrgAccess } from "@/features/auth/guards";
import { goalTypeLabels } from "@/features/goals/schemas";
import { todayIsoInBrussels } from "@/lib/format";

import { AthleteRowMenu } from "./athlete-row-menu";

export const metadata: Metadata = {
  title: "Sportifs",
};

// Liste des sportifs (prompt Claude Design §7 `/coach/sportifs`, étape 4a), mobile first : chiffres
// clés, filtres (statut et discipline, dans l'adresse), recherche, et une ligne par sportif : avatar
// ♀ / ♂, nom, niveau, objectif, discipline, prochaine compétition, « ••• ».
// Accès à son espace (demande d'Antonino du 24/10) : plus de libellés « Compte activé / Invitation en
// attente / Sans compte ». Compte activé : icône message (écrire au sportif) et ligne d'un vert très
// léger ; invitation envoyée : icône à côté du nom ; sans compte : seulement « Inviter ».
const statusSlugs = {
  actifs: "active",
  "en-pause": "paused",
  archives: "archived",
  tous: "all",
} as const;
type StatusSlug = keyof typeof statusSlugs;
const slugByStatus = Object.fromEntries(
  Object.entries(statusSlugs).map(([slug, status]) => [status, slug]),
) as Record<AthleteListFilter["status"], StatusSlug>;
const chipLabels: Record<AthleteListFilter["status"], string> = {
  active: "Actifs",
  paused: "En pause",
  archived: "Archivés",
  all: "Tous",
};
const disciplineSlugs = {
  running: "running",
  musculation: "strength",
  hyrox: "hyrox",
  hybride: "hybrid",
} as const satisfies Record<string, Discipline>;
type DisciplineSlug = keyof typeof disciplineSlugs;

export default function AthletesPage({
  params,
  searchParams,
}: PageProps<"/coach/o/[orgId]/sportifs">) {
  return (
    <main className={pageMainClass}>
      {/* Identifiant d'organisation et filtres viennent de l'URL : données de requête, derrière Suspense. */}
      <Suspense fallback={<PageLoading />}>
        {Promise.all([params, searchParams]).then(([{ orgId }, query]) => (
          <AthleteList orgId={orgId} query={query} />
        ))}
      </Suspense>
    </main>
  );
}

const shortDate = new Intl.DateTimeFormat("fr-BE", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const formatShort = (day: string) => shortDate.format(new Date(`${day}T00:00:00Z`));

async function AthleteList({
  orgId,
  query,
}: {
  orgId: string;
  query: Record<string, string | string[] | undefined>;
}) {
  // L'ID de l'URL est vérifié : un ID d'une autre organisation mène à « Accès refusé ».
  const { membership } = await requireOrgAccess(orgId);
  const slug = typeof query.statut === "string" ? query.statut : "actifs";
  const filter = athleteListFilterSchema.parse({
    status: statusSlugs[slug as StatusSlug] ?? "active",
    q: typeof query.q === "string" ? query.q : "",
  });
  const disciplineSlug =
    typeof query.discipline === "string" && query.discipline in disciplineSlugs
      ? (query.discipline as DisciplineSlug)
      : null;
  const discipline = disciplineSlug ? disciplineSlugs[disciplineSlug] : null;

  // Une seule lecture : les chiffres clés portent sur toute l'organisation, la liste sur le filtre.
  const everyone = await listAthletes(membership.organizationId, { status: "all", q: filter.q });
  const all = filter.q
    ? await listAthletes(membership.organizationId, { status: "all", q: "" })
    : everyone;
  const athletes = everyone.filter(
    (athlete) =>
      (filter.status === "all" || athlete.status === filter.status) &&
      (!discipline || athlete.mainDiscipline === discipline),
  );

  const today = todayIsoInBrussels();
  const active = all.filter((athlete) => athlete.status === "active");
  const paused = all.filter((athlete) => athlete.status === "paused");
  const newThisMonth = active.filter((a) => a.createdAt.slice(0, 7) === today.slice(0, 7));
  const competitions = all
    .filter((athlete) => athlete.status !== "archived" && athlete.nextCompetition)
    .map((athlete) => athlete.nextCompetition!)
    .sort((a, b) => a.date.localeCompare(b.date));
  const incomplete = all.filter((a) => a.status !== "archived" && a.missingInfo.length > 0);
  const followed = all.filter((athlete) => athlete.status !== "archived").length;

  const basePath = `/coach/o/${membership.organizationId}/sportifs`;
  const hrefFor = (changes: {
    status?: AthleteListFilter["status"];
    discipline?: string | null;
  }) => {
    const search = new URLSearchParams({ statut: slugByStatus[changes.status ?? filter.status] });
    const nextDiscipline = changes.discipline === undefined ? disciplineSlug : changes.discipline;
    if (nextDiscipline) search.set("discipline", nextDiscipline);
    if (filter.q) search.set("q", filter.q);
    return `${basePath}?${search.toString()}`;
  };

  return (
    <>
      <PageHeader
        title="Sportifs"
        subtitle={`${followed} sportif${followed > 1 ? "s" : ""} · ${active.length} actif${active.length > 1 ? "s" : ""}`}
        actions={
          <Link href={`${basePath}/nouveau`} className={buttonClass()}>
            <Plus aria-hidden size={16} strokeWidth={2} />
            Nouveau sportif
          </Link>
        }
      />
      <PageBody>
        <KpiGrid label="Chiffres des sportifs">
          <KpiCard
            color="run"
            icon={Users}
            value={String(active.length)}
            label={active.length > 1 ? "sportifs actifs" : "sportif actif"}
            detail={
              newThisMonth.length > 0
                ? `+${newThisMonth.length} ce mois-ci`
                : "Aucun nouveau ce mois-ci"
            }
          />
          <KpiCard
            color="warn"
            icon={CirclePause}
            value={String(paused.length)}
            label="en pause"
            detail={
              paused.length > 0
                ? paused
                    .slice(0, 2)
                    .map((athlete) => athlete.displayName.split(" ")[0])
                    .join(", ")
                : "Personne"
            }
          />
          <KpiCard
            color="accent"
            icon={Flag}
            value={String(competitions.length)}
            label={competitions.length > 1 ? "compétitions à venir" : "compétition à venir"}
            detail={competitions[0] ? `Prochaine : ${formatShort(competitions[0].date)}` : "Aucune"}
          />
          <KpiCard
            color="amber"
            icon={UserPen}
            value={String(incomplete.length)}
            label={incomplete.length > 1 ? "fiches à compléter" : "fiche à compléter"}
            detail="Nom ou contact manquant"
          />
        </KpiGrid>

        <div className="flex flex-col gap-3">
          {/* Recherche : formulaire GET classique, les filtres restent dans l'URL. */}
          <form role="search" action={basePath} className="relative">
            <Search
              aria-hidden
              size={15}
              strokeWidth={1.7}
              className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted"
            />
            <label htmlFor="athlete-search" className="sr-only">
              Rechercher un sportif
            </label>
            <input
              id="athlete-search"
              name="q"
              type="search"
              defaultValue={filter.q}
              placeholder="Rechercher un sportif…"
              className="h-11 w-full rounded-control border border-line bg-surface pr-3 pl-10 text-[16px] text-text outline-none placeholder:text-faint focus:border-accent"
            />
            <input type="hidden" name="statut" value={slugByStatus[filter.status]} />
            {disciplineSlug ? (
              <input type="hidden" name="discipline" value={disciplineSlug} />
            ) : null}
          </form>
          <FilterChips
            label="Filtrer par statut"
            options={(["active", "paused", "archived", "all"] as const).map((status) => ({
              href: hrefFor({ status }),
              label: chipLabels[status],
              active: filter.status === status,
            }))}
          />
          <FilterChips
            label="Filtrer par discipline"
            options={(Object.keys(disciplineSlugs) as DisciplineSlug[]).map((key) => ({
              // Un deuxième appui sur la discipline choisie la retire.
              href: hrefFor({ discipline: key === disciplineSlug ? null : key }),
              label: disciplineLabels[disciplineSlugs[key]],
              active: key === disciplineSlug,
            }))}
          />
        </div>

        {athletes.length === 0 ? (
          <div
            role="status"
            className="flex flex-col items-start gap-3 rounded-card border border-dashed border-line-2 p-6 text-muted"
          >
            <p>
              {filter.q
                ? `Aucun sportif ne correspond à « ${filter.q} ».`
                : all.length === 0
                  ? "Ajoute ton premier sportif : il apparaîtra ici avec son objectif et sa prochaine compétition."
                  : "Aucun sportif dans cette catégorie."}
            </p>
            {all.length === 0 ? (
              <Link href={`${basePath}/nouveau`} className={buttonClass({ variant: "outline" })}>
                Ajouter mon premier sportif
              </Link>
            ) : null}
          </div>
        ) : (
          <ul
            className="flex flex-col overflow-hidden rounded-card border border-line bg-surface"
            aria-label="Liste des sportifs"
          >
            {athletes.map((athlete) => (
              <AthleteRow key={athlete.id} athlete={athlete} basePath={basePath} />
            ))}
          </ul>
        )}
      </PageBody>
    </>
  );
}

function AthleteRow({ athlete, basePath }: { athlete: AthleteListItem; basePath: string }) {
  const href = `${basePath}/${athlete.id}`;
  const canInvite = !athlete.hasAccount && athlete.status !== "archived";
  const goal = athlete.mainGoal
    ? (athlete.mainGoal.competitionName ?? goalTypeLabels[athlete.mainGoal.type])
    : null;
  const sub = [athlete.level ? athleteLevelLabels[athlete.level] : null, goal]
    .filter(Boolean)
    .join(" · ");
  return (
    <li
      className={`flex flex-col gap-3 border-b border-line p-4 last:border-b-0 lg:flex-row lg:items-center lg:gap-4 ${
        // Compte activé dans son espace : un vert très léger (demande d'Antonino).
        athlete.hasAccount ? "bg-[color-mix(in_srgb,var(--ok)_8%,var(--surface))]" : ""
      }`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Link
          href={href}
          className="flex min-w-0 items-center gap-3 rounded-[10px] hover:text-text"
        >
          {/* Avatar à la couleur de la discipline de l'objectif principal (D-24, D-25). */}
          <Avatar
            name={athlete.displayName}
            colorClass={
              athlete.mainDiscipline ? disciplineStyles[athlete.mainDiscipline].avatar : undefined
            }
            photoPath={athlete.photoPath}
          />
          <span className="flex min-w-0 flex-col">
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate font-medium">{athlete.displayName}</span>
              <SexMark sex={athlete.sex} size="sm" />
              {athlete.hasPendingInvite && !athlete.hasAccount ? (
                <span
                  title="Invitation envoyée, en attente"
                  className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-warn-soft text-warn"
                >
                  <MailCheck aria-hidden size={13} strokeWidth={2} />
                  <span className="sr-only">Invitation envoyée</span>
                </span>
              ) : null}
              {/* Fiche créée d'un simple nom (D-35) : le repère reste jusqu'à ce qu'elle soit complétée. */}
              {athlete.missingInfo.length > 0 ? (
                <span
                  title={completionLabel(athlete.missingInfo)}
                  className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-warn-soft text-warn"
                >
                  <UserPen aria-hidden size={13} strokeWidth={2} />
                  {/* Texte masqué plutôt qu'aria-label : le détail est dans l'infobulle. */}
                  <span className="sr-only">Fiche à compléter</span>
                </span>
              ) : null}
            </span>
            <span className="truncate text-[13px] text-muted">
              {sub || athleteStatusLabels[athlete.status]}
            </span>
          </span>
        </Link>
        {athlete.hasAccount ? (
          <Link
            href={`/coach/messages?sportif=${athlete.id}`}
            aria-label={`Écrire à ${athlete.displayName}`}
            title="Compte activé : écrire un message"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-ok-soft text-ok transition-colors duration-150 hover:bg-ok hover:text-surface"
          >
            <MessageSquare aria-hidden size={14} strokeWidth={2} />
          </Link>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2 pl-[52px] lg:w-[340px] lg:flex-nowrap lg:justify-end lg:pl-0">
        {athlete.mainDiscipline ? (
          <Badge tone={disciplineTones[athlete.mainDiscipline]}>
            {disciplineLabels[athlete.mainDiscipline]}
          </Badge>
        ) : null}
        {athlete.status !== "active" ? (
          <StatusBadge label={athleteStatusLabels[athlete.status]} />
        ) : null}
        {athlete.nextCompetition ? (
          <span
            title={athlete.nextCompetition.name}
            className="inline-flex items-center gap-1 font-mono text-[12px] text-muted tabular"
          >
            <Flag aria-hidden size={12} strokeWidth={2} className="text-accent-text" />
            {formatShort(athlete.nextCompetition.date)}
          </span>
        ) : null}
        <span className="ml-auto flex items-center gap-2">
          {canInvite ? (
            <Link
              href={`${href}/inviter`}
              className={buttonClass({ variant: "outline", size: "sm" })}
              aria-label={`Inviter ${athlete.displayName}`}
            >
              Inviter
            </Link>
          ) : null}
          <AthleteRowMenu
            name={athlete.displayName}
            editHref={`${href}?onglet=profil`}
            inviteHref={canInvite ? `${href}/inviter` : null}
          />
        </span>
      </div>
    </li>
  );
}
