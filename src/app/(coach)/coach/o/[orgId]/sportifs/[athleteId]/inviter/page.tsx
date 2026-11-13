import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { requireOrgAccess } from "@/features/auth/guards";
import { revokeInvitation } from "@/features/invitations/actions";
import { getInviteTarget } from "@/features/invitations/queries";
import { FEATURES } from "@/config/features";
import { INVITATION_VALIDITY_DAYS } from "@/features/invitations/token";

import { InvitePanel } from "./invite-form";

export const metadata: Metadata = {
  title: "Inviter un sportif",
  robots: { index: false },
};

// « Inviter un sportif » (kit « Coory Pages », page 09, D-119). En-tête standard : « ← écran
// précédent » puis « Inviter Sophie Lambert » sur ordinateur ; sur téléphone, le retour est dans la
// barre du haut et le titre (« Inviter Sophie », prénom seul) en tête du contenu. Une carte de 560 px
// centrée (pleine largeur sur téléphone) avec le sportif, la pastille d'état et l'action ; quatre
// états : pas encore invité, lien généré, en attente, compte activé (plus : lien expiré, fiche sans
// e-mail). Coory n'envoie rien : le coach copie le lien ou l'ouvre dans WhatsApp, son e-mail, ses SMS.
export default function InviteAthletePage({
  params,
}: PageProps<"/coach/o/[orgId]/sportifs/[athleteId]/inviter">) {
  // MVP espace coach seul (D-167) : page masquée, le code reste.
  if (!FEATURES.invitations) notFound();
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

  const fichePath = `${listPath}/${target.athleteId}`;
  return (
    <>
      <PageHeader
        title={
          <>
            <span className="lg:hidden">Inviter {target.firstName}</span>
            <span className="max-lg:hidden">Inviter {target.displayName}</span>
          </>
        }
        // Ouverte directement : « ← Sophie Lambert », le titre de la fiche (l'écran précédent).
        back={{ href: fichePath, label: target.displayName }}
      />
      <PageBody>
        <InvitePanel
          organizationId={membership.organizationId}
          athlete={{
            id: target.athleteId,
            firstName: target.firstName,
            displayName: target.displayName,
            email: target.email,
            phone: target.phone,
            sex: target.sex,
            photoPath: target.photoPath,
          }}
          hasAccount={target.hasAccount}
          pendingInvite={target.pendingInvite}
          fichePath={fichePath}
          revoke={revokeInvitation.bind(null, membership.organizationId, target.athleteId)}
          validityDays={INVITATION_VALIDITY_DAYS}
        />
      </PageBody>
    </>
  );
}
