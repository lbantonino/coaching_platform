import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { getAthlete } from "@/features/athletes/queries";
import { requireOrgAccess } from "@/features/auth/guards";
import { loadWizardData, nextMonday } from "@/features/programs/wizard";
import { todayIsoInBrussels } from "@/lib/format";

import { ProgramWizard } from "../../../programmes/nouveau/program-wizard";

export const metadata: Metadata = {
  title: "Nouveau programme",
};

// « Créer un programme » depuis la fiche d'un sportif (demande d'Antonino du 11/11, D-163) : on
// reste chez le sportif. L'assistant s'ouvre avec lui, sans liste ni recherche de sportifs (il ne
// reste que le titre à l'étape 1), et « ← Prénom Nom » ramène à son onglet Programme. Mêmes adresses
// que la page Programmes : ?modele=<id> (partir d'un modèle), ?depart=copie (copier un programme
// précédent).
export default function NewAthleteProgramPage({
  params,
  searchParams,
}: PageProps<"/coach/o/[orgId]/sportifs/[athleteId]/nouveau-programme">) {
  return (
    // Ordinateur : l'assistant tient dans l'écran, son contenu défile à l'intérieur.
    <main className={`${pageMainClass} lg:h-dvh lg:flex-none`}>
      <Suspense fallback={<PageLoading />}>
        {Promise.all([params, searchParams]).then(([{ orgId, athleteId }, query]) => (
          <NewAthleteProgram orgId={orgId} athleteId={athleteId} query={query} />
        ))}
      </Suspense>
    </main>
  );
}

async function NewAthleteProgram({
  orgId,
  athleteId,
  query,
}: {
  orgId: string;
  athleteId: string;
  query: Record<string, string | string[] | undefined>;
}) {
  const { membership } = await requireOrgAccess(orgId);
  const organizationId = membership.organizationId;
  const data = await loadWizardData(organizationId);
  // Sportif inconnu ou d'une autre organisation : même réponse (404), sans révéler son existence.
  const athlete = data.athletes.find((item) => item.id === athleteId);
  if (!athlete) {
    // Fiche archivée (revue MVP du 13/11, B11) : l'assistant ne propose que les sportifs actifs ;
    // on le dit au lieu d'une page introuvable.
    const archived = await getAthlete(organizationId, athleteId);
    if (!archived || archived.status !== "archived") notFound();
    const fiche = `/coach/o/${organizationId}/sportifs/${archived.id}`;
    return (
      <>
        <PageHeader
          title="Nouveau programme"
          back={{ href: `${fiche}?onglet=programme`, label: archived.displayName }}
          visibleTitle={false}
        />
        <PageBody>
          <section className="flex flex-col items-start gap-3 rounded-[20px] bg-surface p-5 lg:p-6">
            <h2 className="text-[19px] leading-[1.25] font-bold tracking-[-0.015em] text-text">
              La fiche de {archived.firstName} est archivée
            </h2>
            <p className="max-w-[520px] text-[14.5px] leading-[1.55] text-muted">
              Réactive-la (onglet Profil, statut) pour lui créer un programme.
            </p>
            <Link
              href={`${fiche}?onglet=profil`}
              className="inline-flex h-11 items-center rounded-[12px] bg-cta px-4 text-[14px] font-semibold text-on-cta transition-[scale,background-color] duration-150 hover:bg-cta-hover active:scale-[0.98]"
            >
              Ouvrir son profil
            </Link>
          </section>
        </PageBody>
      </>
    );
  }

  const fiche = `/coach/o/${organizationId}/sportifs/${athlete.id}`;
  const templateId =
    typeof query.modele === "string" && data.templates.some((t) => t.id === query.modele)
      ? query.modele
      : null;

  return (
    <>
      <PageHeader
        title="Nouveau programme"
        back={{ href: `${fiche}?onglet=programme`, label: athlete.name }}
        visibleTitle={false}
      />
      <PageBody fill>
        <ProgramWizard
          organizationId={organizationId}
          base={`/coach/o/${organizationId}/programmes`}
          data={data}
          templateMode={false}
          initialAthleteId={athlete.id}
          lockedAthlete
          initialTemplateId={templateId}
          initialCopy={query.depart === "copie"}
          defaultStartDate={nextMonday(todayIsoInBrussels())}
        />
      </PageBody>
    </>
  );
}
