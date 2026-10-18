# 13 — Génération PDF, publication, e-mails, WhatsApp, rappels

## 1. Un principe : publication unique, multiples canaux
La version publiée d'un programme est la **source de vérité**. Les écrans sportifs et l'export PDF lisent le même snapshot. L'email n'envoie jamais par erreur un brouillon non validé ; l'historique associe version, auteur, date, sportif et checksum export.

## 2. PDF (DOC-01)
### Formats
- PDF programme intégral (1..52 semaines selon choix), extrait de semaines, PDF séance unique.
- Couverture configurable : logo du coach, titre, sportif, objectifs, période, version, notes d'introduction.
- Sommaire : structure semaine et jours/slots, catégories Running/Musculation/Hyrox/Hybride, duration estimate si calculable.
- Pages détaillées : chaque séance avec **tous** blocs/étapes : séries, repos, allure/zones, unités, circuits imbriqués, notes visibles au sportif, matériel.
- Pieds : numéro de page, version publication, coach, date d'export ; messages de confidentialité facultatifs et charte par organisation.
- PDF lisible A4 portrait (détails) et éventuellement A4 paysage (calendrier) sans tableaux illisibles ; option print CSS, sauts de pages avant sections pour éviter coupure d'un bloc.
- Aperçu fidèle et options : couverture, sommaire, niveau de détail, semaines sélectionnées, langue future.

### Pipeline recommandé
1. Coach publie vN.
2. API vérifie permissions et récupère publication immuable.
3. Convertit snapshot structuré vers présentation via adaptateur `PublicationViewModel` (unité, ordre, sections, agrégations explicites).
4. Service `PdfRenderer` produit Buffer, avec validateur du nombre de pages et tests visuels.
5. Stockage privé `org/{orgId}/publications/{publicationId}/pdf/{hash}.pdf` et entrée `pdf_exports`.
6. Téléchargement sécurisé, aperçu, partage email selon autorisation.

Outil initial à choisir après prototype de 2 vraies pages complexes : renderer HTML vers PDF (Playwright Chromium en environnement compatible) ou `@react-pdf/renderer` (plus contrôlé sur mise en page). Ne pas exiger navigateur Chrome sur runtime serverless sans vérification ; abstraction permettra de changer de moteur. Aucun PDF public direct.

### Erreurs et règles
Publication sans séances valides = blocage ; images manquantes = placeholder ; PDF trop long = traitement asynchrone ; génération échouée = statut « erreur, réessayer » sans envoi ; double demande = cache même publication/options. Variantes d'export ne doivent pas se mélanger, hasher `publication_id + options + template_version`.

## 3. E-mails (DOC-02 / MSG-01)
MVP : préparer envoi e-mail depuis plateforme si fournisseur configuré ; sinon ouvrir composition mail locale avec lien contrôlé, sans prétendre envoi. Corps personnalisable, modèle variables autorisées (`prenom`, `nomCoach`, `titreProgramme`, `période`, `lienProgramme`). Envoyer lien sécurisé au programme ou PDF selon politique ; si pièces jointes, limites taille et stockage. Log statut `draft | queued | sent | failed`, tentatives et opt-out pour messages non essentiels.

Exemple message : « Bonjour {prenom}, voici ton programme personnalisé pour les prochaines semaines. Tu peux consulter chaque séance depuis ton espace sportif ou télécharger la version PDF. À bientôt, {nomCoach}. »

Respecter consentements et distinction emails transactionnels (publication demandée) et campagnes/relances marketing.

## 4. WhatsApp Business (MSG-02, V2/V3)
- Fournisseur officiel Meta WhatsApp Business Platform ou BSP autorisé, compte entreprise vérifié si nécessaire, numéro d'envoi, consentement/opposition, modèles approuvés selon fenêtre de conversation et réglementation.
- Jamais envoyer depuis un numéro personnel avec automatisation non autorisée. Ne pas déclencher messages sans consentement ou sur simple ouverture d'écran.
- Webhook signature, idempotence, file jobs, gestion livraison/erreur/coûts/quotas, journal minimalisé.
- Canal de réponse peut rester externe à l'application au début ; ne pas prétendre « boîte WhatsApp complète » sans intégration bidirectionnelle réelle.

## 5. Automatisation « après 3 séances » (MSG-03)
**Déclencheur proposé** : 3 nouvelles séances **terminées** (`completed`) depuis dernier questionnaire traité dans un programme/client, pas 3 passages de date, pas 3 refreshs. Paramètre N configurable (défaut illustratif N=3) et seuil de délai facultatif. Condition : canal disponible, consentement valide, pas d'automatisation en pause et aucune autre demande récente.

**Algorithme fonctionnel** :
1. Un résultat de séance passe à `completed` une première fois ; événement `session.completed` idempotent.
2. Transaction/worker détermine compteur non interrogé pour `(orgId, athleteId, ruleId)`.
3. Si nombre >= seuil et cooldown respecté, créer `automation_event` unique, `pending`.
4. Choisir canal autorisé ; composer message depuis template versionné ; vérifier consentement immédiatement avant émission.
5. Envoyer via adaptateur, enregistrer statut, gérer retry backoff seulement erreurs transitoires, jamais doublons.
6. Réponse saisie dans espace sportif sous forme formulaire feedback/mini-questionnaire ou webhook explicite si bidirectionnalité supportée.

Questionnaire possible : « Comment se sont passées tes 3 dernières séances ? Qu'est-ce qui était trop difficile ? Y a-t-il quelque chose à adapter ? » ; choix réponse simple, texte facultatif, date.

### Cas limites
Séance annulée après avoir été terminée, feedback rétroactif, programme republié, un sportif ayant deux programmes, message envoyé mais webhook en retard, consentement révoqué, silence prolongé, résultat 3e séance saisi deux fois : **aucun envoi répété**. `idempotency_key = ruleId + athleteId + lastQualifiedEventId` ou séquence d'exécution atomique.

## 6. Notifications et rappels (MSG-04)
- Rappel séance facultatif selon opt-in sportif, fenêtre avant séance configurable, date planifiée obligatoire.
- Coach : nouveau feedback, programme à publier, échéance course, import erroné, intégration failed ; groupement pour éviter spam.
- Canaux internes/email/web push seulement après permission ; gestion de préférences par type de notification et heures calmes.
- Aucun message automatique pour une séance « manquée » sans règles/tolérance validées avec coach.

## 7. Messagerie interne (MSG-05, V2)
Thread entre sportif et coach assigné, texte + attachments contrôlés, horodatage, statut lu, modération/signalement possible, confidentialité. Les documents personnels sont privés ; pas de message de groupe pour MVP. Les messages transactionnels de publication peuvent être visualisés en historique même sans messagerie complète.

## 8. Recettes
- [DOC-01] PDF programme de 8 semaines avec mix Running/Hyrox et un bloc 5 tours contient chaque étape, unité et note, sans troncature.
- [DOC-02] PDF v1 et v2 restent téléchargeables séparément et identiques aux publications associées.
- [DOC-03] Sportif non concerné ne télécharge pas un PDF via changement d'ID ni lien expiré.
- [MSG-01] E-mail confirme « envoyé » uniquement après retour réel fournisseur ; mode simulation signalé visiblement.
- [MSG-02] Automatisation après 3 séances génère au plus un événement, malgré double soumission.
- [MSG-03] Révocation consentement supprime envoi pending ; WhatsApp réel jamais actif par défaut.
