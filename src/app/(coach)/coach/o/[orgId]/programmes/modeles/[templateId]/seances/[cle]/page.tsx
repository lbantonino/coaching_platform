import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { findSession } from "@/domain/training/plan-edit";
import { orderedSessions } from "@/domain/training/scheduling";
import { requireOrgAccess } from "@/features/auth/guards";
import { listLibraryChoices } from "@/features/programs/library-choices";
import { getProgramTemplate } from "@/features/programs/templates";

import { EditorProvider } from "../../../../_editor/editor-provider";
import { programHref } from "../../../../_session/links";
import {
  SessionEditor,
  SessionHeaderActions,
  type SessionMeta,
} from "../../../../_session/session-editor";

export const metadata: Metadata = {
  title: "Séance du modèle",
};

// Modifier une séance d'un modèle de programme « Mes modèles » (phase 4, EDT-F09 : avant, le détail
// des séances d'un modèle ne se modifiait que depuis un programme). Même éditeur de séance que pour un
// programme, enregistré dans le modèle (sa version augmente) ; sans sportif, donc sans repères : pas
// de calcul d'allure, de zones ni de % du max, et pas de charges officielles d'une catégorie. Un
// modèle Coory ne se modifie pas : il faut d'abord le dupliquer dans Mes modèles.
export default function TemplateSessionPage({
  params,
}: PageProps<"/coach/o/[orgId]/programmes/modeles/[templateId]/seances/[cle]">) {
  return (
    <main className={pageMainClass}>
      <Suspense fallback={<PageLoading />}>
        {params.then(({ orgId, templateId, cle }) => (
          <TemplateSession orgId={orgId} templateId={templateId} sessionKey={cle} />
        ))}
      </Suspense>
    </main>
  );
}

async function TemplateSession({
  orgId,
  templateId,
  sessionKey,
}: {
  orgId: string;
  templateId: string;
  sessionKey: string;
}) {
  const { user, membership } = await requireOrgAccess(orgId);
  const organizationId = membership.organizationId;
  const template = await getProgramTemplate(organizationId, templateId);
  if (!template?.plan || template.source !== "mine") notFound();
  const found = findSession(template.plan, sessionKey);
  if (!found) notFound();
  const isStrength = found.session.content.discipline === "strength";
  const library = isStrength ? await listLibraryChoices(user.id, organizationId) : [];

  const nobody = "le sportif";
  const meta: SessionMeta = {
    // Les adresses de l'éditeur de séance (retour, duplication) se construisent sur …/modeles/<id>.
    base: `/coach/o/${organizationId}/programmes/modeles`,
    programId: template.id,
    sessionKey,
    weekIndex: found.week.index,
    position: orderedSessions(found.week).findIndex((session) => session.key === sessionKey) + 1,
    athlete: { firstName: nobody, vmaKmh: null, hrMax: null },
    hyrox:
      found.session.content.discipline === "hyrox"
        ? { firstName: nobody, division: null, sex: null }
        : null,
    strength: isStrength ? { athlete: { firstName: nobody, maxes: {} }, library } : null,
    returnTo: null,
  };
  const back = programHref(meta);

  return (
    <EditorProvider
      key={`${template.id}:${template.version}`}
      organizationId={organizationId}
      target={{ kind: "template", templateId: template.id }}
      readOnly={false}
      initialPlan={template.plan}
      initialRevision={template.version}
    >
      <PageHeader
        title={`Séance ${meta.position}`}
        back={{ href: back, label: template.title }}
        visibleTitle={false}
        phoneBack={false}
        actions={<SessionHeaderActions href={back} />}
      />
      <PageBody>
        <SessionEditor meta={meta} />
      </PageBody>
    </EditorProvider>
  );
}
