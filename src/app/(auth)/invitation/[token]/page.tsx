import { Clock, Link2Off } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import {
  EntryIcon,
  entrySecondaryClass,
  EntryTitle,
  FormAlert,
  InfoCard,
} from "@/components/layout/entry-ui";
import { initials } from "@/components/ui/avatar";
import { LogoutButton } from "@/components/ui/logout-button";
import { SkeletonLines } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/features/auth/session";
import { getPublicInvitation } from "@/features/invitations/queries";
import { invitationTokenSchema } from "@/features/invitations/token";
import { formatDay } from "@/lib/format";

import { AcceptForm } from "./accept-form";

export const metadata: Metadata = {
  title: "Invitation",
  robots: { index: false },
};

// Page publique : seule la possession du lien (jeton secret) donne accès à l'invitation.
// Présentation : prompt Claude Design §7.1. La carte montre l'organisation du coach (le nom du coach
// lui-même n'est pas transmis par la fonction d'invitation).
export default function InvitationPage({ params }: PageProps<"/invitation/[token]">) {
  return (
    <div className="flex flex-col gap-[22px]">
      <Suspense fallback={<SkeletonLines label="Vérification de l'invitation…" />}>
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
      <>
        <EntryIcon icon={Link2Off} />
        <EntryTitle
          sub={
            invitation && invitation.status !== "pending"
              ? unavailableMessages[invitation.status]
              : "Ce lien d'invitation n'est pas valide. Vérifie qu'il a été copié en entier."
          }
        >
          Invitation indisponible
        </EntryTitle>
        <Link href="/login" className={entrySecondaryClass}>
          Aller à la connexion
        </Link>
      </>
    );
  }

  const user = await getCurrentUser();
  const sameAccount =
    user?.email && invitation.email && user.email.toLowerCase() === invitation.email.toLowerCase();

  return (
    <>
      <InfoCard>
        <div className="flex items-center gap-3.5">
          <span
            aria-hidden
            className="inline-flex size-[52px] shrink-0 items-center justify-center rounded-full bg-chip text-[16px] font-semibold"
          >
            {initials(invitation.organizationName)}
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[13px] text-muted">Invitation de ton coach</span>
            <span className="truncate text-[16px] font-semibold">
              {invitation.organizationName}
            </span>
            <span className="text-[13px] text-muted">Pour {invitation.athleteName}</span>
          </span>
        </div>
        <p className="flex items-center gap-2 border-t border-line pt-3 text-[13px] text-muted">
          <Clock aria-hidden size={15} strokeWidth={1.8} />
          Valable jusqu&apos;au {formatDay(invitation.expiresAt)}
        </p>
      </InfoCard>
      <EntryTitle
        sub={
          user
            ? "Accepte l'invitation pour relier ta fiche à ton compte."
            : "Crée ton mot de passe pour accéder à tes séances."
        }
      >
        Rejoins l&apos;espace de ton coach
      </EntryTitle>

      {user && !sameAccount ? (
        <>
          <FormAlert>
            Tu es connecté avec un autre compte ({user.email}). Déconnecte-toi, puis rouvre ce lien.
          </FormAlert>
          <LogoutButton className="[&>button]:h-[52px] [&>button]:w-full" />
        </>
      ) : (
        <AcceptForm token={token} email={invitation.email ?? ""} isSignedIn={Boolean(user)} />
      )}
    </>
  );
}
