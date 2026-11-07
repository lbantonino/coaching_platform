import type { Metadata } from "next";

import { LEGAL } from "@/config/legal";

import { LegalDocument } from "../legal-notice";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
};

export default function PrivacyPage() {
  return (
    <LegalDocument
      href="/confidentialite"
      title="Politique de confidentialité"
      intro="Quelles données Coory enregistre, pourquoi, qui peut les voir et comment exercer tes droits."
      sections={[
        {
          title: "Responsable du traitement",
          body: (
            <p>
              {LEGAL.publisher}, éditeur de Coory, pour les données des comptes (contact :{" "}
              <a href={`mailto:${LEGAL.contactEmail}`} className="font-semibold text-text">
                {LEGAL.contactEmail}
              </a>
              ). Pour les données qu’un coach saisit sur ses sportifs, le coach est responsable de
              traitement et Coory agit comme sous-traitant [à confirmer avec un juriste, clauses de
              sous-traitance à ajouter aux conditions d’utilisation].
            </p>
          ),
        },
        {
          title: "Données collectées",
          body: (
            <p>
              <strong>Compte</strong> : prénom, nom, adresse e-mail, téléphone (facultatif), photo
              (facultative), date d’acceptation des conditions. <strong>Suivi sportif</strong>,
              saisi par le coach : objectifs, disponibilités, repères et performances, notes.{" "}
              <strong>Santé</strong> : contraintes physiques, seulement avec l’accord exprès du
              sportif (article 9 du RGPD), effacées s’il retire cet accord.
            </p>
          ),
        },
        {
          title: "Pourquoi",
          body: (
            <p>
              Fournir le service de coaching (exécution du contrat), sécuriser les comptes (intérêt
              légitime), et les données de santé uniquement sur la base du consentement. Aucune
              vente de données, aucune publicité.
            </p>
          ),
        },
        {
          title: "Qui y a accès",
          body: (
            <p>
              Le coach et les personnes de son organisation ; le sportif pour ce qui le concerne.
              Chaque espace de coach est séparé des autres. Hébergement : Supabase (base de données
              et fichiers) dans l’Union européenne [région à confirmer à la mise en ligne], et
              Vercel (application) [à confirmer à la mise en ligne].
            </p>
          ),
        },
        {
          title: "Durée de conservation",
          body: (
            <p>
              [Durées à définir : compte actif, après fermeture, factures et obligations légales.]
            </p>
          ),
        },
        {
          title: "Tes droits",
          body: (
            <p>
              Accès, rectification, effacement, limitation, opposition, portabilité, retrait du
              consentement à tout moment, et réclamation auprès de l’Autorité de protection des
              données (Belgique). Pour les exercer :{" "}
              <a href={`mailto:${LEGAL.contactEmail}`} className="font-semibold text-text">
                {LEGAL.contactEmail}
              </a>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
