import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { errorTextClass } from "@/components/ui/form-styles";
import { LogoutButton } from "@/components/ui/logout-button";
import { getCurrentUser } from "@/features/auth/session";
import { getPublicInvitation } from "@/features/invitations/queries";
import { invitationTokenSchema } from "@/features/invitations/token";
import { formatDateTime } from "@/lib/format";

import { AcceptForm } from "./accept-form";

export const metadata: Metadata = {
  title: "Invitation",
  robots: { index: false },
};

// Page publique : seule la possession du lien (jeton secret) donne accès à l'invitation.
export default function InvitationPage({ params }: PageProps<"/invitation/[token]">) {
  return (
    <div className="flex w-full flex-col gap-6">
      <Suspense fallback={<p className="text-muted">Vérification de l&apos;invitation…</p>}>
        {params.then(({ token }) => (
          <InvitationSection token={token} />
        ))}
      </Suspense>
    </div>
  );
}

const unavailableMessages = {
  accepted: "Cette invitation a déjà été acceptée. Connecte-toi pour accéder à ton espace.",
  revoked: "Cette invitation a été annulée par ton coach. Demande-lui un nouveau lien.",
  expired: "Cette invitation a expiré. Demande un nouveau lien à ton coach.",
} as const;

async function InvitationSection({ token }: { token: string }) {
  const invitation = invitationTokenSchema.safeParse(token).success
    ? await getPublicInvitation(token)
    : null;

  if (!invitation || invitation.status !== "pending") {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-h2 font-medium">Invitation indisponible</h1>
        <p className="text-muted">
          {invitation && invitation.status !== "pending"
            ? unavailableMessages[invitation.status]
            : "Ce lien d'invitation n'est pas valide. Vérifie qu'il a été copié en entier."}
        </p>
        <Link href="/login" className="font-medium text-text underline underline-offset-4">
          Aller à la connexion
        </Link>
      </div>
    );
  }

  const user = await getCurrentUser();
  const sameAccount =
    user?.email && invitation.email && user.email.toLowerCase() === invitation.email.toLowerCase();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-small text-muted">{invitation.organizationName}</p>
        <h1 className="font-display text-h2 font-medium">Bienvenue {invitation.athleteName}</h1>
        <p className="text-small text-muted">
          Ton coach t&apos;invite à rejoindre ton espace sportif. Invitation valable jusqu&apos;au{" "}
          {formatDateTime(invitation.expiresAt)}.
        </p>
      </div>

      {user && !sameAccount ? (
        <div className="flex flex-col gap-4">
          <p role="alert" className={errorTextClass}>
            Tu es connecté avec un autre compte ({user.email}). Déconnecte-toi, puis rouvre ce lien.
          </p>
          <LogoutButton />
        </div>
      ) : (
        <AcceptForm token={token} email={invitation.email ?? ""} isSignedIn={Boolean(user)} />
      )}
    </div>
  );
}
