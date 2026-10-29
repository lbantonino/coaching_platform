import { CirclePause, Flag, LayoutGrid, Plus, Search, UserPen, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { buttonClass } from "@/components/ui/button";
import { chipActiveClass, chipClass, chipIdleClass } from "@/components/ui/chip";
import { disciplineIcons } from "@/components/ui/discipline-icon";
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card";
import {
  DISCIPLINES,
  disciplineLabels,
  disciplineStyles,
  type Discipline,
} from "@/domain/training/discipline";
import { completionLabel } from "@/features/athletes/completeness";
import { listAthletes, type AthleteListItem } from "@/features/athletes/queries";
import {
  athleteLevelLabels,
  athleteListFilterSchema,
  type AthleteListFilter,
} from "@/features/athletes/schemas";
import { requireOrgAccess } from "@/features/auth/guards";
import { goalTypeLabels } from "@/features/goals/schemas";
import { todayIsoInBrussels } from "@/lib/format";

import { AthleteTable, type AthleteTableRow, type SortColumn } from "./athlete-table";
import { CompactFilter } from "./compact-filter";

export const metadata: Metadata = {
  title: "Sportifs",
};

// Liste des sportifs (prompt Claude Design §7 `/coach/sportifs`, étape 4a), d'après la maquette
// d'Antonino du 24/10 (D-40) : chiffres clés, recherche, filtres Statut et Type de programme (dans
// l'adresse), puis le tableau (cartes sur téléphone) où statut et type se changent d'un appui.
const statusSlugs = {
  tous: "all",
  actifs: "active",
  "en-pause": "paused",
  archives: "archived",
} as const;
type StatusSlug = keyof typeof statusSlugs;
const slugByStatus = Object.fromEntries(
  Object.entries(statusSlugs).map(([slug, status]) => [status, slug]),
) as Record<AthleteListFilter["status"], StatusSlug>;
const statusChips: { status: AthleteListFilter["status"]; label: string; dot: string | null }[] = [
  { status: "all", label: "Tous", dot: null },
  { status: "active", label: "Actifs", dot: "bg-ok" },
  { status: "paused", label: "En pause", dot: "bg-warn" },
  { status: "archived", label: "Archivés", dot: "bg-faint" },
];
const disciplineSlugs = {
  running: "running",
  musculation: "strength",
  hyrox: "hyrox",
  hybride: "hybrid",
} as const satisfies Record<string, Discipline>;
type DisciplineSlug = keyof typeof disciplineSlugs;
const slugByDiscipline = Object.fromEntries(
  Object.entries(disciplineSlugs).map(([slug, discipline]) => [discipline, slug]),
) as Record<Discipline, DisciplineSlug>;
const sortColumns = ["sportif", "statut", "type", "objectif"] as const;

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

// Tri du tableau : nom, statut (actif, en pause, archivé), type (ordre des disciplines, sans type
// en dernier), objectif (date visée la plus proche d'abord, sans date en dernier).
const statusOrder = { active: 0, paused: 1, archived: 2 } as const;
function compare(column: SortColumn) {
  return (a: AthleteListItem, b: AthleteListItem) => {
    const byName = a.displayName.localeCompare(b.displayName, "fr");
    if (column === "statut") return statusOrder[a.status] - statusOrder[b.status] || byName;
    if (column === "type") {
      const rank = (x: AthleteListItem) =>
        x.programType ? DISCIPLINES.indexOf(x.programType) : DISCIPLINES.length;
      return rank(a) - rank(b) || byName;
    }
    if (column === "objectif") {
      const date = (x: AthleteListItem) => x.mainGoal?.targetDate ?? "9999-12-31";
      return date(a).localeCompare(date(b)) || byName;
    }
    return byName;
  };
}

async function AthleteList({
  orgId,
  query,
}: {
  orgId: string;
  query: Record<string, string | string[] | undefined>;
}) {
  // L'ID de l'URL est vérifié : un ID d'une autre organisation mène à « Accès refusé ».
  const { membership } = await requireOrgAccess(orgId);
  const slug = typeof query.statut === "string" ? query.statut : "tous";
  const filter = athleteListFilterSchema.parse({
    status: statusSlugs[slug as StatusSlug] ?? "all",
    q: typeof query.q === "string" ? query.q : "",
  });
  const disciplineSlug =
    typeof query.discipline === "string" && query.discipline in disciplineSlugs
      ? (query.discipline as DisciplineSlug)
      : null;
  const discipline = disciplineSlug ? disciplineSlugs[disciplineSlug] : null;
  const sortColumn = (sortColumns as readonly string[]).includes(String(query.tri))
    ? (query.tri as SortColumn)
    : "sportif";
  const desc = query.ordre === "desc";
  // Carte « Fiches à compléter » (29/10/2026) : la liste ne montre que les fiches incomplètes.
  const onlyIncomplete = query.fiche === "a-completer";

  // Une seule lecture : les chiffres clés portent sur toute l'organisation, la liste sur le filtre.
  const everyone = await listAthletes(membership.organizationId, { status: "all", q: filter.q });
  const all = filter.q
    ? await listAthletes(membership.organizationId, { status: "all", q: "" })
    : everyone;
  // Nombres des filtres de statut : sur la recherche et le type choisis, pour annoncer ce qu'on verra.
  const ofType = everyone.filter((a) => !discipline || a.programType === discipline);
  const athletes = ofType
    .filter((a) => filter.status === "all" || a.status === filter.status)
    .filter((a) => !onlyIncomplete || (a.status !== "archived" && a.missingInfo.length > 0))
    .sort(compare(sortColumn));
  if (desc) athletes.reverse();
  const statusCount = (status: AthleteListFilter["status"]) =>
    status === "all" ? ofType.length : ofType.filter((a) => a.status === status).length;

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
    discipline?: DisciplineSlug | null;
    tri?: SortColumn;
    desc?: boolean;
  }) => {
    const search = new URLSearchParams();
    const status = changes.status ?? filter.status;
    if (status !== "all") search.set("statut", slugByStatus[status]);
    const nextDiscipline = changes.discipline === undefined ? disciplineSlug : changes.discipline;
    if (nextDiscipline) search.set("discipline", nextDiscipline);
    if (filter.q) search.set("q", filter.q);
    const tri = changes.tri ?? sortColumn;
    if (tri !== "sportif") search.set("tri", tri);
    if (changes.desc ?? desc) search.set("ordre", "desc");
    const text = search.toString();
    return text ? `${basePath}?${text}` : basePath;
  };
  // Un appui sur la colonne déjà triée inverse l'ordre.
  const sortHrefs = Object.fromEntries(
    sortColumns.map((column) => [
      column,
      hrefFor({ tri: column, desc: column === sortColumn ? !desc : false }),
    ]),
  ) as Record<SortColumn, string>;

  const rows: AthleteTableRow[] = athletes.map((athlete) => ({
    id: athlete.id,
    name: athlete.displayName,
    sex: athlete.sex,
    photoPath: athlete.photoPath,
    status: athlete.status,
    programType: athlete.programType,
    hasAccount: athlete.hasAccount,
    hasPendingInvite: athlete.hasPendingInvite,
    missing: athlete.missingInfo.length > 0 ? completionLabel(athlete.missingInfo) : null,
    sub: athlete.level ? athleteLevelLabels[athlete.level] : "",
    objective: athlete.mainGoal
      ? {
          label: athlete.mainGoal.competitionName ?? goalTypeLabels[athlete.mainGoal.type],
          date: athlete.mainGoal.targetDate,
        }
      : null,
  }));

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
          {/* Cartes cliquables (29/10/2026) : chacune mène à la liste filtrée correspondante. */}
          <KpiCard
            color="run"
            icon={Users}
            href={hrefFor({ status: "active" })}
            value={String(active.length)}
            label={active.length > 1 ? "Sportifs actifs" : "Sportif actif"}
            detail={
              newThisMonth.length > 0
                ? `+${newThisMonth.length} ce mois-ci`
                : "Aucun nouveau ce mois-ci"
            }
          />
          <KpiCard
            color="warn"
            icon={CirclePause}
            href={hrefFor({ status: "paused" })}
            value={String(paused.length)}
            label="En pause"
          />
          <KpiCard
            color="accent"
            icon={Flag}
            href="/coach/notifications#notif-competitions"
            value={String(competitions.length)}
            label={competitions.length > 1 ? "Compétitions à venir" : "Compétition à venir"}
            detail={competitions[0] ? `Prochaine : ${formatShort(competitions[0].date)}` : "Aucune"}
          />
          <KpiCard
            color="amber"
            icon={UserPen}
            href={`${basePath}?fiche=a-completer`}
            value={String(incomplete.length)}
            label={incomplete.length > 1 ? "Fiches à compléter" : "Fiche à compléter"}
            detail="Nom ou contact manquant"
          />
        </KpiGrid>

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
          {filter.status !== "all" ? (
            <input type="hidden" name="statut" value={slugByStatus[filter.status]} />
          ) : null}
          {disciplineSlug ? <input type="hidden" name="discipline" value={disciplineSlug} /> : null}
        </form>

        {/* Téléphone et tablette : deux boutons compacts (choix en cours + flèche) ; ordinateur : la
            carte de la maquette avec toutes les pastilles. */}
        <div className="grid grid-cols-2 gap-3 lg:hidden">
          <CompactFilter
            title="Statut"
            options={statusChips.map((chip) => ({
              key: chip.status,
              label: `${chip.label} (${statusCount(chip.status)})`,
              href: hrefFor({ status: chip.status }),
              selected: filter.status === chip.status,
            }))}
          />
          <CompactFilter
            title="Type de programme"
            shortTitle="Programme"
            options={[
              {
                key: "all",
                label: "Tous",
                href: hrefFor({ discipline: null }),
                selected: !discipline,
              },
              ...DISCIPLINES.map((item) => ({
                key: item,
                label: disciplineLabels[item],
                href: hrefFor({ discipline: slugByDiscipline[item] }),
                selected: discipline === item,
              })),
            ]}
          />
        </div>

        {/* Filtres (maquette) : deux groupes titrés dans une carte, Statut puis Type de programme. */}
        <div className="hidden rounded-card border border-line bg-surface p-4 lg:flex lg:flex-row lg:items-start">
          <FilterGroup title="Statut" label="Filtrer par statut">
            {statusChips.map((chip) => {
              const count = statusCount(chip.status);
              return (
                <FilterLink
                  key={chip.status}
                  href={hrefFor({ status: chip.status })}
                  active={filter.status === chip.status}
                >
                  {chip.dot ? (
                    <span aria-hidden className={`size-2 rounded-full ${chip.dot}`} />
                  ) : null}
                  {chip.label} ({count})
                </FilterLink>
              );
            })}
          </FilterGroup>
          <span aria-hidden className="hidden w-px self-stretch bg-line lg:mx-6 lg:block" />
          <FilterGroup title="Type de programme" label="Filtrer par type de programme">
            <FilterLink href={hrefFor({ discipline: null })} active={!discipline}>
              <LayoutGrid aria-hidden size={15} strokeWidth={1.8} />
              Tous
            </FilterLink>
            {DISCIPLINES.map((item) => {
              const Icon = disciplineIcons[item];
              return (
                <FilterLink
                  key={item}
                  href={hrefFor({ discipline: slugByDiscipline[item] })}
                  active={discipline === item}
                >
                  <Icon
                    aria-hidden
                    size={15}
                    strokeWidth={2}
                    className={discipline === item ? "" : disciplineStyles[item].text}
                  />
                  {disciplineLabels[item]}
                </FilterLink>
              );
            })}
          </FilterGroup>
        </div>

        {onlyIncomplete ? (
          <p className="flex flex-wrap items-center gap-2 text-[14px] text-muted">
            <UserPen aria-hidden size={15} strokeWidth={1.8} className="text-amber" />
            Seulement les fiches à compléter.
            <Link
              href={basePath}
              className="border-b border-accent-line pb-px font-medium text-accent-text hover:text-text"
            >
              Tout afficher
            </Link>
          </p>
        ) : null}

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
          <AthleteTable
            organizationId={membership.organizationId}
            basePath={basePath}
            rows={rows}
            sort={{ column: sortColumn, desc, hrefs: sortHrefs }}
          />
        )}
      </PageBody>
    </>
  );
}

function FilterGroup({
  title,
  label,
  children,
}: {
  title: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2.5">
      <span className="text-[14px] font-medium text-muted">{title}</span>
      {/* Retour à la ligne partout : tous les choix restent visibles, même sur téléphone. */}
      <nav aria-label={label} className="flex flex-wrap gap-2">
        {children}
      </nav>
    </div>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={`${chipClass} ${active ? chipActiveClass : chipIdleClass}`}
    >
      {children}
    </Link>
  );
}
