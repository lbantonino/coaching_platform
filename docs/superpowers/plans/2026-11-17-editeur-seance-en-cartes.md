# Éditeur « Modifier la séance » en cartes : plan

> Exécution native, sans commit (Antonino commite) ; relecture indépendante à la fin. Dernier point de
> la liste du test sur iPhone du 15/11. Maquette validée le 17/11 (planches avant / après) et 4 décisions
> prises question par question.

**Goal :** l'éditeur d'une séance montre EXACTEMENT les cartes de la séance (D-187 : nom en gras, volume
en haut à droite, lignes, repos en gris, barre de couleur, « ⋯ »), avec ce qu'il faut pour modifier :
poignée de déplacement, carte ouverte entourée de violet, « + Ajouter » dans les grandes cartes. Les
panneaux de droite (feuille sur téléphone) restent ceux d'aujourd'hui, sauf la colonne RIR retirée.

**Spec :** décisions ci-dessous + D-187 (`docs/superpowers/specs/2026-11-15-seances-en-cartes-design.md`).

## Décisions d'Antonino (17/11)
1. **RIR retiré** de l'éditeur pour de bon (les valeurs déjà enregistrées restent en base, jamais affichées).
2. **Échauffement et Retour au calme = cartes dans la liste** (première et dernière), comme la séance
   affichée ; un appui ouvre leur texte. Plus de champs dans la carte du haut.
3. **Pas d'image** sur les cartes (plus de carré gris).
4. **Kilos estimés sur la carte** : « 5 répétitions · ≈ 78,5 kg (75 %) » quand le max du sportif est
   connu (même calcul que la publication : `kgFromPercent`, arrondi au demi-kilo) ; sinon « 75 % du max ».

## Choix pris par Claude
- Les textes des cartes viennent du MÊME modèle que la vue (`sessionCards`), cherchés par chemin
  (`[id]`, `[groupe, id]`, `["warmup"]`, `["cooldown"]`) : l'éditeur et la séance ne peuvent pas diverger.
- Une coque commune (`_session/card-shell.tsx`) dessine la carte et la grande carte de l'éditeur ; les trois
  listes (musculation, course, Hyrox) gardent leur logique (déplacement, sélection, menus, compteurs).
- Course et Hyrox : le compteur de tours (− 5 +) reste dans l'en-tête de la grande carte (c'est là qu'on
  le change) ; « 5 fois » / « 3 tours » se lisent dans le compteur.
- Échauffement vide : sa carte dit « Aucun, appuie pour en écrire un » (le coach peut l'ajouter).
- Les PDF ne changent pas (l'affichage d'une séance publiée est inchangé ; le RIR n'y est déjà plus).

## Review Focus
1. Glisser-déposer (souris, doigt, clavier flèches) toujours juste dans les trois listes et dans un
   superset ; la poignée reste la seule zone de glisse.
2. Une carte sélectionnée est bien celle du panneau (desktop) / de la feuille (téléphone), échauffement
   et retour au calme compris ; « Supprimer » d'une carte ne laisse pas un panneau orphelin.
3. Séance lue seule (programme archivé, modèle Coory) : ni poignée, ni « + », ni menus d'édition.
4. Kilos estimés : max absent, exercice sans lien à la Bibliothèque, % mixtes, exercice tenu (secondes).
5. Accessibilité : nom accessible de chaque carte (bouton de sélection), focus visible, cibles ≥ 44 px
   sur téléphone.

### Task 1 : kilos estimés dans le modèle des cartes (Vitest d'abord)
`sessionCards(content, { maxes })` (`src/domain/training/session-cards.ts`) ; tests
`tests/unit/session-cards.test.ts`.

### Task 2 : musculation en cartes
`_session/card-shell.tsx` (nouveau), `strength-parts.tsx` (liste en cartes, plus de vignette ni de
points, échauffement et retour au calme en cartes, colonne RIR retirée), `session-editor.tsx` (champs
d'échauffement retirés de la carte du haut, panneau de texte de l'échauffement / du retour au calme) ;
e2e mis à jour d'abord quand un libellé change.

### Task 3 : course et Hyrox en cartes
`running-parts.tsx`, `hyrox-parts.tsx` sur la même coque ; e2e.

### Task 4 : vérifications
Captures téléphone / ordinateur, sombre / clair ; suites complètes ; docs (D-190), mémoire ; relecture.
