import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { LogoutButton } from "@/components/ui/logout-button";
import { getCurrentUser } from "@/features/auth/session";
import { getPublicInvitation } from "@/features/invitations/queries";
import { invitationTokenSchema } from "@/features/invitations/token";
import { formatDateTime } from "@/lib/format";

import { AcceptForm } from "./accept-form";

export const metadata: Metadata = {
  title: "Invitation | Coaching Platform",
  robots: { index: false },
};

// Page publique : seule la possession du lien (jeton secret) donne accès à l'invitation.
export default function InvitationPage({ params }: PageProps<"/invitation/[token]">) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-16">
      <Suspense fallback={<p className="text-zinc-500">Vérification de l&apos;invitation…</p>}>
        {params.then(({ token }) => (
          <InvitationSection token={token} />
        ))}
      </Suspense>
    </main>
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
        <h1 className="text-2xl font-semibold tracking-tight">Invitation indisponible</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          {invitation && invitation.status !== "pending"
            ? unavailableMessages[invitation.status]
            : "Ce lien d'invitation n'est pas valide. Vérifie qu'il a été copié en entier."}
        </p>
        <Link href="/login" className="font-medium underline">
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
        <p className="text-sm text-zinc-500">{invitation.organizationName}</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Bienvenue {invitation.athleteName}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Ton coach t&apos;invite à rejoindre ton espace sportif. Invitation valable jusqu&apos;au{" "}
          {formatDateTime(invitation.expiresAt)}.
        </p>
      </div>

      {user && !sameAccount ? (
        <div className="flex flex-col gap-4">
          <p role="alert" className="text-sm text-red-700 dark:text-red-400">
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
