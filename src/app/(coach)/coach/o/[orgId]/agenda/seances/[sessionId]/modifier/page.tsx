import { Trash2 } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { SessionForm } from "@/components/blocks/session-form";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { Quoted } from "@/components/ui/quoted";
import { listAthletes } from "@/features/athletes/queries";
import { requireOrgAccess } from "@/features/auth/guards";
import { deleteSession, updateSession } from "@/features/sessions/actions";
import { sessionFormInitial } from "@/features/sessions/schemas";
import { getSession } from "@/features/sessions/queries";

export const metadata: Metadata = {
  title: "Modifier la séance",
};

// Modifier une séance, individuelle ou collective (kit « Coory Pages », pages 06 et 12, D-123).
// En-tête : « ← titre de la séance » (sa page, l'écran précédent) puis « Modifier la séance ».
// Supprimer, toujours après confirmation : « Supprimer la séance » en bas de page (ordinateur), la
// corbeille à droite du titre (téléphone) ; il reste aussi dans le menu « ••• » de la séance.
export default function EditSessionPage({
  params,
}: PageProps<"/coach/o/[orgId]/agenda/seances/[sessionId]/modifier">) {
  return (
    <main className={pageMainClass}>
      <Suspense fallback={<PageLoading />}>
        {params.then(({ orgId, sessionId }) => (
          <EditSession orgId={orgId} sessionId={sessionId} />
        ))}
      </Suspense>
    </main>
  );
}

async function EditSession({ orgId, sessionId }: { orgId: string; sessionId: string }) {
  const { membership } = await requireOrgAccess(orgId);
  const organizationId = membership.organizationId;
  if (!z.uuid().safeParse(sessionId).success) notFound();
  const [session, athletes] = await Promise.all([
    getSession(organizationId, sessionId),
    listAthletes(organizationId, { status: "all", q: "" }),
  ]);
  if (!session) notFound();

  const agendaPath = `/coach/o/${organizationId}/agenda`;
  const sessionPath = `${agendaPath}/seances/${session.id}`;
  // Les inscrits déjà présents restent proposés même si leur fiche a été archivée depuis.
  const enrolledIds = new Set(session.athletes.map((athlete) => athlete.id));
  const choices = athletes
    .filter((athlete) => athlete.status !== "archived" || enrolledIds.has(athlete.id))
    .map((athlete) => ({
      id: athlete.id,
      name: athlete.displayName,
      photoPath: athlete.photoPath,
      sex: athlete.sex === "female" || athlete.sex === "male" ? athlete.sex : null,
    }));

  // Même confirmation que la page de la séance (kit, boîte 18). Une série : toutes ses dates.
  const remove = deleteSession.bind(null, organizationId, session.id);
  const deleteText = session.repeatsWeekly ? (
    <>
      <Quoted>{session.title}</Quoted> : toutes ses dates seront supprimées. Pour l&apos;arrêter à
      une date, renseigne plutôt « Jusqu&apos;au ».
    </>
  ) : (
    <>
      <Quoted>{session.title}</Quoted> disparaîtra de l&apos;agenda et des sportifs inscrits.
    </>
  );
  const deleteButton = (variant: "icon" | "link") => (
    <form action={remove}>
      <ConfirmSubmitButton
        title="Supprimer cette séance ?"
        message={deleteText}
        confirmLabel="Supprimer"
        className={
          variant === "icon"
            ? "grid size-11 place-items-center rounded-[13px] bg-surface text-alert shadow-[0_1px_2px_rgba(22,18,40,0.06)] transition-[scale,background-color] duration-150 active:scale-95 active:bg-surface-2"
            : "inline-flex items-center gap-1.5 rounded-[4px] text-[13px] leading-[normal] font-semibold whitespace-nowrap text-alert underline-offset-4 hover:underline"
        }
      >
        <Trash2 aria-hidden size={variant === "icon" ? 17 : 14} strokeWidth={1.8} />
        {variant === "icon" ? (
          <span className="sr-only">Supprimer la séance</span>
        ) : (
          "Supprimer la séance"
        )}
      </ConfirmSubmitButton>
    </form>
  );

  return (
    <>
      <PageHeader
        title="Modifier la séance"
        back={{ href: sessionPath, label: session.title }}
        titleAside={<span className="ml-auto flex lg:hidden">{deleteButton("icon")}</span>}
      />
      <PageBody>
        <SessionForm
          action={updateSession.bind(null, organizationId, session.id)}
          athletes={choices}
          cancelHref={sessionPath}
          athletesPath={`/coach/o/${organizationId}/sportifs`}
          footer={deleteButton("link")}
          initial={sessionFormInitial(session, enrolledIds)}
          locked
          submitLabel="Enregistrer"
        />
      </PageBody>
    </>
  );
}
