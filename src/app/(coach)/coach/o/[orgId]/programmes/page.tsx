import { FilePlus, Plus, Search, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { phoneFabClass } from "@/components/layout/mobile-bar";
import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { buttonClass } from "@/components/ui/button";
import { segmentItemClass, segmentTrackClass } from "@/components/ui/segmented-styles";
import { disciplineLabels, type Discipline } from "@/domain/training/discipline";
import type { ProgramListStatus } from "@/domain/training/program-status";
import { requireOrgAccess } from "@/features/auth/guards";
import { listPrograms } from "@/features/programs/queries";
import { listTemplates, type TemplateSource } from "@/features/programs/templates";

import { ProgramCard, TemplateCard } from "./cards";
import {
  ListSearch,
  PhoneProgramFilters,
  PhoneSourceChips,
  PhoneTemplateFilters,
  QuerySelect,
} from "./list-filters";

export const metadata: Metadata = {
  title: "Programmes",
};

// Page Programmes (maquette « Programmes » 01 de Claude Design, PRG-01 à PRG-06, D-157) : onglets
// Programmes / Modèles (dans l'adresse, ?onglet=modeles), filtres et recherche dans l'adresse, cartes
// en 3 colonnes sur ordinateur, 1 sur téléphone ; état vide et « aucun résultat ». Les compteurs des
// statuts sont les vrais nombres (PRG-F02).

const statusSlugs = {
  tous: "all",
  "en-cours": "current",
  brouillons: "draft",
  "a-venir": "upcoming",
  termines: "finished",
  // Phase 4 (décision d'Antonino du 10/11) : les archivés se retrouvent, et se désarchivent.
  archives: "archived",
} as const;
type StatusSlug = keyof typeof statusSlugs;
const statusLabels: Record<StatusSlug, string> = {
  tous: "Tous",
  "en-cours": "En cours",
  brouillons: "Brouillons",
  "a-venir": "À venir",
  termines: "Terminés",
  archives: "Archivés",
};
const disciplineSlugs = {
  running: "running",
  musculation: "strength",
  hyrox: "hyrox",
  hybride: "hybrid",
} as const satisfies Record<string, Discipline>;
type DisciplineSlug = keyof typeof disciplineSlugs;
const sourceSlugs = { tous: "all", coory: "coory", "mes-modeles": "mine" } as const;
type SourceSlug = keyof typeof sourceSlugs;
const typeSlugs = { tous: "all", programmes: "program", seances: "session" } as const;
type TypeSlug = keyof typeof typeSlugs;

const pick = <T extends string>(value: unknown, allowed: Record<T, unknown>, fallback: T): T =>
  typeof value === "string" && Object.hasOwn(allowed, value) ? (value as T) : fallback;

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

export default function ProgrammesPage({
  params,
  searchParams,
}: PageProps<"/coach/o/[orgId]/programmes">) {
  return (
    <main className={pageMainClass}>
      <Suspense fallback={<PageLoading />}>
        {Promise.all([params, searchParams]).then(([{ orgId }, query]) => (
          <Programmes orgId={orgId} query={query} />
        ))}
      </Suspense>
    </main>
  );
}

// Onglets Programmes / Modèles : des liens (l'onglet est dans l'adresse), dessinés en segmenté.
function Tabs({ base, models, size }: { base: string; models: boolean; size: "header" | "full" }) {
  return (
    <nav aria-label="Programmes et modèles" className={segmentTrackClass(size)}>
      <Link
        href={base}
        aria-current={models ? undefined : "page"}
        className={segmentItemClass(size, !models)}
      >
        Programmes
      </Link>
      <Link
        href={`${base}?onglet=modeles`}
        aria-current={models ? "page" : undefined}
        className={segmentItemClass(size, models)}
      >
        Modèles
      </Link>
    </nav>
  );
}

// Adresse avec un paramètre changé (les autres gardés).
function withParam(
  base: string,
  query: Record<string, string | string[] | undefined>,
  key: string,
  value: string | null,
) {
  const next = new URLSearchParams();
  for (const [k, v] of Object.entries(query))
    if (typeof v === "string" && k !== key) next.set(k, v);
  if (value) next.set(key, value);
  const text = next.toString();
  return text ? `${base}?${text}` : base;
}

async function Programmes({
  orgId,
  query,
}: {
  orgId: string;
  query: Record<string, string | string[] | undefined>;
}) {
  const { membership } = await requireOrgAccess(orgId);
  const organizationId = membership.organizationId;
  const base = `/coach/o/${organizationId}/programmes`;
  const models = query.onglet === "modeles";
  const search = typeof query.q === "string" ? query.q : "";
  const disciplineSlug = pick<DisciplineSlug | "toutes">(
    query.discipline,
    { ...disciplineSlugs, toutes: "" },
    "toutes",
  );
  const discipline = disciplineSlug === "toutes" ? null : disciplineSlugs[disciplineSlug];

  const createLabel = models ? "Nouveau modèle" : "Créer un programme";
  const createHref = models ? `${base}/nouveau?modele=nouveau` : `${base}/nouveau`;

  return (
    <>
      <PageHeader
        title={<span className="lg:sr-only">Programmes</span>}
        titleAside={
          <span className="hidden lg:block">
            <Tabs base={base} models={models} size="header" />
          </span>
        }
        actions={
          // Ordinateur : le bouton de l'en-tête (32 px) ; téléphone : le bouton flottant (D-117).
          <Link
            href={createHref}
            className={buttonClass({
              className:
                "max-lg:hidden lg:h-8! lg:gap-1.5! lg:rounded-[9px]! lg:px-3.5! lg:text-[12.5px]!",
            })}
          >
            <Plus aria-hidden size={13} strokeWidth={2.2} />
            {createLabel}
          </Link>
        }
      />
      {/* Téléphone : le bouton flottant crée un programme, ou un modèle sur l'onglet Modèles (phase 4 :
          la maquette PRG-06 n'en avait pas, et « Nouveau modèle » n'existait alors que sur ordinateur). */}
      <Link href={createHref} aria-label={createLabel} data-phone-fab="" className={phoneFabClass}>
        <Plus aria-hidden size={24} strokeWidth={2.2} />
      </Link>
      <PageBody grow>
        <div className="flex min-h-full flex-1 flex-col gap-3">
          <div className="lg:hidden">
            <Tabs base={base} models={models} size="full" />
          </div>
          {models ? (
            <TemplatesTab
              organizationId={organizationId}
              base={base}
              query={query}
              search={search}
              discipline={discipline}
              disciplineSlug={disciplineSlug}
            />
          ) : (
            <ProgramsTab
              organizationId={organizationId}
              base={base}
              query={query}
              search={search}
              discipline={discipline}
              disciplineSlug={disciplineSlug}
              createHref={createHref}
            />
          )}
        </div>
      </PageBody>
    </>
  );
}

const disciplineOptions = (all: string) => [
  { value: "", label: all },
  ...(Object.entries(disciplineSlugs) as [DisciplineSlug, Discipline][]).map(([slug, value]) => ({
    value: slug,
    label: disciplineLabels[value],
  })),
];

async function ProgramsTab({
  organizationId,
  base,
  query,
  search,
  discipline,
  disciplineSlug,
  createHref,
}: {
  organizationId: string;
  base: string;
  query: Record<string, string | string[] | undefined>;
  search: string;
  discipline: Discipline | null;
  disciplineSlug: string;
  createHref: string;
}) {
  const statusSlug = pick<StatusSlug>(query.statut, statusSlugs, "tous");
  const status = statusSlugs[statusSlug];
  const athleteId = typeof query.sportif === "string" ? query.sportif : "";

  // Une lecture : les compteurs, les sportifs du filtre et l'état vide portent sur l'ensemble.
  const all = await listPrograms(organizationId, { includeArchived: true });
  if (all.length === 0) return <FirstProgram createHref={createHref} />;

  const text = normalize(search.trim());
  const matching = all.filter(
    (program) =>
      (!discipline || program.discipline === discipline) &&
      (!athleteId || program.athleteId === athleteId) &&
      (!text ||
        normalize(program.title).includes(text) ||
        normalize(program.athleteName).includes(text)),
  );
  // « Tous » : sans les archivés, qui ont leur onglet.
  const count = (value: ProgramListStatus | "all") =>
    matching.filter((p) => (value === "all" ? p.status !== "archived" : p.status === value)).length;
  const shown = matching.filter((program) =>
    status === "all" ? program.status !== "archived" : program.status === status,
  );

  const athletes = [...new Map(all.map((p) => [p.athleteId, p.athleteName])).entries()].sort(
    (a, b) => a[1].localeCompare(b[1], "fr"),
  );
  const athleteOptions = [
    { value: "", label: "Tous les sportifs" },
    ...athletes.map(([value, label]) => ({ value, label })),
  ];
  const statusOptions = (Object.keys(statusSlugs) as StatusSlug[]).map((slug) => ({
    value: slug === "tous" ? "" : slug,
    label: statusLabels[slug],
  }));

  return (
    <>
      {/* Ordinateur : statuts, menus et recherche sur une ligne ; s'il manque de la place (l'onglet
          « Archivés » depuis la phase 4), les menus passent dessous plutôt que d'être tronqués. */}
      <div className="hidden flex-wrap items-center gap-3 lg:flex">
        <nav aria-label="Statut" className={`${segmentTrackClass("page")} shrink-0`}>
          {(Object.keys(statusSlugs) as StatusSlug[]).map((slug) => (
            <Link
              key={slug}
              href={withParam(base, query, "statut", slug === "tous" ? null : slug)}
              aria-current={slug === statusSlug ? "page" : undefined}
              scroll={false}
              className={segmentItemClass("page", slug === statusSlug)}
            >
              {statusLabels[slug]}
              <span className="text-[12px] font-medium text-muted tabular">
                {count(statusSlugs[slug])}
              </span>
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <QuerySelect
            name="discipline"
            label="Discipline"
            value={disciplineSlug === "toutes" ? "" : disciplineSlug}
            options={disciplineOptions("Toutes les disciplines")}
            className="w-[196px] shrink-0"
          />
          <QuerySelect
            name="sportif"
            label="Sportif"
            value={athleteId}
            options={athleteOptions}
            className="w-[172px] shrink-0"
          />
          <ListSearch initial={search} placeholder="Rechercher un programme" />
        </div>
      </div>
      {/* Téléphone : statut, filtres, puis la recherche. */}
      <div className="flex flex-col gap-3 lg:hidden">
        <PhoneProgramFilters
          status={statusSlug === "tous" ? "" : statusSlug}
          statusOptions={statusOptions}
          discipline={disciplineSlug === "toutes" ? "" : disciplineSlug}
          disciplineOptions={disciplineOptions("Toutes les disciplines")}
          athlete={athleteId}
          athleteOptions={athleteOptions}
        />
        <ListSearch initial={search} placeholder="Rechercher un programme" />
      </div>

      {shown.length === 0 ? (
        <NoResult href={base} label="Aucun programme trouvé" />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((program) => (
            <ProgramCard key={program.id} program={program} href={`${base}/${program.id}`} />
          ))}
        </div>
      )}
    </>
  );
}

async function TemplatesTab({
  organizationId,
  base,
  query,
  search,
  discipline,
  disciplineSlug,
}: {
  organizationId: string;
  base: string;
  query: Record<string, string | string[] | undefined>;
  search: string;
  discipline: Discipline | null;
  disciplineSlug: string;
}) {
  const sourceSlug = pick<SourceSlug>(query.source, sourceSlugs, "tous");
  const typeSlug = pick<TypeSlug>(query.type, typeSlugs, "tous");
  const all = await listTemplates(organizationId);
  const text = normalize(search.trim());
  const matching = all.filter(
    (template) =>
      (typeSlug === "tous" || template.kind === typeSlugs[typeSlug]) &&
      (!discipline || template.discipline === discipline) &&
      (!text || normalize(template.title).includes(text)),
  );
  const count = (source: TemplateSource | "all") =>
    source === "all" ? matching.length : matching.filter((t) => t.source === source).length;
  const source = sourceSlugs[sourceSlug];
  const shown = matching.filter((template) => source === "all" || template.source === source);
  const sourceLabels: Record<SourceSlug, string> = {
    tous: "Tous",
    coory: "Coory",
    "mes-modeles": "Mes modèles",
  };

  return (
    <>
      <div className="hidden items-center gap-3 lg:flex">
        <nav aria-label="Source" className={`${segmentTrackClass("page")} shrink-0`}>
          {(Object.keys(sourceSlugs) as SourceSlug[]).map((slug) => (
            <Link
              key={slug}
              href={withParam(base, query, "source", slug === "tous" ? null : slug)}
              aria-current={slug === sourceSlug ? "page" : undefined}
              scroll={false}
              className={segmentItemClass("page", slug === sourceSlug)}
            >
              {sourceLabels[slug]}
              <span className="text-[12px] font-medium text-muted tabular">
                {count(sourceSlugs[slug])}
              </span>
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex min-w-0 items-center gap-2">
          <QuerySelect
            name="type"
            label="Type de modèle"
            value={typeSlug === "tous" ? "" : typeSlug}
            options={[
              { value: "", label: "Programmes et séances" },
              { value: "programmes", label: "Programmes" },
              { value: "seances", label: "Séances" },
            ]}
            className="w-[216px] min-w-[150px] shrink"
          />
          <QuerySelect
            name="discipline"
            label="Discipline"
            value={disciplineSlug === "toutes" ? "" : disciplineSlug}
            options={disciplineOptions("Toutes les disciplines")}
            className="w-[196px] min-w-[150px] shrink"
          />
          <ListSearch initial={search} placeholder="Rechercher un modèle" />
        </div>
      </div>
      <PhoneSourceChips
        value={sourceSlug}
        options={(Object.keys(sourceSlugs) as SourceSlug[]).map((slug) => ({
          value: slug,
          label: sourceLabels[slug],
          count: count(sourceSlugs[slug]),
        }))}
      />
      {/* Téléphone (revue MVP du 13/11, C17) : les mêmes filtres et la recherche que l'ordinateur. */}
      <div className="flex flex-col gap-3 lg:hidden">
        <PhoneTemplateFilters
          type={typeSlug === "tous" ? "" : typeSlug}
          typeOptions={[
            { value: "", label: "Programmes et séances" },
            { value: "programmes", label: "Programmes" },
            { value: "seances", label: "Séances" },
          ]}
          discipline={disciplineSlug === "toutes" ? "" : disciplineSlug}
          disciplineOptions={disciplineOptions("Toutes les disciplines")}
        />
        <ListSearch initial={search} placeholder="Rechercher un modèle" />
      </div>

      {shown.length === 0 ? (
        <NoResult href={`${base}?onglet=modeles`} label="Aucun modèle trouvé" />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((template) => (
            <TemplateCard
              key={`${template.kind}-${template.id}`}
              template={template}
              href={`${base}/modeles/${template.id}`}
              // Un modèle de séance n'a pas de « Utiliser » : il s'ajoute à une semaine depuis
              // l'éditeur d'un programme (revue MVP du 13/11, C9 ; avant, le bouton rouvrait sa page).
              useHref={template.kind === "program" ? `${base}/nouveau?modele=${template.id}` : null}
            />
          ))}
        </div>
      )}
    </>
  );
}

// État vide (PRG-03) : aucun programme dans l'organisation.
function FirstProgram({ createHref }: { createHref: string }) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center rounded-[20px] bg-surface px-6 py-12 text-center lg:p-10">
      <span className="grid size-[68px] place-items-center rounded-[21px] bg-lib-lavender text-violet-text">
        <FilePlus aria-hidden size={30} strokeWidth={1.8} />
      </span>
      <h2 className="mt-[22px] text-[22px] leading-[1.2] font-bold tracking-[-0.025em] text-text lg:text-[26px]">
        Ton premier programme
      </h2>
      <p className="mt-2.5 max-w-[470px] text-[15px] leading-[1.6] text-muted">
        Choisis un sportif, sa discipline et la durée. Coory prépare les semaines et les séances, tu
        les remplis puis tu publies.
      </p>
      <div className="mt-7 flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row">
        <Link
          href={createHref}
          className="inline-flex h-[50px] items-center justify-center gap-2 rounded-[13px] bg-cta px-[18px] text-[14.5px] font-semibold whitespace-nowrap text-on-cta transition-[scale,background-color] duration-150 hover:bg-cta-hover active:scale-[0.98] sm:h-[46px] sm:rounded-[12px]"
        >
          <Plus aria-hidden size={15} strokeWidth={2.2} />
          Créer un programme
        </Link>
        <Link
          href="/coach/assistant"
          className="inline-flex h-[50px] items-center justify-center gap-2 rounded-[13px] bg-ai-bg px-4 text-[14.5px] font-semibold whitespace-nowrap text-ai-text transition-[scale] duration-150 active:scale-[0.98] sm:h-[46px] sm:rounded-[12px]"
        >
          <Sparkles aria-hidden size={15} strokeWidth={2} />
          Le préparer avec l&apos;Assistant IA
        </Link>
      </div>
    </section>
  );
}

// Recherche ou filtres sans résultat (PRG-04).
function NoResult({ href, label }: { href: string; label: string }) {
  return (
    <section className="flex flex-col items-center rounded-[22px] bg-surface px-6 py-9 text-center">
      <span className="grid size-[52px] place-items-center rounded-[16px] bg-bg text-muted">
        <Search aria-hidden size={22} strokeWidth={2} />
      </span>
      <h2 className="mt-4 text-[19px] leading-[1.25] font-bold tracking-[-0.015em] text-text">
        {label}
      </h2>
      <p className="mt-1.5 max-w-[340px] text-[14px] leading-[1.5] text-muted">
        Essaie un autre mot ou retire un filtre.
      </p>
      <Link
        href={href}
        className="mt-5 inline-flex h-11 items-center rounded-[12px] bg-surface px-4 text-[14px] font-semibold text-text inset-ring inset-ring-field-ring transition-[scale,background-color] duration-150 hover:bg-surface-2 active:scale-[0.98]"
      >
        Effacer la recherche et les filtres
      </Link>
    </section>
  );
}
