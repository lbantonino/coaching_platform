import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { requireOrgAccess } from "@/features/auth/guards";
import {
  getProgramTemplate,
  getSessionTemplate,
  listSessionTemplateChoices,
} from "@/features/programs/templates";
import { loadWizardData, nextMonday } from "@/features/programs/wizard";
import { todayIsoInBrussels } from "@/lib/format";

import { EditorProvider } from "../../_editor/editor-provider";
import { EditorHeaderActions, ProgramEditor, type EditorMeta } from "../../_editor/program-editor";
import { SafeBack } from "../../_session/safe-leave";

import { SessionTemplateView } from "./session-template-view";
import { UseTemplateSheet } from "./use-template-sheet";

export const metadata: Metadata = {
  title: "Modèle",
};

// Un modèle (onglet Modèles de la page Programmes). Modèle de programme : l'éditeur de programme,
// sans sportif ni dates (« Semaine 1 à N ») ; un modèle Coory s'y lit sans se modifier. Modèle de
// séance : son détail, à dupliquer ou archiver.
export default function TemplatePage({
  params,
  searchParams,
}: PageProps<"/coach/o/[orgId]/programmes/modeles/[templateId]">) {
  return (
    <main className={`${pageMainClass} lg:h-dvh lg:flex-none`}>
      <Suspense fallback={<PageLoading />}>
        {Promise.all([params, searchParams]).then(([{ orgId, templateId }, query]) => (
          <Template
            orgId={orgId}
            templateId={templateId}
            // Retour de l'éditeur d'une séance du modèle : sa semaine et la séance.
            focus={{
              week: Number(typeof query.semaine === "string" ? query.semaine : NaN) || null,
              session: typeof query.seance === "string" ? query.seance : null,
            }}
            // « Utiliser » depuis la carte de la liste (D-178) : la fenêtre s'ouvre dès l'arrivée.
            openUse={query.utiliser === "1"}
          />
        ))}
      </Suspense>
    </main>
  );
}

async function Template({
  orgId,
  templateId,
  focus,
  openUse,
}: {
  orgId: string;
  templateId: string;
  focus: EditorMeta["focus"];
  openUse: boolean;
}) {
  const { membership } = await requireOrgAccess(orgId);
  const organizationId = membership.organizationId;
  const base = `/coach/o/${organizationId}/programmes`;
  const back = { href: `${base}?onglet=modeles`, label: "Modèles" };

  const program = await getProgramTemplate(organizationId, templateId);
  if (program?.plan) {
    const [sessionTemplates, wizard] = await Promise.all([
      listSessionTemplateChoices(organizationId, program.plan.discipline),
      loadWizardData(organizationId),
    ]);
    const useTemplate = wizard.templates.find((template) => template.id === program.id);
    // Chaque arrivée repart d'une fenêtre neuve (Next 16 garde l'état d'une page déjà visitée).
    const visit = crypto.randomUUID();
    const meta: EditorMeta = {
      base,
      mode: "template",
      athlete: null,
      publication: null,
      athleteHref: null,
      today: todayIsoInBrussels(),
      templateSource: program.source,
      focus,
      sessionTemplates,
      returnTo: null,
      publishContext: null,
    };
    return (
      <EditorProvider
        key={`${program.id}:${program.version}`}
        organizationId={organizationId}
        target={{ kind: "template", templateId: program.id }}
        readOnly={program.source === "coory"}
        initialPlan={program.plan}
        initialRevision={program.version}
      >
        <SafeBack>
          <PageHeader
            title={program.title}
            back={back}
            visibleTitle={false}
            phoneBack={false}
            actions={<EditorHeaderActions base={base} />}
          />
        </SafeBack>
        <PageBody fill>
          <ProgramEditor meta={meta} />
        </PageBody>
        {useTemplate ? (
          <UseTemplateSheet
            key={visit}
            organizationId={organizationId}
            base={base}
            template={useTemplate}
            athletes={wizard.athletes}
            defaultStartDate={nextMonday(todayIsoInBrussels())}
            openOnLoad={openUse}
          />
        ) : null}
      </EditorProvider>
    );
  }

  const session = program ? null : await getSessionTemplate(organizationId, templateId);
  if (!session?.session) notFound();
  return (
    <>
      <PageHeader title={session.title} back={back} visibleTitle={false} />
      <PageBody>
        <SessionTemplateView
          organizationId={organizationId}
          base={base}
          templateId={session.id}
          source={session.source}
          session={session.session}
        />
      </PageBody>
    </>
  );
}
