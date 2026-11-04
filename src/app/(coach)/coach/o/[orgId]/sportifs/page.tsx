import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { phoneFabClass } from "@/components/layout/mobile-bar";
import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { buttonClass } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
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

import { AthleteSearch } from "./athlete-search";
import { AthleteTable, type AthleteTableRow, type SortColumn } from "./athlete-table";

export const metadata: Metadata = {
  title: "Sportifs",
};

// Liste des sportifs (prompt Claude Design §7 `/coach/sportifs`), d'après la maquette « Sportifs » du
// 03/11/2026 (dossier COORY-SPORTIF-PIXEL-PERFECT, pages 1a et 1b) : filtres Statut et Programme en
// menus déroulants, recherche en direct (filtres et recherche dans l'adresse), puis le tableau (cartes
// sur téléphone). Les anciens chiffres clés (D-40) sont dans les menus et le résumé : compteurs,
// « Fiches à compléter » dans le menu Statut, compétitions à venir dans le résumé du téléphone.
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
const statusChoices: { status: AthleteListFilter["status"]; label: string; dot: string }[] = [
  { status: "all", label: "Tous", dot: "bg-text" },
  { status: "active", label: "Actifs", dot: "bg-ok" },
  { status: "paused", label: "En pause", dot: "bg-warn-dot" },
  { status: "archived", label: "Archivés", dot: "bg-archived-dot" },
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
  // « Fiches à compléter » (choix du menu Statut depuis le 03/11) : seulement les fiches incomplètes.
  const onlyIncomplete = query.fiche === "a-completer";

  // Une seule lecture : le résumé porte sur toute l'organisation, la liste sur le filtre.
  const everyone = await listAthletes(membership.organizationId, { status: "all", q: filter.q });
  const all = filter.q
    ? await listAthletes(membership.organizationId, { status: "all", q: "" })
    : everyone;
  const isIncomplete = (a: AthleteListItem) => a.status !== "archived" && a.missingInfo.length > 0;
  // Nombres des menus : sur la recherche et l'autre filtre choisis, pour annoncer ce qu'on verra.
  const ofType = everyone.filter((a) => !discipline || a.programType === discipline);
  const ofStatus = everyone.filter(
    (a) =>
      (filter.status === "all" || a.status === filter.status) &&
      (!onlyIncomplete || isIncomplete(a)),
  );
  const athletes = ofType
    .filter((a) => filter.status === "all" || a.status === filter.status)
    .filter((a) => !onlyIncomplete || isIncomplete(a))
    .sort(compare(sortColumn));
  if (desc) athletes.reverse();
  const statusCount = (status: AthleteListFilter["status"]) =>
    status === "all" ? ofType.length : ofType.filter((a) => a.status === status).length;

  const today = todayIsoInBrussels();
  const active = all.filter((athlete) => athlete.status === "active");
  const competitions = all.filter(
    (athlete) => athlete.status !== "archived" && athlete.nextCompetition,
  ).length;

  const basePath = `/coach/o/${membership.organizationId}/sportifs`;
  const hrefFor = (changes: {
    status?: AthleteListFilter["status"];
    discipline?: DisciplineSlug | null;
    incomplete?: boolean;
    tri?: SortColumn;
    desc?: boolean;
  }) => {
    const search = new URLSearchParams();
    const status = changes.status ?? filter.status;
    if (status !== "all") search.set("statut", slugByStatus[status]);
    // Choisir un statut quitte « Fiches à compléter » (les deux sont dans le même menu).
    const incomplete = changes.incomplete ?? (changes.status === undefined && onlyIncomplete);
    if (incomplete) search.set("fiche", "a-completer");
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

  const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? "s" : ""}`;
  const incompleteCount = ofType.filter(isIncomplete).length;

  return (
    <>
      <PageHeader
        title="Sportifs"
        actions={
          // Ordinateur : le bouton de l'en-tête (32 px) ; téléphone : le bouton flottant (D-117).
          <Link
            href={`${basePath}/nouveau`}
            className={buttonClass({
              className:
                "max-lg:hidden lg:h-8! lg:gap-1.5! lg:rounded-[9px]! lg:px-3.5! lg:text-[12.5px]! lg:font-medium!",
            })}
          >
            <Plus aria-hidden size={13} strokeWidth={2.2} />
            Nouveau sportif
          </Link>
        }
      />
      <Link
        href={`${basePath}/nouveau`}
        aria-label="Nouveau sportif"
        data-phone-fab=""
        className={phoneFabClass}
      >
        <Plus aria-hidden size={24} strokeWidth={2.2} />
      </Link>
      <PageBody>
        <AthleteTable
          organizationId={membership.organizationId}
          basePath={basePath}
          rows={rows}
          today={today}
          sort={{ column: sortColumn, desc, hrefs: sortHrefs }}
          toolbar={
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-4 lg:px-6 lg:pt-[26px] lg:pb-[18px]">
              {/* Téléphone : le résumé de l'organisation (maquette 1b) ; les compétitions mènent à
                  leurs rappels (comme l'ancienne carte « Compétitions à venir »). */}
              <p className="px-1 pb-1 text-[14px] leading-[normal] whitespace-nowrap text-text-2 lg:hidden">
                {plural(all.length, "sportif")} · {plural(active.length, "actif")} ·{" "}
                <Link
                  href="/coach/notifications#notif-competitions"
                  className="underline-offset-2 hover:underline"
                >
                  {competitions} compétition{competitions > 1 ? "s" : ""} à venir
                </Link>
              </p>
              <div className="lg:order-last">
                <AthleteSearch action={basePath} initial={filter.q} />
              </div>
              <div className="grid grid-cols-2 gap-2.5 lg:flex">
                <Dropdown
                  label="Statut"
                  className="lg:w-[220px]"
                  options={[
                    ...statusChoices.map((choice) => ({
                      key: choice.status,
                      label: choice.label,
                      dot: choice.dot,
                      count: statusCount(choice.status),
                      href: hrefFor({ status: choice.status, incomplete: false }),
                      selected: !onlyIncomplete && filter.status === choice.status,
                    })),
                    {
                      key: "a-completer",
                      label: "Fiches à compléter",
                      dot: "bg-warn-dot",
                      count: incompleteCount,
                      href: hrefFor({ status: "all", incomplete: true }),
                      selected: onlyIncomplete,
                      separated: true,
                    },
                  ]}
                />
                <Dropdown
                  label="Programme"
                  className="lg:w-[220px]"
                  options={[
                    {
                      key: "all",
                      label: "Tous",
                      dot: "bg-text",
                      href: hrefFor({ discipline: null }),
                      selected: !discipline,
                    },
                    ...DISCIPLINES.map((item) => ({
                      key: item,
                      label: disciplineLabels[item],
                      dot: disciplineStyles[item].dot,
                      count: ofStatus.filter((a) => a.programType === item).length,
                      href: hrefFor({ discipline: slugByDiscipline[item] }),
                      selected: discipline === item,
                    })),
                  ]}
                />
              </div>
            </div>
          }
          empty={
            all.length === 0 ? (
              <div
                role="status"
                className="flex flex-col items-center gap-3 px-6 py-12 text-center"
              >
                <p className="text-[15px] font-semibold">Aucun sportif pour l&apos;instant</p>
                <p className="text-[13.5px] text-muted">
                  Ajoute ton premier sportif : il apparaîtra ici avec son objectif et sa prochaine
                  compétition.
                </p>
                <Link href={`${basePath}/nouveau`} className={buttonClass({ variant: "outline" })}>
                  Ajouter mon premier sportif
                </Link>
              </div>
            ) : (
              <div
                role="status"
                className="flex flex-col items-center gap-1.5 px-5 py-10 text-center lg:px-6 lg:py-12"
              >
                <p className="text-[15px] font-semibold">Aucun sportif trouvé</p>
                <p className="text-[13.5px] text-muted">
                  Essaie un autre filtre ou une autre recherche.
                </p>
              </div>
            )
          }
        />
      </PageBody>
    </>
  );
}
