import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

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
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-10">
      <Suspense fallback={<p className="text-muted">Chargement…</p>}>
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
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-h2 font-medium">Sportif introuvable</h1>
        <Link href={listPath} className="underline">
          Retour aux sportifs
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={listPath}
        className="text-small text-muted underline underline-offset-4 hover:text-text"
      >
        ← Retour aux sportifs
      </Link>
      <div className="flex flex-col gap-2">
        <p className="text-small text-muted">{membership.organizationName}</p>
        <h1 className="text-h2 font-medium">Inviter {target.displayName}</h1>
        <p className="text-small text-muted">
          Le sportif ouvrira ce lien pour créer son accès avec l&apos;adresse{" "}
          <span className="font-medium text-current">{target.email ?? "(aucune)"}</span>. Le lien
          est valable {INVITATION_VALIDITY_DAYS} jours et ne sert qu&apos;une fois. Aucun message
          n&apos;est envoyé automatiquement : copie le lien et transmets-le toi-même.
        </p>
      </div>

      {target.hasAccount ? (
        <p role="status" className="rounded-[14px] border border-line bg-surface p-4">
          Ce sportif a déjà activé son compte.
        </p>
      ) : (
        <>
          {target.pendingInvite ? (
            <div className="flex flex-col gap-3 rounded-[14px] border border-line bg-surface p-4">
              <p role="status">
                {target.pendingInvite.expired
                  ? `Le dernier lien a expiré le ${formatDateTime(target.pendingInvite.expiresAt)}.`
                  : `Un lien est en attente jusqu'au ${formatDateTime(target.pendingInvite.expiresAt)}. Pour des raisons de sécurité, il ne peut pas être réaffiché : génère un nouveau lien si besoin.`}
              </p>
              <form
                action={revokeInvitation.bind(null, membership.organizationId, target.athleteId)}
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
  );
}
