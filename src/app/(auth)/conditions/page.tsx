import type { Metadata } from "next";

import { LegalSection, ProvisionalNotice } from "../legal-notice";

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
};

export default function TermsPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 py-8 sm:py-12">
      <h1 className="font-display text-h2 font-medium">Conditions d&apos;utilisation</h1>
      <ProvisionalNotice />
      <LegalSection title="1. Objet">
        <p>
          Coory est une application de coaching sportif : un coach y gère ses sportifs, son agenda
          et, à terme, leurs programmes ; un sportif y consulte ce que son coach lui partage.
        </p>
      </LegalSection>
      <LegalSection title="2. Éditeur">
        <p>
          [Nom ou raison sociale de l&apos;éditeur, adresse, numéro d&apos;entreprise, adresse de
          contact].
        </p>
      </LegalSection>
      <LegalSection title="3. Compte">
        <p>
          L&apos;inscription est réservée aux personnes de <strong>18 ans ou plus</strong>. Tu
          fournis des informations exactes, tu gardes ton mot de passe secret et tu confirmes ton
          adresse e-mail. Un compte de coach crée un espace privé que lui seul et les personnes
          qu&apos;il y ajoute peuvent consulter.
        </p>
      </LegalSection>
      <LegalSection title="4. Rôle du coach et santé">
        <p>
          Coory n&apos;est pas un dispositif médical et ne remplace pas un avis médical. Le coach
          reste responsable des séances qu&apos;il propose. Les informations de santé (contraintes
          physiques) ne sont enregistrées qu&apos;avec l&apos;accord exprès du sportif, qu&apos;il
          peut retirer à tout moment.
        </p>
      </LegalSection>
      <LegalSection title="5. Paiements">
        <p>
          Aucun paiement entre un sportif et son coach ne passe par Coory. [Conditions de
          l&apos;abonnement des coachs à définir avant sa mise en place.]
        </p>
      </LegalSection>
      <LegalSection title="6. Disponibilité et responsabilité">
        <p>
          [Engagements de disponibilité, limites de responsabilité, droit applicable et juridiction
          compétente à rédiger avec un juriste.]
        </p>
      </LegalSection>
      <LegalSection title="7. Résiliation">
        <p>
          Tu peux demander la fermeture de ton compte à tout moment. [Modalités et délais de
          suppression des données à définir, voir la politique de confidentialité.]
        </p>
      </LegalSection>
    </main>
  );
}
