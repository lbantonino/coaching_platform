# Checklist de non-régression

> Validation globale H, 05/11/2026 (D-135), comparée au code d'avant le kit (commit 58c08d5).

- [x] Shell global : le menu latéral n'a pas changé ; l'en-tête et la barre du téléphone ont changé seulement par décisions du propriétaire (D-124 chemin sur une ligne, D-125 titre de la barre, D-132 le bouton Assistant ouvre la boîte) ; menu du compte : un commentaire.
- [x] Routes existantes inchangées : une seule page ajoutée (`/coach/assistant`) ; `/coach/profil` garde son adresse (redirection vers la fenêtre des Paramètres, D-127 / D-133).
- [x] Appels API existants inchangés : seules les actions des pages refaites ont changé, par décision (listes de tâches D-129, actions en lot des Notifications D-128).
- [x] Permissions inchangées : 455 tests de base (RLS) verts, dont le nouveau test d'isolation des listes de tâches et des notifications supprimées (`34_listes_et_notifications_supprimees.test.sql`).
- [x] Validations inchangées : Zod et contraintes en base, 268 tests unitaires verts.
- [x] Pages non concernées par le kit : aucun changement visuel en dehors de l'en-tête commun (D-124).
- [x] Tests existants verts : lint, types, format, Vitest 268/268, base 455/455, Playwright 188 réussis / 0 échec.
