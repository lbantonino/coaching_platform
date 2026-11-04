# 04 · Comptabilité — interactions

| Élément | Déclencheur | Comportement attendu | Cas limites / statut |
|---|---|---|---|
| Période | Clic | Recalcule héro, répartition, sous-titres | — |
| Barre de mois | Clic | Sélectionne le mois, période = Mois, surligne la ligne du tableau | — |
| Bascule circulaire / barres | Clic | Change la visualisation (`aria-pressed`) | — |
| Onglets mouvements | Clic | Change la liste, repli à 5 lignes | — |
| Filtres | Clic | Filtre les paiements par mode | Uniquement onglet Paiements |
| Voir les N / Afficher moins | Clic | Déplie / replie | Masqué si ≤ 5 |
| Menu « … » d’une ligne | Clic | Actions de ligne existantes (TO-VERIFY) | — |
| Tableau Afficher/Masquer | Clic | Déplie le tableau | — |
| Mois sans activité | Clic | Affiche/masque les lignes vides | — |
| FAB + | Tap | Ouvre/ferme le menu ; items → modales existantes « Nouveau paiement » / « Nouvelle dépense » (kit Modals) | Overlay ferme |

Inventaire exhaustif (handler par élément) : `interactive-elements.md`. Logique de référence : `../../source-design-files/pages/04-comptabilite/logic.js`.
