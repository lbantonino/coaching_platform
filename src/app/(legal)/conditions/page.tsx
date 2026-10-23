import type { Metadata } from "next";

import { LegalDocument } from "../legal-notice";

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
};

export default function TermsPage() {
  return (
    <LegalDocument
      href="/conditions"
      title="Conditions d'utilisation"
      intro="Ces conditions encadrent l'utilisation de Coory par les coachs et les sportifs. En créant un compte, tu les acceptes."
      sections={[
        {
          title: "Objet du service",
          body: (
            <p>
              Coory est une application de coaching sportif : un coach y gère ses sportifs, son
              agenda et, à terme, leurs programmes ; un sportif y consulte ce que son coach lui
              partage.
            </p>
          ),
        },
        {
          title: "Éditeur",
          body: (
            <p>
              [Nom ou raison sociale de l&apos;éditeur, adresse, numéro d&apos;entreprise, adresse
              de contact].
            </p>
          ),
        },
        {
          title: "Création du compte",
          body: (
            <p>
              L&apos;inscription est réservée aux personnes de <strong>18 ans ou plus</strong>. Tu
              fournis des informations exactes, tu gardes ton mot de passe secret et tu confirmes
              ton adresse e-mail. Un compte de coach crée un espace privé que lui seul et les
              personnes qu&apos;il y ajoute peuvent consulter.
            </p>
          ),
        },
        {
          title: "Rôle du coach et santé",
          body: (
            <p>
              Coory n&apos;est pas un dispositif médical et ne remplace pas un avis médical. Le
              coach reste responsable des séances qu&apos;il propose. Les informations de santé
              (contraintes physiques) ne sont enregistrées qu&apos;avec l&apos;accord exprès du
              sportif, qu&apos;il peut retirer à tout moment.
            </p>
          ),
        },
        {
          title: "Paiements",
          body: (
            <p>
              Aucun paiement entre un sportif et son coach ne passe par Coory. [Conditions de
              l&apos;abonnement des coachs à définir avant sa mise en place.]
            </p>
          ),
        },
        {
          title: "Disponibilité et responsabilité",
          body: (
            <p>
              [Engagements de disponibilité, limites de responsabilité, droit applicable et
              juridiction compétente à rédiger avec un juriste.]
            </p>
          ),
        },
        {
          title: "Résiliation",
          body: (
            <p>
              Tu peux demander la fermeture de ton compte à tout moment. [Modalités et délais de
              suppression des données à définir, voir la politique de confidentialité.]
            </p>
          ),
        },
      ]}
    />
  );
}
