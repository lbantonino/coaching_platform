# 03 — CRM du coach, fiche sportif, objectifs et agenda

## 1. Liste de clients (CRM-02)
**Desktop** : table triable (nom, discipline dominante, statut, objectif, date cible, séances/semaine, programme courant, dernier feedback, prochaine action), recherche accent-insensitive, pagination, filtres multi-critères, actions rapides et bulk actions prudentes (archivage confirmation). **Mobile** : cartes verticales, recherche/filtres, bouton + visible ; consultation et édition complètes.

### Champs d'identification minimaux
- `display_name` obligatoire, `email` optionnel avant invitation, téléphone international facultatif, fuseau horaire facultatif.
- `status`, date début relation coach, coach responsable, notes administratives.
- Distinguer données personnelles et performance ; âge/taille/poids non obligatoires et jamais collectés sans finalité claire.
- Possibilité d'ajouter un client **sans créer de compte** ; éviter de dupliquer les fiches lorsqu'il accepte l'invitation.

### Filtres et actions
`active/paused/archived`, objectif Running/Hyrox/Force/Hybride/autre, nombre de séances, dernière activité, échéance. Actions : ouvrir profil, créer programme, dupliquer programme personnalisé, envoyer invitation, exporter informations autorisées, archiver/restaurer.

## 2. Fiche sportive (CRM-03)
Onglets : **Résumé**, **Objectifs**, **Disponibilités**, **Allures & repères**, **Programmes**, **Activité**, **Notes**, **Communication**, **Documents**.

**Objectifs** : type (course 5/10 km, semi, marathon, Hyrox, force, composition musculaire, santé générale sans diagnostic, personnel), description libre, date cible, priorité, statut et mesures possibles. Plusieurs objectifs simultanés autorisés, un principal facultatif.

**Disponibilités** : entraînements/semaine souhaités ou maximum, jours disponibles, durée max par séance, équipement/salle accessible, contraintes d'organisation (déplacements, horaires). **Ne pas déduire automatiquement** une prescription sportive d'une seule séance disponible.

**Repères running** : vitesse/allure de référence par contexte (EF, seuil, tempo, 5 km, 10 km, Race Pace), source (test, constat, estimation coach), date et unité `sec/km`, zones de FC optionnelles en bpm et méthode coach. Exemples des PDF : Zone 2 `6:40–7:15 min/km` pour l'athlète concerné, non valeur générique.

**Repères muscu/Hyrox** : charges de référence validées par le coach, éventuellement RPE/RIR, matériel, catégorie de compétition si utile. Modèles à versionner avec date de mesure ; ne pas remplacer rétroactivement les allures d'anciens programmes.

**Notes** : visibles coach, séparées de notes visibles sportif. Zones de santé/confidentialité sensibles **hors v1** ou champ de restriction très contrôlé et explicitement minimisé ; ne pas construire un dossier médical.

## 3. Agenda et calendrier (CRM-05)
- Vue semaine et mois côté coach, filtrable par sportif, discipline, séance due/réalisée, séance reprogrammée.
- Une séance peut être attachée à un slot (Séance 1..N) sans jour précis OU datée et associée à un jour. Le coach peut réordonner sans modifier la prescription ; date réelle de réalisation indépendante.
- Décalage : déplacer séance -> modifier date planifiée dans une **nouvelle version du programme** si publiée, ou permission contrôlée de replanifier selon règle produit à valider. Ne pas supprimer les performances existantes.
- Détection d'avertissements (pas de blocage) pour conflits de date et dépassement de disponibilités.
- Intégration Google Calendar/Apple ultérieure : consentement OAuth, révocation, fuseaux, conflits, déduplication ; aucune intégration exigée pour l'édition initiale.

## 4. Tableau de bord coach (CRM-01)
Widgets alimentés en données réelles : nombre clients actifs, programmes à publier, brouillons récents, séances à venir, séances avec retours non lus, clients inactifs selon règle configurable ; raccourcis Nouveau client / Nouveau programme / Bibliothèque / PDF.

Les KPI d'activité reposent sur des **événements enregistrés**. Pas de fausses cartes « +18 % » si les données sont insuffisantes. Un graphe charge/volume n'est affiché que si des unités compatibles sont disponibles.

## 5. Gestion de relation et historique
Journal `client_events` avec ajout, invitation, programme publié, feedback reçu, archivage, changement coach ; auteur, date, référence objet, pas de données privées en clair dans logs techniques. Notes du coach horodatées ; accès aux derniers PDF et versions publiées. Réactivation sans perte d'historique sous réserve de la politique de conservation.

## 6. Validation et erreur UX
- Email format et unicité à contrôler **par organisation et invitation**, sans empêcher qu'un sportif soit suivi par deux coachs dans deux organisations.
- Nom absent -> message explicite ; durée max impossible -> validation ; réseau coupé -> sauvegarde en échec visible, aucune fausse confirmation.
- Une fiche sans programme s'ouvre sans bug et propose « Créer un programme ».
- Les objectifs sans date, les séances sans jour, et les allures inconnues sont des états légitimes (pas des zéros forcés).

## 7. Critères de recette
- [CRM-02] Ajouter un sportif, filtrer par Hyrox, trouver via recherche, modifier disponibilité et archiver/restaurer sans le perdre.
- [CRM-03] Ajouter une allure de référence datée et prouver qu'un programme publié la semaine précédente ne change pas.
- [CRM-05] Afficher la même structure de semaine sur desktop et mobile avec horaires cohérents.
- [SEC-01] Impossible de rechercher l'email d'un client d'une autre organisation.
- [CRM-01] Le dashboard prend ses chiffres dans PostgreSQL, pas dans des constantes de demo.
