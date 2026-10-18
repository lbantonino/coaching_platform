# 15 — Démonstration recruteurs : parcours produit en 3 minutes

## 1. Message principal
« J'ai conçu une plateforme de programmation sportive à partir d'un problème métier réel rencontré par un coach. Elle permet de construire des séances multi-disciplines avec des modèles réutilisables, publier des programmes sur plusieurs semaines, générer le même contenu en PDF et partager une interface mobile où l'athlète valide ce qu'il a fait. »

Ce projet ne doit pas être présenté comme SaaS complet avant que la totalité de ce qui est annoncé fonctionne. Montrer un flux bout en bout vaut plus que 30 écrans fictifs.

## 2. Storyboard de démo (environ 3 minutes)
### Étape 1 — Créer un sportif (0:00–0:25)
Sur l'espace coach PC, ajouter « Camille Test », objectif préparation Hyrox, disponibilité 4 séances/semaine et allures de référence fictives. **Preuve technique** : formulaire validé, sauvegarde en PostgreSQL et fiche consultable après refresh.

### Étape 2 — Choisir la trame (0:25–0:55)
Créer un programme de 8 semaines à partir du modèle « Hyrox – 4 séances dominante running » : 1 Sortie longue, 1 Endurance, 1 Race Pace, 1 Circuit. **Preuve** : création hiérarchie programme/semaines/séances depuis templates, IDs et instantanés indépendants.

### Étape 3 — Personnaliser (0:55–1:35)
Éditer circuit de semaine 1, remplacer un Sled Push par un autre mouvement (démo métier, sans implication prescription universelle), modifier charge, effort et récupération ; dupliquer la semaine et changer la durée d'un intervalle en semaine 2. **Preuve** : éditeur typé Running/Hyrox, blocs imbriqués, versionnage et copies isolées.

### Étape 4 — Publier et exporter (1:35–2:00)
Publier v1, ouvrir aperçu sportif, exporter PDF soigné contenant calendrier et détails. **Preuve** : backend, transaction de publication, stockage privé et génération PDF cohérente à partir du même snapshot.

### Étape 5 — Utiliser la version mobile sportif (2:00–2:35)
Sur téléphone ou émulation mobile, se connecter comme Camille, ouvrir la séance du jour, marquer « terminée », indiquer RPE 7/10 et saisir « fin de circuit difficile ». **Preuve** : deuxième rôle, rendu responsive, sécurité, écriture de feedback.

### Étape 6 — Revenir sur le coach (2:35–3:00)
Rafraîchir fiche Camille, retrouver la séance faite, RPE 7 et commentaire ; ouvrir l'historique. **Preuve** : données persistantes et lecture sécurisée entre deux interfaces, plutôt qu'une maquette cliquable.

## 3. Bonus technique après la démo
- Montrer **deux organisations de tests** et prouver qu'un coach A ne peut consulter le sportif du coach B (test d'accès/RLS).
- Présenter diagramme de données : templates vs occurrences vs versions publiées vs résultats.
- Montrer une suite de tests et CI, un test E2E du flux et une migration SQL.
- Sur mobile coach, créer/éditer réellement une séance Hybride ; ne pas la réserver à l'ordinateur.
- Comparer temps de programmation Google Sheets vs logiciel (mesure réelle, avant/après sans inventer chiffre).
- Démontrer stratégie de gestion d'erreur (réseau, conflit de révision, brouillon jamais écrasé).

## 4. Questions probables recruteurs + réponses attendues
**Pourquoi cette application ?** Problème métier réel validé par utilisateur, produit de bout en bout, meilleure productivité.

**Pourquoi SaaS multi-tenants dès le départ ?** Séparation sécurisée des coachs au niveau données/politiques, tout en lançant avec un premier utilisateur.

**Pourquoi des snapshots de modèles ?** Une séance modifiée pour un client ne doit ni modifier les autres clients ni réécrire les programmes passés.

**Comment gères-tu Running/Hyrox/Musculation ?** Une grammaire de blocs communs et cibles typées par activité (sec/km, sec/500m, kg, reps, etc.).

**Pourquoi PDF + application ?** Export durable pour partage/impression, application mobile interactive pour exécution et retour, même version publiée comme source.

**Quelles limites ?** Pas d'IA autonome, pas de WhatsApp hors API officielle, pas d'algorithmes de progression médicale ; travail futur explicite.

**As-tu utilisé Claude Code ?** Décrire précisément ton rôle personnel : analyse métier, spécifications, décisions d'architecture, revue, tests, debug, sécurité et compromis. Ne pas prétendre avoir écrit à la main du code produit par l'IA. Expliquer ce que tu comprends et peux modifier sans elle.

## 5. Supports de candidature / portfolio
Page portfolio : problème, recherche terrain + documents anonymisés, architecture, captures coach+client desktop/mobile, vidéo 2–3 min, stack, tests, difficultés, résultats mesurés et liens repo/démo déployée si disponibles. Aucune donnée personnelle réelle dans une démo publique. Documentation architecture rédigée pour recruteurs, avec schéma et points de sécurité.

## 6. Critères « prêt à montrer »
- Chaque étape 1..6 a été testée avec deux comptes distincts, base de données réelle et PDF réel.
- Le mobile sportif peut ouvrir séance en < 2 interactions depuis accueil ; le mobile coach peut modifier un entraînement complexe.
- Tous les écrans affichés pendant la démo sont alimentés réellement ou indiqués « démonstration avec données de test ».
- La vidéo, l'application, README et repo sont accessibles selon droits, sans clé API ni fichier d'un vrai sportif.
- Être capable d'expliquer 3 choix d'architecture et 1 bug complexe résolu avec preuves.
