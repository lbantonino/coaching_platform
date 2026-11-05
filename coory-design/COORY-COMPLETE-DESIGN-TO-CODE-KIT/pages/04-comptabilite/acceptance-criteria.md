# 04 · Comptabilité — critères d’acceptation

## Spécifiques
- [x] Chiffres formatés `2 691,98 €` (espace fine, virgule).
- [x] Résultat négatif en rouge `#c0213d`, positif `#11867a` dans le tableau.
- [x] Clic sur une barre = période Mois + ligne surlignée.

## Critères communs (toutes les pages)
- [x] Shell global inchangé (sidebar, header, Assistant IA, cloche, badges) — seule l’entrée active et le titre varient.
- [x] Superposition à 1280 px avec `screenshots/desktop-original*.png` : écart ≤ 2 px sur positions, tailles, rayons ; couleurs identiques aux valeurs de `layout-measurements.md`.
- [x] Superposition à 390 px avec `screenshots/mobile-original*.png` (hors barre d’état de présentation).
- [x] Police Plus Jakarta Sans, graisses et tailles conformes à `content.md` / `layout-measurements.md`.
- [x] Tous les éléments de `interactive-elements.md` sont branchés (aucun bouton mort, sauf ceux marqués PROPOSED et masqués/désactivés).
- [x] Aucune fonctionnalité existante retirée ; données de démo remplacées par les données réelles.
- [x] 1440 / 1920 / 2560 / 3440 px : pas d’étirement au-delà des plafonds de `design-system/responsive.md`.
- [x] Mobile 320 / 390 / 430 px + clavier ouvert : aucun chevauchement, zones tactiles ≥ 44 px.
- [x] Navigation clavier complète, focus visible, aria-labels présents.

## Notes de réalisation (05/11/2026, D-130)
- Chiffres réels (organisation A sans TVA : « Gagné », « Dépensé » sans « HTVA » ; la démo à 21 % les affiche).
- Menu « + » du téléphone : feuille du bas « Ajouter » (comme les autres menus de l'app) plutôt qu'une bulle ancrée.
- Clic sur une barre : la période choisie pour toute la page (dans l'unité affichée : mois, semaine ou année).
- Plafond 1 600 px (PROPOSED) appliqué.
