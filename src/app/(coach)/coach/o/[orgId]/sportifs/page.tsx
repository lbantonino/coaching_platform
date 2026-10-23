import { Plus, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { FilterChips } from "@/components/ui/filter-chips";
import { SexMark } from "@/components/ui/sex-mark";
import { disciplineLabels, disciplineStyles, disciplineTones } from "@/domain/training/discipline";
import { listAthletes, type AthleteListItem } from "@/features/athletes/queries";
import {
  athleteListFilterSchema,
  athleteStatusLabels,
  type AthleteListFilter,
} from "@/features/athletes/schemas";
import { requireOrgAccess } from "@/features/auth/guards";

export const metadata: Metadata = {
  title: "Sportifs",
};

// Valeurs du filtre dans l'URL, en français : ?statut=actifs|en-pause|archives|tous
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

function accessBadge(athlete: AthleteListItem): { tone: BadgeTone; label: string } {
  if (athlete.hasAccount) return { tone: "ok", label: "Compte activé" };
  if (athlete.hasPendingInvite) return { tone: "warn", label: "Invitation en attente" };
  return { tone: "neutral", label: "Sans compte" };
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
  const slug = typeof query.statut === "string" ? query.statut : "actifs";
  const filter = athleteListFilterSchema.parse({
    status: statusSlugs[slug as StatusSlug] ?? "active",
    q: typeof query.q === "string" ? query.q : "",
  });
  const athletes = await listAthletes(membership.organizationId, filter);

  const basePath = `/coach/o/${membership.organizationId}/sportifs`;
  const hrefFor = (status: AthleteListFilter["status"]) => {
    const search = new URLSearchParams({ statut: slugByStatus[status] });
    if (filter.q) search.set("q", filter.q);
    return `${basePath}?${search.toString()}`;
  };
  const chipLabels: Record<AthleteListFilter["status"], string> = {
    active: "Actifs",
    paused: "En pause",
    archived: "Archivés",
    all: "Tous",
  };

  return (
    <>
      <PageHeader
        title="Sportifs"
        subtitle={membership.organizationName}
        actions={
          <Link href={`${basePath}/nouveau`} className={buttonClass()}>
            <Plus aria-hidden size={16} strokeWidth={2} />
            Ajouter un sportif
          </Link>
        }
      />
      <PageBody>
        <div className="flex flex-col gap-3">
          {/* Recherche : formulaire GET classique, le filtre reste dans l'URL. */}
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
              placeholder="Rechercher par nom ou e-mail…"
              className="h-11 w-full rounded-md border border-line bg-surface pr-3 pl-10 text-body text-text outline-none placeholder:text-faint focus:border-accent sm:h-[38px] sm:text-small"
            />
            <input type="hidden" name="statut" value={slugByStatus[filter.status]} />
          </form>
          <FilterChips
            label="Filtrer par statut"
            options={(["active", "paused", "archived", "all"] as const).map((status) => ({
              href: hrefFor(status),
              label: chipLabels[status],
              active: filter.status === status,
            }))}
          />
        </div>

        {athletes.length === 0 ? (
          <p
            role="status"
            className="rounded-card border border-dashed border-line-2 p-6 text-muted"
          >
            {filter.q
              ? `Aucun sportif ne correspond à « ${filter.q} ».`
              : filter.status === "active"
                ? "Aucun sportif actif pour l'instant. Ajoute ton premier sportif pour pouvoir lui créer un programme."
                : "Aucun sportif dans cette catégorie."}
          </p>
        ) : (
          <ul
            className="flex flex-col overflow-hidden rounded-card border border-line bg-surface"
            aria-label="Liste des sportifs"
          >
            {athletes.map((athlete) => {
              const badge = accessBadge(athlete);
              return (
                <li
                  key={athlete.id}
                  className="flex flex-col gap-3 border-b border-line p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <Link
                    href={`${basePath}/${athlete.id}`}
                    className="flex min-w-0 items-center gap-3 rounded-[10px] hover:text-text"
                  >
                    {/* Avatar à la couleur de la discipline de l'objectif principal (D-24, D-25). */}
                    <Avatar
                      name={athlete.displayName}
                      colorClass={
                        athlete.mainDiscipline
                          ? disciplineStyles[athlete.mainDiscipline].avatar
                          : undefined
                      }
                      photoPath={athlete.photoPath}
                    />
                    <span className="flex min-w-0 flex-col">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate font-medium">{athlete.displayName}</span>
                        <SexMark sex={athlete.sex} size="sm" />
                      </span>
                      <span className="truncate text-small text-muted">
                        {athleteStatusLabels[athlete.status]}
                        {athlete.email ? ` · ${athlete.email}` : ""}
                      </span>
                    </span>
                  </Link>
                  <div className="flex flex-wrap items-center gap-3 pl-12 sm:pl-0">
                    {athlete.mainDiscipline ? (
                      <Badge tone={disciplineTones[athlete.mainDiscipline]}>
                        {disciplineLabels[athlete.mainDiscipline]}
                      </Badge>
                    ) : null}
                    <Badge tone={badge.tone}>{badge.label}</Badge>
                    {athlete.hasAccount || athlete.status === "archived" ? null : (
                      <Link
                        href={`${basePath}/${athlete.id}/inviter`}
                        className={buttonClass({ variant: "outline", size: "sm" })}
                        aria-label={`Inviter ${athlete.displayName}`}
                      >
                        Inviter
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </PageBody>
    </>
  );
}
