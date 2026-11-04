# 01 · Tâches — interactions

| Élément | Déclencheur | Comportement attendu | Cas limites / statut |
|---|---|---|---|
| « + Nouvelle tâche » (header) | Clic | Ouvre la ligne d’ajout rapide dans la vue courante et y place le focus (`tapD`) | Existant ? → TO-VERIFY (peut ouvrir la modale « Nouvelle tâche » existante du kit Modals) |
| Tuile de liste intelligente | Clic | Change la vue ; `aria-pressed=true` ; titre + compteur mis à jour | — |
| Ligne de liste perso | Clic | Affiche la liste ; titre coloré | — |
| « + Nouvelle liste » | Clic | Affiche un input inline « Nom de la liste » ; Entrée = crée, Échap/vidé = annule | Nom vide → rien |
| Rond à cocher | Clic / Espace | Bascule terminée (`aria-checked`) ; la tâche passe dans « Terminées » ; compteurs mis à jour | Animation de coche ≤ 200 ms |
| Input « Nouvelle tâche » | Saisie + Entrée | Ajoute la tâche en bas de la vue courante (liste = vue si liste perso) | Vide → ignoré |
| Mobile « ‹ Listes » | Tap | Retour à l’accueil des listes | — |
| Mobile onglets de listes | Tap / swipe horizontal | Change de liste sans quitter l’écran | — |
| Mobile FAB + | Tap | Nouvelle tâche (focus input) | — |

Inventaire exhaustif (handler par élément) : `interactive-elements.md`. Logique de référence : `../../source-design-files/pages/01-taches/logic.js`.
