# 08 · Créer un exercice / Créer ma variante — critères d’acceptation

> Implémentée dans COORY le 04/11/2026 (D-122), sur le formulaire partagé avec la page 11 (D-121). Vérifiée au navigateur à 1280 et 390 px, création et variante (« Sled push » du catalogue), et par le parcours Playwright `tests/e2e/coach-exercises.spec.ts`. En plus (décision 4 d’Antonino) : bouton flottant « + » sur la Bibliothèque, au téléphone.

## Spécifiques
- [x] Variante : formulaire pré-rempli depuis l’exercice d’origine (pas de données en dur). *Lu dans le catalogue par `getExerciseSheet` : « Sled push (ma variante) », Hyrox, Fessiers + Quadriceps + Mollets, Traîneau (ce que montre la maquette, mais venu de la base). Bandeau « Variante de « … ». L’exercice d’origine reste inchangé. » + « Voir l’original » (sa fiche) ; téléphone : carte blanche au-dessus du formulaire, lien « Original ». Bouton « Enregistrer ma variante ».*
- [x] Aperçu au-dessus du formulaire, aucune colonne à droite. *Même aperçu que la page 11 (« Nouvel exercice » tant que le nom est vide).*

## Critères communs (toutes les pages)
- [x] Shell global inchangé (sidebar, header, Assistant IA, cloche, badges) — seule l’entrée active et le titre varient. *Fil d’Ariane « ← Bibliothèque » (création) ou « ← Sled push » (variante, sans le préfixe « Bibliothèque · », décision 1).*
- [x] Superposition à 1280 px avec `screenshots/desktop-original*.png` : écart ≤ 2 px sur positions, tailles, rayons ; couleurs identiques aux valeurs de `layout-measurements.md`. *Mêmes mesures que la page 11 (aperçu, champs, bouton 190 × 42) ; bandeau de variante 42 px en tête de la carte. Écarts voulus : « Voir l’original » sur une ligne (la maquette le coupe en deux) ; pilules 5 à 6 px plus étroites (voir page 11).*
- [x] Superposition à 390 px avec `screenshots/mobile-original*.png` (hors barre d’état de présentation). *Carte de variante, formulaire, barre fixe « Annuler / Créer l’exercice » (ou « Enregistrer ma variante »). Écarts voulus : en-tête SH-05 (retour dans la barre, titre dans le contenu), coche devant le mot dans les pilules.*
- [x] Police Plus Jakarta Sans, graisses et tailles conformes à `content.md` / `layout-measurements.md`.
- [x] Tous les éléments de `interactive-elements.md` sont branchés (aucun bouton mort, sauf ceux marqués PROPOSED et masqués/désactivés). *Pilules (aperçu à jour), matériel, Voir l’original, Créer / Enregistrer ma variante (action existante, variante liée par `variant_of`), Annuler (écran d’origine).*
- [x] Aucune fonctionnalité existante retirée ; données de démo remplacées par les données réelles. *Photo et lien vidéo gardés à la création (absents de la maquette 08, mais déjà dans l’app). Aide des consignes : texte de la maquette avec la vraie limite (« Une étape par ligne, 15 au maximum. Le sportif les voit dans son programme. »).*
- [x] 1440 / 1920 / 2560 / 3440 px : pas d’étirement au-delà des plafonds de `design-system/responsive.md`. *Plafond 1 120 px, aligné à gauche (comme la page 11).*
- [x] Mobile 320 / 390 / 430 px + clavier ouvert : aucun chevauchement, zones tactiles ≥ 44 px. *Lien « Original » agrandi à 44 px de haut ; pilules à 40 px comme la maquette.*
- [x] Navigation clavier complète, focus visible, aria-labels présents. *Lien « Original » nommé « Voir l’original » pour les lecteurs d’écran ; bouton flottant de la Bibliothèque nommé « Créer un exercice ».*
