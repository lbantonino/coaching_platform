# 02 — Rôles, autorisations et parcours utilisateurs

## 1. Modèle de comptes
- **Organization** = espace privé d'un coach/structure (tenant). Lors du lancement, une organisation « pilote » de Gianluca, avec possibilité d'en créer une seconde pour tester l'isolation.
- **Platform administrator** = opérateur du SaaS ; ce rôle n'appartient pas automatiquement à toutes les organisations.
- **Coach owner** = titulaire de l'organisation ; administration de son équipe, clients et paramètres selon plan.
- **Coach collaborator** (V2) = entraîneur invité avec accès aux clients assignés et droits limités.
- **Athlete / sportif** = personne ayant reçu une invitation et liée à une ou plusieurs organisations par une relation d'accompagnement explicite.
- **Non inscrit / prospect** = pas d'accès aux données, seulement pages de connexion/invitation.

Un sportif peut avoir une fiche créée sans compte : `athlete_profiles` (données métier) et `auth.users` (compte de connexion) sont deux concepts différents. `athlete_user_id` est nullable. Les invitations doivent être à durée limitée et à usage contrôlé.

## 2. Matrice d'accès (le principe, à préciser en RLS)
| Ressource/action | Coach owner org. | Coach collaborateur | Sportif concerné | Admin plateforme |
|---|---|---|---|---|
| Clients de son organisation : liste/CRUD | Oui | Assignés seulement | Sa propre fiche : lecture limitée | Non par défaut |
| Catalogue personnel d'exercices | CRUD | Lire / créer selon autorisation | Lire exercices publiés | Non |
| Modèles et programmes en brouillon | CRUD | Assignés + droits | Jamais | Non |
| Programme publié | CRUD/republication | Assignés + droits | Lecture de ses publications | Non |
| Résultats, RPE, commentaires | Lire/annoter | Assignés | Créer/éditer son retour selon fenêtre autorisée | Non |
| Exports PDF | Si droit organisation | Selon autorisation | PDF de son programme publié | Non |
| Paramètres abonnement | Oui | Non | Non | Plan/état global seulement |
| Support sur données privées | Autorise explicitement | Non | Consentement selon cas | Accès exceptionnel, journalisé, borné |

**Politique par défaut : deny.** Les lectures et écritures sont vérifiées en serveur ET RLS. Un sportif ne peut pas altérer la structure prescrite ni les performances d'un autre. Les comptes coach et sportif doivent utiliser des URL et interfaces distinctes même si le moteur d'auth est commun.

## 3. Parcours coach — création client et programme
1. Authentification, choix/validation de l'organisation.
2. « Nouveau sportif » : identité minimale, contact, objectifs, nombre de séances et temps disponible, éventuelles contraintes de pratique renseignées de façon limitée.
3. Choisir « Nouveau programme », renseigner durée (p. ex. 8 semaines), objectifs, point de départ, 4 slots hebdo, jours si connus.
4. Partir d'un modèle Running/Musculation/Hyrox/Hybride ou d'un plan vide ; sélectionner « Sortie longue », « Endurance », « Race Pace », « Circuit ».
5. Ouvrir un slot, modifier blocs, segments, efforts, récupérations, charges, RPE cible, consignes ; les modèles sources ne changent pas.
6. Copier la semaine vers semaine 2..8, puis éditer un nombre réduit de valeurs par semaine ; vérifier les résumés de volume.
7. Visualiser le programme consolidé, contrôler dates, allures/unités, erreurs de structure, mentions confidentielles.
8. Publier une version immuable et/ou exporter PDF ; inviter le sportif si l'accès web doit être activé.
9. Revenir sur la fiche et analyser les feedbacks pour corriger la prochaine version.

État vide : si aucun client, CTA « Ajouter un sportif » ; si aucun modèle, proposer quelques exemples **identifiés comme exemples non prescrits** et création libre. Erreurs à gérer : perte connexion, erreur d'enregistrement, conflit de modification simultanée, fichier trop volumineux, accès expiré.

## 4. Parcours coach mobile — création complète (obligation)
- Navigation écran par écran : client -> programme -> semaine -> séance -> bloc -> exercice -> paramètres ; **pas de tableau de 8 colonnes impossible à manipuler sur téléphone**.
- Bouton « + » permanent : Ajouter exercice/bloc/séance/semaine ; recherche rapide catalogue ; copier/coller bloc ; réordonner par contrôle accessible (boutons haut/bas en fallback au drag).
- Panneau plein écran / bottom sheet pour l'édition de durée/allure/charge ; gros boutons et champs numériques avec unités.
- Enregistrer brouillon sans quitter ; aperçu PDF adapté au viewport ; publication avec confirmation.
- Même modèle métier que desktop, donc pas de version mobile simplifiée incapables d'éditer Hyrox.

## 5. Parcours sportif desktop et mobile
1. Invitation de son coach -> création compte/connexion -> acceptation des conditions et choix de notifications.
2. Accueil : programme en cours, semaines et séance du jour, prochaine séance et dernière actualisation publiée.
3. Ouvrir séance : consignes lisibles par ordre, blocs imbriqués, repetitions, allures/zones, charge et variantes.
4. Pendant l'entraînement : consulter l'étape en cours, marquer des étapes faites si activé, renseigner le réel (optionnel), reprendre après fermeture de l'écran si synchronisation disponible.
5. Fin : choisir terminée/partielle/non effectuée, saisir date et RPE 1–10, difficulté, notes ; une nouvelle sauvegarde est visible coach.
6. Après 3 séances terminées, un scénario de questionnaire peut être **éligible** à l'envoi (phase ultérieure) si consentement/canal validés et anti-duplication.
7. Consulter historique, progression, documents publiés, messagerie si disponible.

Cas limites : séance reportée, terminée avec adaptation, programme republié pendant une séance, utilisateur hors ligne, retrait du coach, RPE manquant. Ne jamais marquer une séance terminée automatiquement parce que la date est passée.

## 6. Parcours admin plateforme (V3, préparer sécurité dès maintenant)
- Authentification renforcée, tableau organisations, création/suspension explicite, état du système, factures, demandes RGPD, tickets support.
- **Aucun accès automatique aux détails d'entraînement** ; support via mécanisme temporaire, avec motif/consentement et audit.
- Journal de toute action sensible, gestion séparation entre comptes de production et tests.

## 7. Etats clés
- Invitation : `pending | accepted | expired | revoked`.
- Profil sportif : `active | paused | archived`; archiver ne détruit pas le programme publié.
- Programme : `draft | published | superseded | archived` ; publier crée un snapshot, pas un simple booléen.
- Séance : `planned | in_progress | completed | partial | skipped | rescheduled` (statut d'exécution sportif, séparé du statut publication).
- Automatisation : `disabled | active | paused | error` et delivery `pending | sent | failed | suppressed`.

## 8. Recettes importantes
- [AUTH-01] Un sportif ne peut pas accéder à `/coach/*` même par URL directe ; idem lecture API.
- [SEC-01] Un coach de l'organisation B ne peut ni lire ni modifier un programme, PDF ou profil de l'organisation A en changeant un ID.
- [PRG-01] Le coach peut créer et corriger un programme sur mobile sans revenir sur PC.
- [ATH-01] Une séance modifiée dans un brouillon coach ne change pas immédiatement la séance publiée vue par le sportif.
- [ATH-02] Une nouvelle publication est annoncée clairement dans l'interface, et les données d'exécution d'une ancienne version sont conservées.
- [ADM-01] Le compte admin n'a pas d'accès normal à la liste de sportifs sans élévation contrôlée.
