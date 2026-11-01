# Audit du design de Coory (1er novembre 2026)

Étape 1 de la refonte du design (voir `00_INDEX.md` et `SUIVI_IMPLEMENTATION.md`). Demande d'Antonino : « je trouve qu'elle ressemble à toutes les autres applications faites par toi » ; il veut une application digne de Coory et totalement différente.

**Méthode.** Captures sur téléphone (390 px) et ordinateur (1366 px), thème sombre et clair, de 10 écrans : tableau de bord, Sportifs, fiche sportif, Agenda, Programmes, Bibliothèque, fiche exercice, Facturation, Messages, accueil du sportif. Mesures dans le code (`src/`). Compétences utilisées : Taste (signes d'interface générique), Front-End Design (direction), UX Pro Max (conventions du secteur), Apple Design (sensation, typographie, matériaux), Emil (finitions), mobile-native (téléphone), critique de design (grille d'analyse). Les images RepDB ont été masquées sur les captures analysées.

---

## 1. Lecture d'ensemble

**Comment je lis Coory aujourd'hui** : une application métier sur téléphone pour coachs sportifs indépendants et leurs sportifs, avec le langage d'un « SaaS sombre et chic », très proche des kits de tableau de bord générés par IA.

**Réglages actuels** (échelle 1 à 10 de Taste) : originalité de la mise en page 3, mouvement 2, densité 6 à 7. Tout est symétrique, empilé, statique et chargé.

**Première impression (2 secondes)** : sur chaque écran, l'œil tombe d'abord sur le grand bouton or (« Créer », « Nouveau sportif », « Nouvelle séance », « Créer une facture »), pas sur le contenu. L'émotion est sobre et propre, mais froide : on dirait un logiciel de gestion (banque, CRM), pas une application de sport. Rien n'évoque la piste, le chrono, l'effort, la salle, l'Hyrox.

**La convention du secteur** (UX Pro Max, catégorie « application de fitness ») : style vif, en blocs, fond très sombre, orange énergique et bleu électrique. Coory est entre deux mondes : une app de sport pour le sportif, un outil de pro pour le coach (agenda, facturation, comptabilité). Aujourd'hui, il ne ressemble à aucun des deux en particulier, seulement à « une app générée ».

---

## 2. Les signes « fait par une IA », un par un

| Signe | Où dans Coory | Mesure |
| --- | --- | --- |
| Fond presque noir et un seul accent | Thème sombre : graphite `#141518` et or `#e2c47a` | Partout |
| Papier crème et or ancien | Thème clair : `#f4f3ef` et `#cba553`, la palette que Taste interdit par défaut | Partout en clair |
| Tout découpé en cartes arrondies identiques | Chaque bloc est une carte de 20 px avec un filet de 1 px ; des cartes dans des cartes (prochaine séance, objectif du sportif) | `rounded-card` : 57 fois dans 34 fichiers ; `border border-line` : 97 fois |
| Un pictogramme dans un carré teinté devant chaque titre | Cartes de la fiche sportif, Facturation, tuiles de chiffres | Composant `CardTitle`, tuiles 2 × 2 de Sportifs |
| Police « machine à écrire » pour les heures et les dates | « 09:00 », « 30 oct. », « Hier », « Sem. 1/12 » | `font-mono` : 105 fois dans 49 fichiers |
| Petits libellés en capitales | « AUJOURD'HUI », « DEMAIN », `MicroLabel` | 22 `uppercase` |
| Un arc-en-ciel de pastels de même intensité | Violet, vert, bleu, turquoise, orange, rose, rouge sur les pastilles, les chiffres et même les titres (« À facturer » en rouge, « Factures » en vert) | La couleur ne veut plus rien dire |
| Points de statut décoratifs | « ● Actif » sur chaque ligne de sportif, symboles ♂ ♀ à côté de chaque nom | Sportifs, Messages |
| L'étincelle de l'assistant IA | En haut de chaque écran | Barre du haut |
| Une seule police, sans échelle | Inter Tight pour tout ; 22 tailles de texte différentes entre 11 et 30 px | Hiérarchie plate |
| Les icônes de toutes les apps générées | Lucide | 96 fichiers |
| Les arrondis | Au moins 10 valeurs (20, 14, 12, 10, 9 px, pilule, rond…) sans règle écrite | Formes peu cohérentes |

---

## 3. Critique écran par écran (téléphone d'abord)

| Écran | Ce qui marche | Problème principal | Gravité |
| --- | --- | --- | --- |
| Tableau de bord | La prochaine séance est en tête, avec l'heure en grand | 3,3 écrans de long ; une grille d'agenda complète (6 h à 22 h) au milieu ; 7 blocs de même poids ; rien ne domine | Forte |
| Sportifs | Recherche et filtres clairs | 4 tuiles de chiffres avant la liste ; chaque ligne porte 7 éléments (case, avatar, nom, symbole, point, discipline, menu) | Moyenne |
| Fiche sportif | Onglets, informations complètes | 8 cartes empilées, chacune avec son bouton « Modifier » ; 2,7 écrans de long ; tuiles qui dépassent à droite | Moyenne |
| Agenda | Fonctionnel, lisible | Copie de la grille Google Agenda ; heures en police mono ; bouton or en tête | Faible |
| Programmes | Message d'état vide clair | Page vide avec un cadre pointillé gris et **aucun bouton** pour commencer | Moyenne |
| Bibliothèque | Illustrations cohérentes (fond bleu), filtres | 693 exercices en cartes identiques ; la page ressemble à n'importe quel catalogue | Faible |
| Fiche exercice | Images, muscles, consignes | 5 maquettes refusées : le problème venait des fondations, pas de la mise en page | Moyenne |
| Facturation | Logique claire (à facturer, factures) | Noms coupés (« Thomas Pe... ») car le bouton « Créer la facture » prend la moitié de la ligne ; titres colorés en rouge et vert | Moyenne |
| Messages | Simple | Une carte qui enveloppe la liste sans raison ; « 1 non lu » dans la couleur « en retard » (orange) | Faible |
| Accueil du sportif | Barre d'onglets en bas, comme une vraie app | Trois cartes de texte ; aucune « séance du jour » mise en avant ; ressemble à une page de réglages, pas à une app de sport | Forte |

---

## 4. Sensation d'application sur téléphone (Apple Design, mobile-native)

| Constat | Pourquoi c'est un problème | Correctif |
| --- | --- | --- |
| Pas de `-webkit-tap-highlight-color` | Flash gris à chaque toucher sur iPhone : le premier signe « site web » | `transparent` sur `html`, l'appui garde son propre retour |
| Pas d'`overscroll-behavior` | Toute la page rebondit et « tire pour rafraîchir » | `none` sur la page, `contain` sur les listes qui défilent |
| Pas de `touch-action: manipulation` ni de `user-select: none` sur les boutons | Appui long = le libellé du bouton se sélectionne | Sur les contrôles seulement, jamais sur le texte |
| `themeColor` unique (`#141518`) et `colorScheme: "light"` déclaré alors que le thème par défaut est sombre | Barre d'état sombre en thème clair ; déclaration contradictoire | Une couleur par thème, `color-scheme` cohérent |
| Le coach navigue par un menu « burger » sur téléphone, le sportif par une barre d'onglets | Le coach n'a pas une vraie app ; trois boutons carrés identiques en haut de chaque écran | Barre d'onglets en bas pour le coach aussi, création à portée de pouce |
| Barres opaques avec un filet de 1 px ; aucun passage animé entre écrans | Rien ne donne de profondeur ni de continuité | Matériau translucide pour les barres, transitions courtes et utiles |
| Bons points | Champs à 16 px (pas de zoom iPhone), retour d'appui (`scale .98`), survol réservé à la souris (Tailwind 4), cibles de 44 px | À garder |

---

## 5. Finitions des composants (Emil)

| Avant | Après | Pourquoi |
| --- | --- | --- |
| Chaque bloc dans une carte de 20 px avec un filet | Des surfaces seulement quand elles portent une hiérarchie ; le reste groupé par l'espace et la typographie | Les cartes partout aplatissent tout |
| Heures et dates en `font-mono` | Chiffres à chasse fixe de la police principale (`tabular-nums`) | Le mono donne un air de terminal, pas de sport |
| Pictogramme dans un carré teinté devant chaque titre | Titre seul ; une icône seulement quand elle aide à repérer | Décor sans information |
| Titres de section colorés (rouge, vert) | Titres neutres ; la couleur sur l'état (en retard, payée) | Le rouge sur un titre crie une erreur qui n'existe pas |
| « 1 non lu » en orange « attention » | Compteur dans la couleur de l'action, ou neutre | Un message non lu n'est pas un retard |
| Grand bouton or en tête de chaque page | Une seule action principale, à portée de pouce (barre du bas ou bouton flottant) | Il vole la première place au contenu |

---

## 6. Ce qui marche, à garder

- Le mobile d'abord est réel : tout est pensé et vérifié sur téléphone.
- Les cibles de 44 px, les contrastes mesurés (AA), les champs à 16 px.
- Les **jetons centralisés** (`tokens.css`) : c'est ce qui rend la refonte rapide, toute l'app suivra.
- Les illustrations d'exercices sur le même fond bleu clair : cohérentes.
- Le vocabulaire : français simple, tutoiement, libellés qui disent ce qu'ils font.
- Les tests de parcours : ils vérifient les rôles et les textes, pas les couleurs, donc ils survivront à la refonte.

---

## 7. Diagnostic de fond

Coory ressemble à un **logiciel de gestion sombre et chic**, pas à une application de sport. L'or évoque le luxe ou la banque, pas l'effort. Le monde de Coory n'apparaît nulle part, ni dans les couleurs, ni dans la typographie, ni dans les formes : la piste d'athlétisme, le chrono, le dossard, le tableau blanc du coach, la craie, la salle, les huit stations Hyrox. Les cinq maquettes de la fiche exercice ont toutes échoué pour cette raison : elles réarrangeaient les mêmes ingrédients.

## 8. Priorités pour la refonte

1. **Une identité tirée du sport** : palette, typographie et formes (étape 2, 2 ou 3 directions au choix).
2. **Fin du « tout en cartes »** : hiérarchie par l'espace et la typographie, quelques surfaces fortes seulement.
3. **Un seul moment fort par écran** (la séance du jour, la prochaine séance) et un tableau de bord mobile beaucoup plus court.
4. **Une vraie app coach sur téléphone** : barre d'onglets, création à portée de pouce, les réglages natifs du chapitre 4.
5. **Des couleurs qui ont un sens** : disciplines d'un côté, statuts de l'autre, le reste neutre ; une échelle de texte courte ; des états vides qui invitent à agir.

## 9. Suite

Étape 2 : 2 ou 3 directions d'identité, chacune avec un nom, une idée, une palette (4 à 6 couleurs), une typographie et un écran clé sur téléphone, présentées **hors de l'application** pour ne pas être bridées par les jetons actuels. Antonino choisit ; ensuite seulement on réécrit les jetons et les composants (étape 3), puis les écrans (étape 4).
