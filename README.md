# Coory

Coory est une application web pour les coachs sportifs indépendants : running, musculation, Hyrox et entraînement hybride. Elle réunit dans un seul outil ce qu'un coach gère d'habitude entre tableurs, PDF, agenda et messages : ses sportifs, ses programmes, ses séances et ses paiements.

L'application est pensée d'abord pour le téléphone, utilisable aussi sur ordinateur, en thème clair ou sombre.

**Bêta en ligne :** [coory-beta.vercel.app](https://coory-beta.vercel.app)

## Fonctionnalités

### Programmes d'entraînement

- Création de programmes semaine par semaine, en running, musculation, Hyrox ou hybride.
- Séances de course construites par étapes (échauffement, fractionné, allure cible, récupération) et séances de musculation par exercices, séries, répétitions et charges.
- Modèles prêts à l'emploi (5 km, 10 km, semi-marathon, marathon, Hyrox, force, hybride…), que le coach adapte à chaque sportif.
- Export du programme en PDF, prêt à envoyer au sportif.

### Assistant IA

- Le coach écrit sa demande en langage naturel, par exemple « crée un programme semi-marathon de 12 semaines pour Inès ».
- L'assistant peut faire tout ce que le coach fait à la main : créer ou modifier un programme, planifier une séance, ajouter une tâche, enregistrer un paiement, compléter une fiche.
- Chaque action est proposée sous forme de carte que le coach relit et valide avant qu'elle soit enregistrée. L'assistant ne touche jamais aux données de santé.

### Agenda et séances

- Agenda par jour, trois jours, semaine ou mois, avec les séances individuelles et collectives.
- Création d'une séance en quelques secondes, séances récurrentes, plusieurs séances par jour.
- Déplacement d'une séance par glisser-déposer.

### Suivi des sportifs

- Une fiche par sportif : objectifs, disponibilités, repères d'allure et de charge, records, notes et historique.
- Bibliothèque de près de 700 exercices illustrés, avec les muscles travaillés et les consignes, et la possibilité de créer ses propres exercices.

### Gestion de l'activité

- Tableau de bord : prochaine séance, tâches du jour et montant encaissé dans la semaine.
- Paiements, forfaits et factures avec TVA, dépenses et comptabilité simple.
- Documents, tâches et notifications.

## Stack

Next.js · React · TypeScript · Tailwind CSS · Supabase (PostgreSQL, Auth, Storage) · API Claude · Vercel

Chaque coach a son espace isolé (sécurité au niveau de la base de données), et l'application est couverte par des tests unitaires, des tests de la base et des tests de parcours complets.

---

Antonino Lo Bianco · 2026
