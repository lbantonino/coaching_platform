import type { Metadata } from "next";
import { Suspense } from "react";

import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { requireOrgAccess } from "@/features/auth/guards";
import { loadWizardData } from "@/features/programs/wizard";
import { todayIsoInBrussels } from "@/lib/format";

import { ProgramWizard } from "./program-wizard";

export const metadata: Metadata = {
  title: "Nouveau programme",
};

// Assistant « Créer un programme » (maquette 02, WIZ-01 à 05, D-157) : 4 étapes, puis le brouillon
// s'ouvre dans l'éditeur. Adresses : ?sportif=<id> (depuis la fiche d'un sportif, étape 1 déjà
// choisie), ?modele=<id> (« Utiliser » un modèle : étape 4 « Partir d'un modèle »), ?modele=nouveau
// (« Nouveau modèle » : l'assistant sans sportif ni dates, [P] accepté).
export default function NewProgramPage({
  params,
  searchParams,
}: PageProps<"/coach/o/[orgId]/programmes/nouveau">) {
  return (
    // Ordinateur : l'assistant tient dans l'écran (comme la maquette), son contenu défile à l'intérieur.
    <main className={`${pageMainClass} lg:h-dvh lg:flex-none`}>
      <Suspense fallback={<PageLoading />}>
        {Promise.all([params, searchParams]).then(([{ orgId }, query]) => (
          <NewProgram orgId={orgId} query={query} />
        ))}
      </Suspense>
    </main>
  );
}

// Le lundi qui commence la semaine prochaine (aujourd'hui si c'est un lundi).
function nextMonday(today: string): string {
  const date = new Date(`${today}T00:00:00Z`);
  const offset = (8 - date.getUTCDay()) % 7;
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

async function NewProgram({
  orgId,
  query,
}: {
  orgId: string;
  query: Record<string, string | string[] | undefined>;
}) {
  const { membership } = await requireOrgAccess(orgId);
  const organizationId = membership.organizationId;
  const base = `/coach/o/${organizationId}/programmes`;
  const data = await loadWizardData(organizationId);
  const templateMode = query.modele === "nouveau";
  const templateId =
    typeof query.modele === "string" && data.templates.some((t) => t.id === query.modele)
      ? query.modele
      : null;
  const athleteId =
    typeof query.sportif === "string" && data.athletes.some((a) => a.id === query.sportif)
      ? query.sportif
      : null;

  return (
    <>
      <PageHeader
        title={templateMode ? "Nouveau modèle" : "Nouveau programme"}
        back={{ href: templateMode ? `${base}?onglet=modeles` : base, label: "Programmes" }}
        visibleTitle={false}
      />
      <PageBody fill>
        <ProgramWizard
          organizationId={organizationId}
          base={base}
          data={data}
          templateMode={templateMode}
          initialAthleteId={athleteId}
          initialTemplateId={templateId}
          initialCopy={query.depart === "copie"}
          defaultStartDate={nextMonday(todayIsoInBrussels())}
        />
      </PageBody>
    </>
  );
}
