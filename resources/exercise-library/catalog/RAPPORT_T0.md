# Rapport T0 : catalogue maître des exercices Coory

30 octobre 2026. Étape T0 : préparation des données uniquement. **Rien n'a été modifié dans l'application** : ni Supabase, ni les routes, ni les composants, ni les programmes.

## 0. Mise à jour du 30/10 au soir : ce qui sera visible

Antonino a resserré la bibliothèque. Toutes les données restent dans le catalogue maître, avec un état `visible` ou `masqué` (rien n'est supprimé, tout se réactive en changeant `curation/bibliotheque.json`).

| Catégorie | Visible | Source des données | Images |
|---|---|---|---|
| Musculation | 580 | RepDB, traduit | RepDB |
| Cardio (hors course) | 17 | RepDB, traduit | RepDB |
| Hyrox | 8 | 5 RepDB et 3 Coory | **Coory uniquement**, les 8 images sont importées |
| **Total visible** | **605** | | |

- **Cardio** : box jump, corde à sauter, talons-fesses, montées de genoux, burpees, jumping jacks, mountain climbers, squat sauté, fentes sautées, pompes pliométriques, battle ropes (2), air bike, vélo, vélo d'appartement, vélo elliptique, stair climber.
- **Hyrox** : les 8 stations. Aucune image RepDB n'est utilisée, même pour les 5 stations qui en ont une chez RepDB. Sled pull en marche arrière et Sled pull assis ont été masqués à la demande d'Antonino.
- **Masqués (142)** :
  - mobilité : 108 (88 RepDB et 20 créations Coory) ;
  - course : 4 (course à pied, sur tapis, marche, marche inclinée) ;
  - créations Coory sans contenu : 28 (18 éducatifs de course et 10 exercices de musculation) ;
  - variantes du Sled pull : 2 (retirées par Antonino).

  Liste dans `exercices-masques.csv`. Chaque coach pourra ajouter ses propres exercices, avec une image ou un lien vidéo.
- **Images RepDB** : les 597 exercices visibles venant de RepDB ont tous leurs images.
  - 105 ont une image principale.
  - 492 n'ont qu'un début et une fin. Pour eux, l'image de début sert d'image principale.

  Elles seront copiées dans notre stockage à l'étape images (T3), jamais affichées depuis le site de RepDB.
- **Il reste à écrire** les consignes, muscles et niveau des 3 exercices Hyrox créés par Coory : Sled pull, Burpee broad jump, Sandbag lunges.

Les sections 1 à 7 décrivent le catalogue maître complet (747 exercices, visibles et masqués). Les sections 8, 11, 12 et 13 sont à jour.

## 1. En bref

| | Nombre |
|---|---|
| Entrées de départ | 816 (701 RepDB + 115 kit Coory) |
| Doublons fusionnés | 17 |
| Configurations d'entraînement mises de côté | 52 |
| **Exercices uniques dans le catalogue maître** | **747** |
| dont repris de RepDB (traduits) | 694 |
| dont créations Coory | 53 (36 nouveaux exercices et 17 variantes) |

Le compte est juste : 816 − 17 − 52 = 747.

## 2. Répartition par discipline

Un exercice peut appartenir à plusieurs disciplines (62 sont dans ce cas). La colonne « principale » donne la première discipline de chaque exercice.

| Discipline | Exercices concernés | Discipline principale |
|---|---|---|
| Musculation | 602 | 597 |
| Mobilité | 111 | 108 |
| Échauffement | 49 | 18 |
| Running | 22 | 0 |
| Cardio | 20 | 19 |
| Hyrox | 12 | 5 |

**Les 8 stations Hyrox sont complètes**, avec leur numéro d'ordre :
1. SkiErg
2. Sled push
3. Sled pull (création Coory, absent de RepDB)
4. Burpee broad jump (création Coory)
5. Rameur
6. Farmers carry kettlebells
7. Sandbag lunges (création Coory)
8. Wall ball

**Niveaux** : débutant 297, intermédiaire 343, avancé 54. Les 53 créations Coory n'ont pas encore de niveau.

## 3. Informations manquantes

| Information | Exercices | Pourquoi |
|---|---|---|
| Illustration | 747 | Les illustrations Coory restent à produire (voir section 9). |
| Consignes | 53 | Créations Coory : aucune source, rien n'a été inventé. À écrire puis faire valider par un coach. |
| Muscles | 54 | Les 53 créations Coory, plus 1 exercice RepDB (Posture du cadavre). |
| Niveau | 53 | Créations Coory. |
| Nom et consignes à relire | 694 | Traduction faite, statut « brouillon à relire ». |
| Remarques de traduction | 41 | Noms incertains ou consigne source ambiguë, détaillés dans `a-valider.csv`. |
| Nom de plus de 45 caractères | 5 | À raccourcir si possible. |

**Aucun matériel = poids du corps.** 234 exercices n'ont aucun matériel : ils sont au poids du corps. Ce n'est pas un manque.

**Non repris pour l'instant** : les descriptions (environ 17 000 mots) et les conseils (environ 25 000 mots) de RepDB. Ils ne sont pas traduits, puisque seuls les noms et les consignes étaient demandés.

**Point de style connu** : le genre de « kettlebell » n'est pas harmonisé dans les consignes. On trouve « le » ou « un » 87 fois, « la » ou « une » 35 fois. À unifier lors de la relecture.

## 4. Doublons fusionnés (17, détail dans `doublons-fusionnes.csv`)

- **15 doublons entre le kit Coory et RepDB.** Exemples : Wall balls avec cible et Wall ball, Talons-fesses et Heel Flicks, Inchworm, Chat-vache, Couch stretch, Sandbag carry, Suitcase carry.
- **1 doublon interne au kit** : les deux exercices de cheville au mur.
- **1 doublon interne à RepDB** : Rear Delt Fly et Dumbbell Reverse Fly. Même mouvement et même matériel, RepDB le compte deux fois.

**Règle appliquée.** On garde un seul exercice. Les noms français et anglais de l'entrée retirée deviennent des alias de recherche. Ses disciplines s'ajoutent à celles de l'exercice gardé, et son identifiant d'origine reste dans `merged_from` et `sources`.

**Variantes gardées.** Les variantes techniquement distinctes restent des exercices à part, reliés à leur exercice de base par `variant_of`. Exemples :
- Sled pull en marche arrière, Sled pull assis ;
- Sandbag lunges, variante des fentes marchées ;
- Pallof press avec marche ;
- 90/90 avec décollage de jambe.

**Cas proches non fusionnés.** Les exercices qui ne diffèrent que par l'inclinaison, le matériel ou un maintien statique restent distincts.

## 5. Configurations mises de côté (52, détail dans `seances-types.json`)

| Type | Nombre | Exemples |
|---|---|---|
| Réglage d'un exercice | 20 | SkiErg 500 m et 1 000 m, Sled push lourd, Goblet squat tempo 3-1-1, Back squat avec pause |
| Séance type | 19 | Footing facile, Fartlek, VO2 max, 400 m sur piste, intervalles au rameur |
| Travail technique | 9 | Technique SkiErg, cadence, descente, respiration aux wall balls |
| Bloc d'enchaînement | 4 | Transitions Hyrox (traîneau vers course, rameur vers portage) |

**Ce que contient chaque entrée** : l'exercice du catalogue auquel elle renvoie (clé et identifiant) et les seuls paramètres présents dans le nom d'origine (par exemple 500 m). Rien n'est inventé. Elles serviront aux onglets Blocs et Séances types (P3-02 et P3-03).

**Les 6 réglages « avec pause » venant de RepDB sont à confirmer.** Il s'agit de squat, soulevé de terre, tractions, développé couché, développé incliné et développé militaire. Ta règle n°3 en fait des réglages de tempo, mais certains coachs les considèrent comme des variantes.

## 6. Normalisation (`curation/vocabulaires.json`)

Les codes sont en anglais, comme le reste du code de Coory, et les libellés sont en français.

- **Disciplines (6)** : Musculation, Hyrox, Running, Cardio, Mobilité, Échauffement. Les codes `strength`, `hyrox` et `running` sont ceux déjà utilisés par Coory.
- **Matériel (71 codes en 6 groupes de filtre)** : poids libres, machines, cardio et traîneau, barres et suspension, petit matériel, poids du corps. Les synonymes des deux sources ont été réunis, par exemple `flat_bench` devient `bench` et `loop_band` devient `mini_band`. Le banc est ajouté quand RepDB l'indiquait seulement en tag.
- **Muscles (32 en 13 groupes)** : par exemple Grand dorsal dans Dos, Moyen fessier dans Fessiers.
- **Niveaux (3)** : Débutant, Intermédiaire, Avancé.
- **Mesures réglables en séance (12)**, alignées sur les docs 05 à 07 :

  | Mesure | Unité |
  |---|---|
  | Répétitions | rép. |
  | Charge | kg |
  | Durée | s |
  | Distance | m |
  | Calories | kcal |
  | Allure de course | s/km, affichée en min/km |
  | Allure ergomètre | s/500 m |
  | Longueurs de traîneau | sans distance inventée |
  | Tempo | |
  | Inclinaison | % |
  | Vitesse | km/h |
  | Hauteur | cm |

  Séries, repos, RPE et notes du coach restent disponibles pour tous les exercices.

**Mesures des exercices RepDB.** Elles sont déduites par une règle simple et lisible dans le script :
- ergomètre : distance, durée, calories, allure /500 m ;
- traîneau : distance, longueurs, charge ;
- maintien : durée ;
- musculation chargée : répétitions, charge, tempo.

Les stations Hyrox et la course ont des mesures fixées à la main.

## 7. Formulations médicales retirées

- **1 330 tags retirés** : `knee_safe`, `lower_back_safe`, `shoulder_safe`, `rehab` et `no_axial_load`. Les quatre premiers laissaient entendre qu'un mouvement est sans risque, ou servait à la rééducation. Le dernier est un fait mécanique, mais RepDB l'utilisait comme argument de sécurité : retiré par prudence, il peut revenir comme information technique si un coach le valide.
- **29 objectifs « rééducation » retirés.**
- **Consignes** : les traducteurs avaient pour règle de neutraliser toute promesse de sécurité ou de soin. Les consignes RepDB n'en contenaient presque pas : 1 seule a été neutralisée.
- **Descriptions et conseils RepDB** : non repris, donc aucune formulation médicale n'y passe.
- **Recommandation pour l'app** : afficher une courte mention « Contenu informatif, pas un avis médical ». La licence RepDB le précise elle-même (terme 7).

## 8. Droits d'utilisation (licence RepDB Free Tier v1.0, relue le 30/10/2026)

Une copie de la licence est dans `data/source/REPDB-LICENSE-DATA.md`.

| Question | Réponse |
|---|---|
| Usage commercial dans Coory | **Autorisé**, gratuitement, à l'intérieur de l'application (terme 1). |
| Mention | **Obligatoire et visible** : « Exercise data by RepDB (repdb.co) », dans l'écran crédits, le README ou le pied de page (terme 2). Les 694 exercices concernés portent `attribution_required = true`. |
| Traduire et adapter les textes | **Pas interdit** pour l'usage dans l'app. La licence parle elle-même de jeu « modifié ou dérivé » et interdit seulement de le **republier**. Elle ne cite pas la traduction mot pour mot : une confirmation écrite à support@repdb.co lèverait tout doute avant la mise en ligne. |
| Republier le catalogue | **Interdit** comme jeu de données, dépôt ou API, même traduit (terme 3). La protection des bases de données s'ajoute : pas d'extraction substantielle publique. Les exercices RepDB portent donc `exportable = false`, et seules les 53 créations Coory pourront être exportées. |
| Images RepDB | **Utilisées pour la musculation et le cardio** : permis dans l'app, redimensionner ou recadrer aussi (termes 1 et 4). Elles seront copiées dans notre stockage, jamais republiées. **Jamais données à une IA**, même comme modèle de style (terme 5) : ChatGPT ou Claude Design ne reçoivent qu'une description en mots. **Aucune image RepDB pour l'Hyrox.** |

**Dépôt Git.** Le dépôt est privé : y garder ces fichiers n'est pas une republication. Si tu le rends public (portfolio), il faudra exclure tous les fichiers dérivés de RepDB :
- `data/source/` ;
- `data/exercises.generated.*` ;
- `curation/traductions-fr.json` ;
- `catalog/`.

Je propose d'ajouter cette exclusion à T1, avec ton accord.

## 9. Identifiants

- **`key`** : clé lisible et stable, par exemple `sled-pull` ou `wall-ball`. Elle ne change jamais, même si le nom français change.
- **`id`** : identifiant interne Coory (UUID v5) calculé à partir de la clé. Il est **identique à chaque génération** (vérifié) et donc identique en développement et en production. L'espace de noms est fixé dans le script et ne doit jamais changer.
- **`sources`** : identifiants d'origine pour la traçabilité, c'est-à-dire l'id RepDB, l'id du kit (`repdb-…`, `coory-…`) et la licence. **`merged_from`** liste les entrées fusionnées.

## 10. Exercices et variantes des coachs (prévu, sans rien coder)

Le format est prêt pour qu'un coach crée ses propres exercices sans toucher au catalogue commun :
- **`scope` et `organization_id`.**
  - Catalogue commun : `scope = global`, `organization_id = null`, en lecture seule pour tous les coachs.
  - Exercice d'un coach : `scope = organization` et l'identifiant de son organisation, visible seulement par elle.
- **`variant_of`.** Une variante de coach est une **copie** avec son propre identifiant, qui pointe vers l'exercice d'origine. Modifier la variante ne change jamais l'original.
- **`exportable`.** Vrai pour les exercices du coach et les créations Coory. Faux pour tout ce qui vient de RepDB.
- **Programmes.** Ils garderont une copie figée du nom et de l'image au moment de la publication (docs/08). Si un exercice du catalogue change ou est archivé, les programmes publiés ne bougent pas.

## 11. Illustrations (mis à jour le 30/10 au soir)

| Catégorie | Exercices visibles | Images |
|---|---|---|
| Musculation | 580 | RepDB : rien à produire |
| Cardio | 17 | RepDB : rien à produire |
| Hyrox | 8 | **Images Coory** : les 8 principales sont importées (`illustrations-hyrox.csv`) |

**Poses Hyrox.** Une seule image pour le SkiErg et le Rameur. Trois pour les autres : image principale, début et fin du mouvement.

**Brief pour ChatGPT ou Claude Design** (repris du kit) :
- personnage 3D semi-réaliste en studio : t-shirt jaune, short noir, chaussures blanches, matériel noir ou gris ;
- PNG à fond transparent, cadrage identique d'une image à l'autre ;
- un fichier par pose, nommé avec la clé exacte, à déposer dans `illustrations/hyrox/<clé>/` (voir le LISEZMOI de ce dossier) ;
- jamais d'image RepDB en référence.

**Images de remplacement.** Tant qu'une image Hyrox manque, la fiche affiche une tuile aux couleurs de Coory avec l'icône de la catégorie.

**Stockage prévu.** Les images RepDB et Coory iront dans Supabase Storage sous `exercises/<clé>/<pose>.webp`, à l'étape images (T3).

## 12. Fichiers livrés (dossier `catalog/`)

| Fichier | Contenu |
|---|---|
| `coory-exercise-catalog.json` | Catalogue maître : 747 exercices avec leur catégorie, leur état visible ou masqué, leurs images, et tous les vocabulaires. C'est lui qui servira à l'import en T1. |
| `coory-exercise-catalog.csv` | Le même contenu en tableur (séparateur `;`, s'ouvre directement dans Excel en français), les visibles en premier. |
| `doublons-fusionnes.csv` | Les 17 fusions, avec leur justification. |
| `seances-types.json` | Les 52 configurations mises de côté pour les Blocs et Séances types. |
| `a-valider.csv` | 657 lignes : les 605 exercices visibles et les 52 séances types, avec leurs motifs de validation en clair. |
| `illustrations-hyrox.csv` | Les 20 fichiers d'images Hyrox possibles (8 principales importées, début et fin facultatifs), un par ligne. |
| `exercices-masques.csv` | Les 140 exercices masqués et la raison de chacun. |
| `statistiques.json` | Les chiffres du rapport, recalculés à chaque génération. |

**Reproduire.** Depuis `resources/exercise-library/`, lancer `node scripts/build-master-catalog.mjs`. Toutes les décisions sont dans `curation/` : on corrige un fichier, on relance, et les identifiants ne bougent pas. Le script s'arrête au moindre code inconnu, doublon de clé ou variante orpheline.

## 13. À décider avant T1

1. **Relecture.** Qui relit les 694 traductions et valide les 53 créations Coory (Gianluca ?) ? Et le catalogue s'affiche-t-il avant validation, avec un statut « à valider » ?
2. **Les 6 réglages « avec pause »** : réglages de tempo, comme proposé, ou exercices à part entière ?
3. **Un doublon possible reste visible** : Développé épaules haltères assis contre Développé épaules haltères. Les autres cas douteux concernaient des exercices désormais masqués.
4. **Exclusion Git** des fichiers dérivés de RepDB (section 8).
5. **Descriptions et conseils RepDB** : les traduire aussi (environ 42 000 mots) ?
6. **Genre de « kettlebell »** : passer partout au féminin (« une kettlebell ») ?
