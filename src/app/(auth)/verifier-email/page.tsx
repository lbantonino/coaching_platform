import { Clock, Inbox, MailCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import {
  EntryIcon,
  entryLinkClass,
  entryPrimaryClass,
  EntryTitle,
  InfoCard,
  InfoRow,
} from "@/components/layout/entry-ui";
import { readSignupEmail } from "@/features/auth/signup-cookie";

import { ResendButton } from "./resend-button";

export const metadata: Metadata = {
  title: "Vérifie ta boîte mail",
  robots: { index: false },
};

// Après l'inscription (prompt Claude Design §7.1). L'adresse vient d'un cookie posé par l'inscription
// (jamais dans l'URL). « J'ai confirmé » mène à la dernière étape : si le lien a été ouvert dans ce
// navigateur, la session existe ; sinon, la page de connexion prend le relais.
export default function VerifyEmailPage() {
  return (
    <div className="flex flex-col gap-[22px]">
      <EntryIcon icon={MailCheck} />
      <Suspense fallback={<VerifyTitle email={null} />}>
        <SignupEmailTitle />
      </Suspense>
      <InfoCard>
        <InfoRow icon={Clock}>
          Le lien est valable <strong>1 h</strong>.
        </InfoRow>
        <InfoRow icon={Inbox}>Rien reçu ? Regarde dans tes courriers indésirables.</InfoRow>
      </InfoCard>
      <Link href="/bienvenue" className={entryPrimaryClass}>
        J&apos;ai confirmé mon e-mail
        <span aria-hidden className="text-[18px]">
          →
        </span>
      </Link>
      <ResendButton />
      <p className="text-center text-[14px] text-muted">
        Mauvaise adresse ?{" "}
        <Link href="/inscription" className={entryLinkClass}>
          Modifier l&apos;adresse
        </Link>
      </p>
    </div>
  );
}

async function SignupEmailTitle() {
  return <VerifyTitle email={await readSignupEmail()} />;
}

function VerifyTitle({ email }: { email: string | null }) {
  return (
    <EntryTitle
      sub={
        email ? (
          <>
            On vient de t&apos;envoyer un lien de confirmation à{" "}
            <strong className="font-semibold text-text">{email}</strong>. Clique dessus pour activer
            ton compte.
          </>
        ) : (
          "On vient de t'envoyer un lien de confirmation. Clique dessus pour activer ton compte."
        )
      }
    >
      Vérifie ta boîte mail
    </EntryTitle>
  );
}
