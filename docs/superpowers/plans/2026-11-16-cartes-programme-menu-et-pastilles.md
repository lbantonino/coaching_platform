# « ⋯ » sur les cartes de programme, plus aucune pastille : plan

> Exécution native, sans commit (Antonino commite) ; relecture indépendante à la fin. Demandes
> d'Antonino du 16/11 (planche « avant / après » validée : « tout le reste est OK »).

**Goal :** (1) un bouton « ⋯ » sur chaque carte de programme (page Programmes et onglet Programme de la
fiche) avec les actions du menu de l'éditeur, plus **Supprimer** (définitif) ; (2) plus aucune pastille
ronde dans l'app, remplacée selon la planche ; les étiquettes en rectangles aux coins arrondis.

## Décisions d'Antonino (16/11)
- Menu de la carte : Enregistrer comme modèle, Dupliquer, Renommer, Changer la discipline, Modifier les
  dates, Modifier l'objectif, Archiver, et **Supprimer** (« pas forcément que de les archiver »).
- Pastilles : toutes remplacées (planche) ; discipline = le mot en couleur ; lignes sans mot = barre
  fine ; statut et discipline en étiquette teintée ; légendes = petit trait ; jours du mois = petits
  traits ; non lu = barre violette ; maintenant = l'heure dans une étiquette.
- Étiquettes : rectangle aux coins arrondis, **jamais** une capsule (bords gauche et droit en demi-cercle).

## Choix pris par Claude
- Les fenêtres de l'éditeur (TextSheet, DisciplineSheet, DatesSheet, GoalSheet, ConfirmDialog) sont
  réutilisées ; leurs valeurs sont lues à l'ouverture (`loadProgramSettings`) et l'enregistrement passe
  par le même `saveDraft` (révision revérifiée par la base).
- Supprimer : nouvelle fonction SQL `delete_program` (membre de l'organisation, comme `archive_program`),
  suppression en cascade du brouillon et des versions ; confirmation « définitif ».
- Programme archivé : Désarchiver, Dupliquer, Enregistrer comme modèle, Supprimer.
- Toutes les étiquettes de statut existantes (« Publié v1 », « À venir », « Brouillon »…) passent aussi en
  rectangles arrondis, pour une seule forme d'étiquette dans l'app.
- Restent ronds : boutons radio, curseur de graphique, points d'une frise (commandes et repères).

## Review Focus
1. Supprimer un programme publié ou archivé : tout disparaît (brouillon, versions), aucune page cassée.
2. Supprimer ou renommer depuis la carte pendant que le programme est ouvert ailleurs : conflit propre.
3. Un autre coach (autre organisation) ne peut ni supprimer ni modifier (fonction SQL, RLS).
4. Le menu de la carte ne déclenche jamais l'ouverture du programme (lien étendu de la carte).
5. Aucune pastille ronde restante hors des exceptions ; contrastes des mots colorés en clair et sombre.

### Task 1 : « ⋯ » sur les cartes de programme
Migration `delete_program` ; actions `deleteProgram`, `loadProgramSettings`, `updateProgramSettings` ;
`src/components/programs/program-card-menu.tsx` ; `ProgramCard` ; test e2e d'abord (renommer puis
supprimer depuis la carte, téléphone et ordinateur).

### Task 2 : plus aucune pastille, étiquettes en rectangles arrondis
Les ~35 fichiers recensés (rg « rounded-full » + petites tailles) ; un composant d'étiquette et de
trait communs si utile ; captures avant/après ; suite complète ; relecture.
