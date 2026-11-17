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
              sportif (article 9 du RGPD), effacées s’il retire cet accord. <strong>Garmin</strong>{" "}
              (facultatif) : tes activités terminées, si tu relies ton compte Garmin Connect (voir «
              Connexion à Garmin Connect »).
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
              Chaque espace de coach est séparé des autres. Hébergement dans l’Union européenne :
              Supabase (base de données et fichiers) en Irlande, et Vercel (application) sur ses
              serveurs de Dublin, en Irlande.
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
        {
          // Rubrique exigée par Garmin (formulaire « Add app » du portail développeur, lu le
          // 17/11/2026) : usage des données Garmin, TOUS les tiers qui les traitent, vente ou non,
          // IA, accès/correction/effacement/export et retrait du consentement. Chaque phrase est un
          // engagement à respecter dans le code de la connexion Garmin.
          title: "Connexion à Garmin Connect",
          body: (
            <>
              <p>
                Si tu relies ton compte <strong>Garmin Connect</strong> à Coory, ton coach peut
                envoyer tes séances de course sur ta montre, et tes activités terminées reviennent
                dans Coory. Cette connexion est facultative : Coory fonctionne aussi sans montre.
                Responsable de ce traitement : {LEGAL.publisher}, éditeur de Coory [à confirmer avec
                un juriste]. [En préparation : la connexion n’est pas encore ouverte.]
              </p>
              <p>
                <strong>Ce que Coory envoie à Garmin</strong> : les séances que ton coach a publiées
                pour toi (nom, date, étapes, allures ou zones de fréquence cardiaque visées). Une
                fois dans Garmin Connect, elles relèvent aussi de la politique de confidentialité de
                Garmin.
              </p>
              <p>
                <strong>Ce que Coory reçoit de Garmin</strong> : tes activités terminées après la
                connexion (type d’activité, date et heure, durée, distance, allure ou vitesse,
                fréquence cardiaque, dénivelé, détail par tour), sans historique d’avant la
                connexion. Coory ne garde pas ton tracé GPS. Ces données servent uniquement à
                marquer la séance prévue comme faite et à montrer, à toi et à ton coach, ce qui
                était prévu et ce que tu as réalisé.
              </p>
              <p>
                <strong>Base légale</strong> : ton consentement explicite, donné quand tu relies ton
                compte (articles 6 et 9 du RGPD, car la fréquence cardiaque peut renseigner sur ta
                santé). Tu peux le retirer à tout moment.
              </p>
              <p>
                <strong>Qui y a accès</strong> : toi et ton coach, avec les personnes de son
                organisation qui te suivent. Deux prestataires techniques seulement traitent ces
                données : Supabase (base de données, Irlande) et Vercel (application, Dublin,
                Irlande). Aucun autre tiers ne les reçoit, ni service de statistiques, ni régie
                publicitaire, ni fournisseur d’intelligence artificielle.
              </p>
              <p>
                <strong>Intelligence artificielle</strong> : l’Assistant IA de Coory ne lit jamais
                tes données Garmin, et elles ne servent jamais à entraîner, évaluer ou améliorer un
                modèle d’intelligence artificielle.
              </p>
              <p>
                <strong>Jamais vendues</strong> : tes données Garmin ne sont ni vendues, ni louées,
                ni partagées à des fins commerciales.
              </p>
              <p>
                <strong>Durée de conservation</strong> : tant que ton compte Garmin est relié et que
                ton compte Coory existe. Si tu déconnectes Garmin ou fermes ton compte, Coory arrête
                tout échange avec Garmin et efface les données reçues de Garmin dans les 30 jours au
                plus tard. Les séances déjà envoyées restent dans ton calendrier Garmin Connect, où
                tu peux les supprimer.
              </p>
              <p>
                <strong>Tes droits</strong> : pour retirer ton consentement, déconnecte Garmin
                depuis ton profil Coory ou depuis les applications connectées de ton compte Garmin
                Connect. Pour consulter, recevoir une copie (dans un format lisible), corriger ou
                effacer tes données Garmin, écris à{" "}
                <a href={`mailto:${LEGAL.contactEmail}`} className="font-semibold text-text">
                  {LEGAL.contactEmail}
                </a>
                , réponse sous un mois. Une activité erronée peut aussi être corrigée ou supprimée
                dans Garmin Connect.
              </p>
              <p>Garmin et Garmin Connect sont des marques de Garmin Ltd. ou de ses filiales.</p>
            </>
          ),
        },
      ]}
    />
  );
}
