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
import { todayIsoInBrussels } from "@/lib/format";

import { EditorProvider } from "../../_editor/editor-provider";
import { EditorHeaderActions, ProgramEditor, type EditorMeta } from "../../_editor/program-editor";
import { SafeBack } from "../../_session/safe-leave";

import { SessionTemplateView } from "./session-template-view";

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
}: {
  orgId: string;
  templateId: string;
  focus: EditorMeta["focus"];
}) {
  const { membership } = await requireOrgAccess(orgId);
  const organizationId = membership.organizationId;
  const base = `/coach/o/${organizationId}/programmes`;
  const back = { href: `${base}?onglet=modeles`, label: "Modèles" };

  const program = await getProgramTemplate(organizationId, templateId);
  if (program?.plan) {
    const sessionTemplates = await listSessionTemplateChoices(
      organizationId,
      program.plan.discipline,
    );
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
