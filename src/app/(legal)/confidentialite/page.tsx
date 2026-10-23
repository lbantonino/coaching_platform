import type { Metadata } from "next";

import { LegalSection, ProvisionalNotice } from "../legal-notice";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
};

export default function PrivacyPage() {
  return (
    <article className="flex flex-col gap-6">
      <h1 className="font-display text-heading font-semibold lg:text-heading-lg">
        Politique de confidentialité
      </h1>
      <ProvisionalNotice />
      <LegalSection title="Responsable du traitement">
        <p>
          [Nom de l&apos;éditeur et adresse de contact pour la protection des données]. Pour les
          données qu&apos;un coach saisit sur ses sportifs, le coach est responsable de traitement
          et Coory agit comme sous-traitant [à confirmer avec un juriste, contrat de sous-traitance
          à prévoir].
        </p>
      </LegalSection>
      <LegalSection title="Données collectées">
        <p>
          <strong>Compte</strong> : prénom, nom, adresse e-mail, téléphone (facultatif), photo
          (facultative), date d&apos;acceptation des conditions. <strong>Suivi sportif</strong>,
          saisi par le coach : objectifs, disponibilités, repères et performances, notes.
          <strong> Santé</strong> : contraintes physiques, seulement avec l&apos;accord exprès du
          sportif (article 9 du RGPD), effacées s&apos;il retire cet accord.
        </p>
      </LegalSection>
      <LegalSection title="Pourquoi">
        <p>
          Fournir le service de coaching (exécution du contrat), sécuriser les comptes (intérêt
          légitime), et les données de santé uniquement sur la base du consentement. Aucune vente de
          données, aucune publicité.
        </p>
      </LegalSection>
      <LegalSection title="Qui y a accès">
        <p>
          Le coach et les personnes de son organisation ; le sportif pour ce qui le concerne. Chaque
          espace de coach est séparé des autres. Hébergement : Supabase, [région de l&apos;Union
          européenne à confirmer à la mise en ligne].
        </p>
      </LegalSection>
      <LegalSection title="Durée de conservation">
        <p>[Durées à définir : compte actif, après fermeture, factures et obligations légales.]</p>
      </LegalSection>
      <LegalSection title="Tes droits">
        <p>
          Accès, rectification, effacement, limitation, opposition, portabilité, retrait du
          consentement à tout moment, et réclamation auprès de l&apos;Autorité de protection des
          données (Belgique). Pour les exercer : [adresse de contact].
        </p>
      </LegalSection>
    </article>
  );
}
