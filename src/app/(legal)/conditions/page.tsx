import type { Metadata } from "next";
import Link from "next/link";

import { LEGAL } from "@/config/legal";

import { LegalDocument } from "../legal-notice";

export const metadata: Metadata = {
  title: "Conditions d’utilisation",
};

export default function TermsPage() {
  return (
    <LegalDocument
      href="/conditions"
      title="Conditions d’utilisation"
      intro="Ces conditions encadrent l’utilisation de Coory par les coachs et les sportifs. En créant un compte, tu les acceptes."
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
              Coory est éditée par {LEGAL.publisher}, à titre personnel : l’application est en phase
              de test, sans société pour l’instant. Contact :{" "}
              <a href={`mailto:${LEGAL.contactEmail}`} className="font-semibold text-text">
                {LEGAL.contactEmail}
              </a>
              .
            </p>
          ),
        },
        {
          title: "Création du compte",
          body: (
            <p>
              L’inscription est réservée aux personnes de <strong>18 ans ou plus</strong>. Tu
              fournis des informations exactes, tu gardes ton mot de passe secret et tu confirmes
              ton adresse e-mail. Pendant la phase de test, l’inscription demande un code d’accès
              donné par l’éditeur. Un compte de coach crée un espace privé que lui seul et les
              personnes qu’il y ajoute peuvent consulter.
            </p>
          ),
        },
        {
          title: "Rôle du coach et santé",
          body: (
            <p>
              Coory n’est pas un dispositif médical et ne remplace pas un avis médical. Le coach
              reste responsable des séances qu’il propose. Les informations de santé (contraintes
              physiques) ne sont enregistrées qu’avec l’accord exprès du sportif, qu’il peut retirer
              à tout moment.
            </p>
          ),
        },
        {
          // Contrat de sous-traitance (article 28 du RGPD), écrit le 20/11/2026 avec Antonino : le coach
          // est responsable des données de ses sportifs, l'éditeur est son sous-traitant. Chaque
          // engagement ci-dessous doit rester vrai dans le code (prestataires, effacement, export).
          title: "Données de tes sportifs",
          body: (
            <>
              <p>
                Pour les données que tu enregistres sur tes sportifs (identité, coordonnées,
                objectifs, séances, retours, paiements et, avec leur accord, contraintes de santé),
                tu es <strong>responsable du traitement</strong> et l’éditeur de Coory est ton{" "}
                <strong>sous-traitant</strong>, au sens de l’article 28 du RGPD. Ces conditions
                forment votre contrat de sous-traitance, pour toute la durée de ton compte.
              </p>
              <p>L’éditeur s’engage à :</p>
              <ul className="flex list-disc flex-col gap-1.5 pl-5 marker:text-muted">
                <li>
                  utiliser ces données seulement pour faire fonctionner Coory, selon ce que tu fais
                  dans l’application, et jamais pour son propre compte ;
                </li>
                <li>
                  les garder confidentielles : il n’y accède que pour la maintenance ou pour
                  répondre à ta demande ;
                </li>
                <li>
                  les protéger : connexions chiffrées, espace de chaque coach séparé des autres,
                  accès réservé aux personnes de ton organisation ;
                </li>
                <li>
                  ne faire appel qu’aux prestataires listés dans la{" "}
                  <Link href="/confidentialite" className="font-semibold text-text">
                    politique de confidentialité
                  </Link>
                  , tenus aux mêmes obligations, et te prévenir avant d’en ajouter un, pour que tu
                  puisses t’y opposer ;
                </li>
                <li>
                  t’aider à répondre aux demandes de tes sportifs (accès, correction, effacement,
                  copie de leurs données) ;
                </li>
                <li>
                  te prévenir sans tarder en cas de fuite ou d’incident touchant ces données ;
                </li>
                <li>
                  les effacer quand tu supprimes ton compte, après t’avoir permis de les télécharger
                  ;
                </li>
                <li>
                  te donner, sur demande, les informations utiles pour vérifier ces engagements.
                </li>
              </ul>
              <p>
                De ton côté, tu informes tes sportifs que leurs données sont enregistrées dans
                Coory, tu n’y mets que ce qui est utile à leur suivi et tu obtiens leur accord avant
                d’enregistrer une contrainte de santé.
              </p>
            </>
          ),
        },
        {
          title: "Paiements",
          body: (
            <p>
              Aucun paiement entre un sportif et son coach ne passe par Coory. Pendant la phase de
              test, Coory est gratuit ; l’Assistant IA y est réservé aux comptes autorisés par
              l’éditeur. Si un abonnement payant est proposé un jour, son prix et ses conditions te
              seront présentés avant, et rien ne te sera facturé sans ton accord.
            </p>
          ),
        },
        {
          title: "Disponibilité et responsabilité",
          body: (
            <>
              <p>
                Pendant la phase de test, Coory est fourni tel quel : il peut contenir des erreurs,
                être momentanément indisponible ou changer. L’éditeur corrige au plus vite les
                problèmes qui lui sont signalés, sans garantir un service sans interruption. Aucune
                copie de sauvegarde n’est garantie : télécharge régulièrement tes données
                (Paramètres, onglet Données).
              </p>
              <p>
                Dans les limites permises par la loi, l’éditeur n’est pas responsable des dommages
                indirects liés à l’utilisation de Coory (perte de données, de clients ou de
                revenus). Rien dans ces conditions ne limite sa responsabilité en cas de faute grave
                ou intentionnelle.
              </p>
              <p>
                Ces conditions relèvent du droit belge. En cas de désaccord, on cherche d’abord une
                solution à l’amiable ; à défaut, les tribunaux de Bruxelles sont compétents. Si tu
                utilises Coory comme consommateur, tu gardes les protections de la loi de ton pays.
              </p>
            </>
          ),
        },
        {
          title: "Résiliation",
          body: (
            <p>
              Tu peux supprimer ton compte à tout moment dans Paramètres, onglet Sécurité,{" "}
              {"«\u00a0Supprimer mon compte\u00a0»"} : il est effacé tout de suite, avec toutes les
              données de ton organisation. Pense à télécharger tes données avant (onglet Données).
              Tu peux aussi le demander par e-mail à{" "}
              <a href={`mailto:${LEGAL.contactEmail}`} className="font-semibold text-text">
                {LEGAL.contactEmail}
              </a>{" "}
              : il est alors effacé dans les 30 jours. L’éditeur peut fermer un compte qui ne
              respecte pas ces conditions, après t’avoir prévenu par e-mail.
            </p>
          ),
        },
      ]}
    />
  );
}
