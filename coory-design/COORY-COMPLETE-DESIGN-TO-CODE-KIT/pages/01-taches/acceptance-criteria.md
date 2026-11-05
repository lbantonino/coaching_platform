# 01 · Tâches — critères d’acceptation

## Spécifiques
- [x] Les 4 vues intelligentes affichent les bons compteurs (Aujourd’hui 3, À venir 6, Toutes 9, Terminées 0 en démo).
- [x] Créer une liste inline lui donne la couleur suivante de la palette.
- [x] Cocher une tâche met à jour tous les compteurs immédiatement.
- [x] Mobile : passage 1b → 1c → 1b sans perte de saisie.

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

## Notes de réalisation (05/11/2026, D-129)
- Nombres de la démo : ceux des vraies données (2 tâches du coach A, rangées dans Programmes et Facturation), pas les 9 tâches inventées de la maquette (« données de démo remplacées par les données réelles »).
- Vues : toutes montrent les tâches à faire ; « Terminées » les faites (cocher fait passer la tâche dans « Terminées », « Annuler » la rend).
- Ajout rapide : Aujourd'hui -> échéance aujourd'hui ; À venir -> demain ; une liste -> dans la liste ; pas d'ajout rapide dans « Terminées ».
- Titre coloré : version foncée de la couleur (contraste ≥ 4,5:1) ; pastilles aux couleurs exactes du kit.
- Téléphone : « ··· » sur chaque liste de l'accueil (gestion, décision 9) à la place du chevron de la maquette ; onglets défilants : les 4 vues puis les listes.
- Couleurs : 6 (palette du kit) ; renommer dans la ligne ; supprimer avec confirmation.
