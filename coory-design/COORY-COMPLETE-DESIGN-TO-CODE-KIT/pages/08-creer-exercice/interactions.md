# 08 · Créer un exercice / Créer ma variante — interactions

| Élément | Déclencheur | Comportement attendu | Cas limites / statut |
|---|---|---|---|
| Pilule de rubrique | Clic | Sélection unique ; aperçu à jour | — |
| Pilule de muscle | Clic | Bascule ; compteur + aperçu | — |
| Nom | Saisie | Aperçu en direct | Vide → « Nouvel exercice » ; bouton désactivé (TO-VERIFY) |
| Matériel ▾ | Clic | Liste existante du matériel | — |
| Voir l’original | Clic | Ouvre l’exercice d’origine | — |
| Créer / Enregistrer ma variante | Clic | Création via la logique existante ; variante liée à l’original | TO-VERIFY champ parent |
| Annuler | Clic | Retour à la page d’origine | — |

Inventaire exhaustif (handler par élément) : `interactive-elements.md`. Logique de référence : `../../source-design-files/pages/08-creer-exercice/logic.js`.
