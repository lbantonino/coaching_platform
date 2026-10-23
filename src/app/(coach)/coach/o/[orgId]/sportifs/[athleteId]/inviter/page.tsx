import type { Metadata } from "next";
import { Suspense } from "react";

import { HeaderTools } from "@/components/layout/header-tools";
import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { requireOrgAccess } from "@/features/auth/guards";
import { revokeInvitation } from "@/features/invitations/actions";
import { getInviteTarget } from "@/features/invitations/queries";
import { INVITATION_VALIDITY_DAYS } from "@/features/invitations/token";
import { formatDateTime } from "@/lib/format";

import { InviteForm } from "./invite-form";

export const metadata: Metadata = {
  title: "Inviter un sportif",
  robots: { index: false },
};

export default function InviteAthletePage({
  params,
}: PageProps<"/coach/o/[orgId]/sportifs/[athleteId]/inviter">) {
  return (
    <main className={pageMainClass}>
      <Suspense fallback={<PageLoading />}>
        {params.then(({ orgId, athleteId }) => (
          <InviteSection orgId={orgId} athleteId={athleteId} />
        ))}
      </Suspense>
    </main>
  );
}

async function InviteSection({ orgId, athleteId }: { orgId: string; athleteId: string }) {
  const { membership } = await requireOrgAccess(orgId);
  const listPath = `/coach/o/${membership.organizationId}/sportifs`;
  const target = await getInviteTarget(membership.organizationId, athleteId);

  if (!target) {
    return <PageHeader title="Sportif introuvable" back={{ href: listPath, label: "Sportifs" }} />;
  }

  return (
    <>
      {/* Ordinateur (demande d'Antonino) : recherche, assistant et cloche en haut à droite comme sur
          les autres pages, et l'invitation centrée au milieu de l'écran. Téléphone : inchangé (ces
          enveloppes n'ont que des classes lg:). */}
      <div className="hidden justify-end px-8 pt-7 lg:flex">
        <HeaderTools />
      </div>
      <div className="lg:flex lg:flex-1 lg:items-center lg:justify-center lg:pb-16">
        <div className="lg:w-full lg:max-w-[600px]">
          <PageHeader
            title={`Inviter ${target.displayName}`}
            back={{ href: `${listPath}/${target.athleteId}`, label: "Fiche sportif" }}
            subtitle="Génère un lien personnel et envoie-le toi-même (WhatsApp, e-mail, SMS)."
            tools={false}
          />
          <PageBody>
            <div className="flex w-full max-w-lg flex-col gap-6">
              <p className="text-small text-muted">
                Le sportif ouvrira ce lien pour créer son accès avec l&apos;adresse{" "}
                <span className="font-medium text-current">{target.email ?? "(aucune)"}</span>. Le
                lien est valable {INVITATION_VALIDITY_DAYS} jours et ne sert qu&apos;une fois. Aucun
                message n&apos;est envoyé automatiquement : copie le lien et transmets-le toi-même.
              </p>

              {target.hasAccount ? (
                <p role="status" className="rounded-card border border-line bg-surface p-4">
                  Ce sportif a déjà activé son compte.
                </p>
              ) : (
                <>
                  {target.pendingInvite ? (
                    <div className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
                      <p role="status">
                        {target.pendingInvite.expired
                          ? `Le dernier lien a expiré le ${formatDateTime(target.pendingInvite.expiresAt)}.`
                          : `Un lien est en attente jusqu'au ${formatDateTime(target.pendingInvite.expiresAt)}. Pour des raisons de sécurité, il ne peut pas être réaffiché : génère un nouveau lien si besoin.`}
                      </p>
                      <form
                        action={revokeInvitation.bind(
                          null,
                          membership.organizationId,
                          target.athleteId,
                        )}
                      >
                        <button
                          type="submit"
                          className="text-small font-medium text-text underline underline-offset-4"
                        >
                          Révoquer ce lien
                        </button>
                      </form>
                    </div>
                  ) : null}
                  <InviteForm
                    organizationId={membership.organizationId}
                    athleteId={target.athleteId}
                    hasPendingInvite={target.pendingInvite !== null}
                    hasEmail={target.email !== null}
                  />
                </>
              )}
            </div>
          </PageBody>
        </div>
      </div>
    </>
  );
}
