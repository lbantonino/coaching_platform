import type { Metadata } from "next";
import { Suspense } from "react";

import { buttonClass } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { LogoutButton } from "@/components/ui/logout-button";
import { requireAthleteAccount } from "@/features/auth/guards";
import {
  grantHealthConsentByAthlete,
  withdrawHealthConsentByAthlete,
} from "@/features/consents/actions";
import { getOwnHealthConsents, type OwnHealthConsent } from "@/features/consents/queries";
import { getOwnCoachMessages } from "@/features/notes/queries";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Mon espace sportif",
};

export default function AthleteHomePage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-5 py-10">
      <h1 className="font-display text-h2 font-medium">Mon espace sportif</h1>
      <Suspense fallback={<p className="text-muted">Chargement de ton espace…</p>}>
        <AthleteSession />
      </Suspense>
    </main>
  );
}

// Espace sportif volontairement minimal et honnête : les programmes arrivent en P5/P6.
async function AthleteSession() {
  const { user, links, waiting } = await requireAthleteAccount();
  // Sportif inscrit seul (D-30) : son compte existe, aucun coach ne l'a encore rattaché.
  if (waiting) {
    return (
      <div className="flex flex-col gap-6">
        <p className="text-muted">
          Connecté en tant que <span className="font-medium text-current">{user.email}</span>
        </p>
        <section
          aria-labelledby="waiting-title"
          className="flex flex-col gap-2 rounded-card border border-line bg-surface p-5"
        >
          <h2 id="waiting-title" className="text-title font-medium">
            Ton compte est prêt
          </h2>
          <p className="text-small text-muted">
            Pour voir tes séances, ton coach doit te rattacher à son espace. Donne-lui ton adresse
            e-mail ({user.email}) : il t&apos;enverra un lien d&apos;invitation. Ouvre-le en étant
            connecté, et ta fiche sera liée à ce compte.
          </p>
        </section>
        <LogoutButton />
      </div>
    );
  }
  const coaches = links.map((link) => link.organizationName).join(", ");
  const consents = await getOwnHealthConsents(user.id);
  const messages = await getOwnCoachMessages();

  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted">
        Connecté en tant que <span className="font-medium text-current">{user.email}</span>
      </p>
      <p role="status" className="rounded-card border border-line bg-surface p-4">
        Ton coach ({coaches}) t&apos;a ajouté. Ton programme apparaîtra ici dès qu&apos;il sera
        publié.
      </p>
      {consents.map((consent) => {
        const message = messages.get(consent.athleteId);
        return message ? (
          <section
            key={`message-${consent.athleteId}`}
            aria-labelledby={`message-${consent.athleteId}`}
            className="flex flex-col gap-2 rounded-card border border-line bg-surface p-5"
          >
            <h2 id={`message-${consent.athleteId}`} className="text-title font-medium">
              Message de ton coach
            </h2>
            <p className="text-small whitespace-pre-line">{message.body}</p>
            <p className="text-caption text-muted">
              {consent.organizationName} · {formatDateTime(message.updatedAt)}
            </p>
          </section>
        ) : null;
      })}
      {consents.map((consent) => (
        <HealthConsentCard key={consent.athleteId} consent={consent} />
      ))}
      <LogoutButton />
    </div>
  );
}

// Accord du sportif pour que son coach note ses contraintes physiques (données de santé, D-20).
// Le sportif voit ce qui a été noté sur lui et peut retirer son accord à tout moment (effacement).
function HealthConsentCard({ consent }: { consent: OwnHealthConsent }) {
  const titleId = `health-${consent.athleteId}`;
  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col gap-3 rounded-card border border-line bg-surface p-5"
    >
      <h2 id={titleId} className="text-title font-medium">
        Tes contraintes physiques
      </h2>
      {consent.consentAt ? (
        <>
          <p className="text-small">
            Tu as donné ton accord le {formatDateTime(consent.consentAt)} :{" "}
            {consent.organizationName} peut noter tes blessures ou contraintes physiques pour
            adapter tes séances.
          </p>
          <div className="flex flex-col gap-1 rounded-[14px] border border-line bg-bg p-4">
            <p className="text-caption text-muted">Ce que ton coach a noté</p>
            <p className="text-small">{consent.healthConstraints ?? "Rien pour l'instant."}</p>
          </div>
          <form action={withdrawHealthConsentByAthlete.bind(null, consent.athleteId)}>
            <ConfirmSubmitButton
              message="Retirer ton accord efface ce que ton coach a noté. Continuer ?"
              className={buttonClass({ variant: "outline", size: "md" })}
            >
              Retirer mon accord
            </ConfirmSubmitButton>
          </form>
        </>
      ) : (
        <>
          <p className="text-small text-muted">
            {consent.organizationName} aimerait pouvoir noter tes éventuelles blessures ou
            contraintes physiques (par exemple une douleur au genou) pour adapter tes séances.
            Seulement ce qui change l&apos;entraînement, jamais de diagnostic médical.
          </p>
          <p className="text-small text-muted">
            Tu peux retirer ton accord à tout moment : ce qui a été noté sera alors effacé.
          </p>
          <form action={grantHealthConsentByAthlete.bind(null, consent.athleteId)}>
            <button type="submit" className={buttonClass({ variant: "primary", size: "md" })}>
              J&apos;accepte
            </button>
          </form>
        </>
      )}
    </section>
  );
}
