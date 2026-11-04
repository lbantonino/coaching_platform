# Pages internes à redessiner (Coory, espace coach)

Dossier préparé le 04/11/2026 pour les briefs de Claude Design. Il rassemble les **pages internes** de l'espace coach (pages ouvertes depuis une autre page : modifier, créer, inviter, onglet, fil, section) qui n'ont **pas encore été refaites d'après une maquette**. Elles ont seulement reçu les couleurs de la charte « Noir, blanc et violet » le 01/11/2026.

Déjà refaites, à ne pas redemander : tableau de bord, Agenda, page d'une séance, liste des Sportifs, fiche sportif (9 onglets sur 10), détail d'une séance du programme, les 36 boîtes de dialogue (dont la fenêtre des Paramètres, section Profil).

## Ce que contient le dossier

- **Un dossier par page** (01 à 14) avec ses captures :
  - `…-ordinateur.png` : écran de 1280 px de large ;
  - `…-telephone.png` : écran de 390 px (iPhone), en haute définition ;
  - `sombre/` : les mêmes en thème sombre ;
  - `…-suite.png` : la suite d'une fenêtre dont le contenu défile.
  Chaque capture montre **la page entière**, de haut en bas, même la partie qu'il faut faire défiler.
- **`CONTENU-DES-PAGES.md`** : l'inventaire exact de chaque page, relevé dans le code : libellés, champs, options, aides, boutons, messages d'erreur, cas particuliers, différences téléphone / ordinateur et règles à ne pas perdre. Règle : **le contenu reste, seule la présentation change.**

Les données visibles sont celles de démonstration (noms inventés), aucune vraie personne. Les champs de date affichent « mm/dd/yyyy » à cause du navigateur qui a pris les captures : sur un appareil réglé en français, c'est « jj/mm/aaaa ». Les fenêtres des Paramètres sont capturées par-dessus le tableau de bord assombri, comme dans l'app.

## Les pages

| N° | Page | Adresse | Captures | Statut |
| --- | --- | --- | --- | --- |
| 01 | Modifier une séance | `/coach/o/…/agenda/seances/…/modifier` | séance individuelle, séance collective | chez Claude Design |
| 02 | Créer un exercice | `/coach/bibliotheque/nouveau` | formulaire vide | chez Claude Design |
| 03 | Créer ma variante | `/coach/bibliotheque/nouveau?variante=…` | variante du « Back squat » | chez Claude Design |
| 04 | Modifier l'exercice | `/coach/bibliotheque/…/modifier` | exercice créé par le coach | **même formulaire que 02 : à ajouter au même brief** |
| 05 | Fiche d'un exercice | `/coach/bibliotheque/…` | exercice du catalogue commun, exercice créé par le coach | à faire |
| 06 | Nouveau sportif | `/coach/o/…/sportifs/nouveau` | vide, avec les erreurs | à faire |
| 07 | Inviter un sportif | `/coach/o/…/sportifs/…/inviter` | pas encore invité, invitation en attente, compte déjà rattaché | à faire |
| 08 | Onglet « Programme » de la fiche sportif | `…/sportifs/…?onglet=programme` | avec programme, sans programme | à faire (maquette 2e) |
| 09 | Fil d'une conversation (Messages) | `/coach/messages?sportif=…` | fil ouvert | à faire |
| 10 | Paramètres : Préférences | fenêtre des Paramètres et `/coach/profil?onglet=preferences` | fenêtre, page | à faire |
| 11 | Paramètres : Pays, devise et TVA | idem, `?onglet=argent` | fenêtre, page | à faire |
| 12 | Paramètres : Sécurité | idem, `?onglet=securite` | fenêtre, page | à faire |
| 13 | Paramètres : Données | idem, `?onglet=donnees` | fenêtre, page | à faire |
| 14 | Paramètres en version page : sommaire et Profil | `/coach/profil` | sommaire (téléphone), section Profil | à faire, priorité basse |

Pages 10 à 13 : chaque section s'affiche à deux endroits, la **fenêtre** des Paramètres (ouverte depuis le menu du compte, déjà refaite autour : colonne des sections, en-tête, sommaire du téléphone) et la **page** `/coach/profil` (lien partagé ou rechargement). Un seul design de section suffit pour les deux.

Page 14 : la page `/coach/profil` garde l'ancienne mise en page (sommaire du téléphone, cartes « Photo », « Identité », « Organisation »), alors que la fenêtre a été refaite. On y arrive rarement (lien direct, rechargement) : soit la redessiner comme la fenêtre, soit la laisser.

## Pour chaque brief à Claude Design

1. Joindre les captures **claires** de la page (ordinateur et téléphone) ; les sombres seulement si besoin.
2. Coller la section de la page tirée de `CONTENU-DES-PAGES.md`.
3. Rappeler la charte : jetons de couleur de Coory, police unique Plus Jakarta Sans (jamais de police mono), violet rare (lien, élément actif), bouton principal noir en clair et blanc en sombre, **téléphone d'abord**, cibles tactiles de 44 px au moins.
4. Donner comme référence de style ce qui est déjà refait : la maquette « Sportifs » du 03/11 (`docs/design/design-system/` et `docs/design/composants/`) et le kit des boîtes (`coory-design/COORY-MODALS-PIXEL-PERFECT-KIT/`), pour que les champs, boutons et cartes des nouvelles pages soient les mêmes.

## Points relevés dans le code pendant l'inventaire (à décider, pas pour Claude Design)

- **Préférences** : l'aide sous le prix par défaut dit « la TVA de 21 % s'ajoute » en dur, sans suivre le taux de l'organisation ni le cas « sans TVA ».
- **Textes datés d'avant D-90** : l'export des données parle encore de « factures » et de « structures », le sous-titre des Paramètres de « tes structures ».
- **TVA pour un membre qui n'est pas propriétaire** : l'interrupteur est grisé, mais si la TVA est activée, le champ du taux reste modifiable, sans bouton pour enregistrer.
- **Inviter** : « Révoquer ce lien » agit sans confirmation.
- **Modifier l'exercice** : la phrase « Variante de … » n'apparaît pas pour un exercice qui est une variante.
- **Onglet Programme** : « Créer un programme » mène à la page Programmes, encore vide, sans rien de prérempli pour ce sportif.
