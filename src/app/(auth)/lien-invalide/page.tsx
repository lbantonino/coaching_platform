import { Info, Link2Off } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import {
  EntryIcon,
  entryPrimaryClass,
  entrySecondaryClass,
  EntryTitle,
  InfoCard,
  InfoRow,
} from "@/components/layout/entry-ui";
import { INVITATION_VALIDITY_DAYS } from "@/features/invitations/token";

export const metadata: Metadata = {
  title: "Lien invalide",
  robots: { index: false },
};

// Lien e-mail expiré, déjà utilisé, ouvert dans un autre navigateur ou falsifié (prompt §7.1).
// Durées réelles : liens e-mail 1 h (otp_expiry), invitations INVITATION_VALIDITY_DAYS jours.
export default function InvalidLinkPage() {
  return (
    <div className="flex flex-col gap-[22px]">
      <EntryIcon icon={Link2Off} />
      <EntryTitle
        sub={`Il a expiré, a déjà été utilisé, ou a été ouvert dans un autre navigateur que celui de la demande. Les liens reçus par e-mail sont valables 1 h et les invitations ${INVITATION_VALIDITY_DAYS} jours.`}
      >
        Ce lien n&apos;est plus valide
      </EntryTitle>
      <InfoCard>
        <InfoRow icon={Info}>
          Invitation d&apos;un coach ? Demande-lui de t&apos;en envoyer une nouvelle depuis ta
          fiche.
        </InfoRow>
      </InfoCard>
      <Link href="/mot-de-passe-oublie" className={entryPrimaryClass}>
        Demander un nouveau lien
      </Link>
      <Link href="/login" className={entrySecondaryClass}>
        Retour à la connexion
      </Link>
    </div>
  );
}
