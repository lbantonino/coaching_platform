import type { Metadata } from "next";
import Link from "next/link";

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
              traitement et l’éditeur de Coory est son sous-traitant : ses engagements sont écrits
              dans les{" "}
              <Link href="/conditions" className="font-semibold text-text">
                conditions d’utilisation
              </Link>
              , rubrique « Données de tes sportifs ».
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
              (facultatif) : ton identifiant Garmin et les clés de connexion, si tu relies ton
              compte pour recevoir tes séances sur ta montre (voir « Connexion à Garmin Connect »).
            </p>
          ),
        },
        {
          title: "Pourquoi",
          body: (
            <p>
              Fournir le service de coaching (exécution du contrat), sécuriser les comptes (intérêt
              légitime), et les données de santé uniquement sur la base du consentement. Aucune
              vente de données, aucune publicité, aucun outil de statistiques : seulement les
              cookies nécessaires à ta connexion.
            </p>
          ),
        },
        {
          title: "Qui y a accès",
          body: (
            <p>
              Le coach et les personnes de son organisation ; le sportif pour ce qui le concerne.
              Chaque espace de coach est séparé des autres.
            </p>
          ),
        },
        {
          // Liste complète des prestataires (docs/DEPLOIEMENT.md, vérifiée dans le code le
          // 17/11/2026 : package.json, .env.example, src/features/assistant). Tout nouveau service
          // qui reçoit des données doit être ajouté ici.
          title: "Prestataires techniques",
          body: (
            <>
              <p>
                Ils traitent les données uniquement pour faire fonctionner Coory, et aucun ne les
                utilise pour son propre compte.
              </p>
              <p>
                <strong>Supabase</strong> (Supabase Pte. Ltd., Singapour) : base de données, comptes
                et fichiers, hébergés en Irlande (Union européenne).
              </p>
              <p>
                <strong>Vercel</strong> (Vercel Inc., États-Unis) : hébergement de l’application,
                sur ses serveurs de Dublin (Irlande).
              </p>
              <p>
                <strong>Brevo</strong> (France) : envoi des e-mails de ton compte (confirmation
                d’inscription, mot de passe oublié). Brevo reçoit ton adresse e-mail et le contenu
                de ces e-mails.
              </p>
              <p>
                <strong>Google</strong> : seulement si tu choisis « Continuer avec Google ». Google
                confirme ton identité et transmet à Coory ton nom et ton adresse e-mail.
              </p>
              <p>
                <strong>Anthropic</strong> (Claude, États-Unis) : seulement quand un coach utilise
                l’Assistant IA. Sa demande, les fichiers qu’il y joint (jusqu’à 10 : PDF, images,
                Word, Excel, CSV ou texte, que l’Assistant lit pour lui répondre ; les PDF et les
                images sont confiés à Anthropic tant qu’ils restent joints, chaque copie 1 heure au
                plus, puis effacés selon sa politique) et les informations utiles pour y répondre
                (par exemple le prénom d’un sportif, ses objectifs, ses repères, ses séances ou ses
                paiements) sont envoyés à Claude. L’Assistant ne va jamais chercher les données de
                santé, les notes privées ni les données Garmin, et Anthropic n’utilise pas ces
                échanges pour entraîner ses modèles. La conversation est gardée dans le compte du
                coach (voir « Durée de conservation »). Coach, n’écris pas de données de santé dans
                l’Assistant et n’y joins pas de document qui en contient.
              </p>
              <p>
                <strong>Hors de l’Union européenne</strong> : certains de ces prestataires sont
                établis hors de l’Union européenne ou y accèdent depuis l’étranger. Ces envois sont
                encadrés par les clauses contractuelles types de la Commission européenne, prévues
                dans leurs contrats : Anthropic traite les demandes de l’Assistant aux États-Unis ;
                l’équipe de Supabase peut accéder à la base depuis Singapour ou les États-Unis pour
                son support ; Vercel et Google sont aussi certifiés au cadre de protection des
                données UE-États-Unis (Data Privacy Framework).
              </p>
            </>
          ),
        },
        {
          title: "Durée de conservation",
          body: (
            <>
              <p>
                <strong>Compte</strong> : tant qu’il est ouvert. Tu le supprimes toi-même dans
                Paramètres, onglet Sécurité, « Supprimer mon compte » : il est effacé tout de suite,
                avec toutes les données de ton organisation. Tu peux aussi écrire à{" "}
                <a href={`mailto:${LEGAL.contactEmail}`} className="font-semibold text-text">
                  {LEGAL.contactEmail}
                </a>{" "}
                : il est alors effacé dans les 30 jours.
              </p>
              <p>
                <strong>Données des sportifs</strong> : tant que leur coach les garde dans Coory.
                Elles sont effacées quand le coach supprime son compte (tout de suite), ou dans les
                30 jours s’il demande par e-mail la suppression d’un sportif.
              </p>
              <p>
                <strong>Santé</strong> : jusqu’au retrait de l’accord du sportif, puis effacées.
              </p>
              <p>
                <strong>Paiements et factures</strong> enregistrés par le coach : tant que son
                compte existe. Le coach reste responsable de les conserver le temps exigé par la loi
                ; il peut les télécharger dans Paramètres, onglet Données, avant de supprimer son
                compte.
              </p>
              <p>
                <strong>Assistant IA</strong> : Coory garde les conversations du coach 12 mois après
                leur dernier message, puis les efface (le coach est prévenu 30 jours avant). Il peut
                les télécharger ou les supprimer à tout moment ; elles sont effacées avec son
                compte. Les fichiers joints ne sont pas gardés dans la conversation, seulement leur
                nom : ils sont effacés dès que le coach les retire, et au plus tard 24 heures après
                leur dépôt (chez Anthropic, chaque copie 1 heure au plus). Si un coach demande la
                suppression d’un sportif, les conversations qui le nomment sont effacées avec ses
                données. Le nombre de demandes est effacé avec le compte.
              </p>
              <p>
                <strong>Garmin</strong> : voir « Connexion à Garmin Connect ».
              </p>
            </>
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
              , réponse sous un mois. Coach : tu peux aussi télécharger toutes les données de ton
              organisation (fichier lisible par une autre application) dans Paramètres, onglet
              Données, et supprimer ton compte dans l’onglet Sécurité.
            </p>
          ),
        },
        {
          // Rubrique exigée par Garmin (formulaire « Add app » du portail développeur, lu le
          // 17/11/2026) : usage des données Garmin, TOUS les tiers qui les traitent, vente ou non,
          // IA, accès/correction/effacement/export et retrait du consentement. Chaque phrase est un
          // engagement à respecter dans le code de la connexion Garmin.
          // Décision d'Antonino du 17/11/2026 : ENVOI SEULEMENT (séances de course vers la montre),
          // aucune donnée reçue de Garmin pour l'instant. Si Coory reçoit un jour les activités
          // (Activity API, gardée cochée chez Garmin), cette rubrique doit être réécrite AVANT, et
          // l'accord des sportifs redemandé.
          title: "Connexion à Garmin Connect",
          body: (
            <>
              <p>
                Si tu relies ton compte <strong>Garmin Connect</strong> à Coory, les séances de
                course que ton coach publie pour toi arrivent sur ta montre : tu n’as plus à les
                recopier dans Garmin Connect. Pour l’instant, Coory envoie seulement :{" "}
                <strong>il ne reçoit aucune donnée de ta montre</strong> (ni activités, ni fréquence
                cardiaque, ni position GPS). Si un jour Coory propose de recevoir tes activités,
                cette page sera mise à jour avant, et ton accord te sera demandé à nouveau. Cette
                connexion est facultative : Coory fonctionne aussi sans montre. Responsable de ce
                traitement : {LEGAL.publisher}, éditeur de Coory. Cette connexion n’est pas encore
                disponible : elle sera ouverte plus tard.
              </p>
              <p>
                <strong>Ce que Coory envoie à Garmin</strong> : les séances de course que ton coach
                a publiées pour toi (nom, date, étapes, durées ou distances, allures ou fréquences
                cardiaques visées, consignes). Une fois dans Garmin Connect, elles relèvent aussi de
                la{" "}
                <a
                  href="https://www.garmin.com/privacy/connect"
                  className="font-semibold text-text"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  politique de confidentialité de Garmin
                </a>
                .
              </p>
              <p>
                <strong>Ce que Coory garde</strong> : ton identifiant Garmin, les clés de connexion
                qui permettent l’envoi (jamais ton mot de passe Garmin, que Coory ne voit pas), et
                la liste des séances envoyées, pour pouvoir les modifier ou les retirer de ta montre
                si ton coach change ton programme.
              </p>
              <p>
                <strong>Base légale</strong> : ton consentement, donné quand tu relies ton compte
                (article 6 du RGPD). Tu peux le retirer à tout moment.
              </p>
              <p>
                <strong>Qui y a accès</strong> : ces informations de connexion servent seulement à
                Coory pour envoyer tes séances ; ton coach voit uniquement si ta montre est reliée.
                Deux prestataires techniques les traitent : Supabase (base de données, Irlande) et
                Vercel (application, Dublin, Irlande). Aucun autre tiers ne les reçoit, ni service
                de statistiques, ni régie publicitaire, ni fournisseur d’intelligence artificielle.
              </p>
              <p>
                <strong>Intelligence artificielle</strong> : l’Assistant IA de Coory n’a pas accès à
                ta connexion Garmin, et rien de ce qui concerne Garmin ne sert à entraîner, évaluer
                ou améliorer un modèle d’intelligence artificielle.
              </p>
              <p>
                <strong>Jamais vendues</strong> : les informations de ta connexion Garmin ne sont ni
                vendues, ni louées, ni partagées à des fins commerciales.
              </p>
              <p>
                <strong>Durée de conservation</strong> : tant que ton compte Garmin est relié. Si tu
                déconnectes Garmin ou fermes ton compte, Coory arrête tout envoi et efface ton
                identifiant Garmin et tes clés de connexion dans les 30 jours au plus tard. Les
                séances déjà envoyées restent dans ton Garmin Connect, où tu peux les supprimer.
              </p>
              <p>
                <strong>Tes droits</strong> : pour retirer ton consentement, déconnecte Garmin
                depuis Coory ou depuis les applications connectées de ton compte Garmin Connect.
                Pour toute autre demande (consulter, recevoir une copie, effacer), écris à{" "}
                <a href={`mailto:${LEGAL.contactEmail}`} className="font-semibold text-text">
                  {LEGAL.contactEmail}
                </a>
                , réponse sous un mois.
              </p>
              <p>Garmin et Garmin Connect sont des marques de Garmin Ltd. ou de ses filiales.</p>
            </>
          ),
        },
      ]}
    />
  );
}
