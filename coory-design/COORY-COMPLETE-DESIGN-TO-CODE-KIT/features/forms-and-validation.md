# Formulaires et validation

Formulaires couverts : 06/12 Séance · 08/11 Exercice · 10 Nouveau sportif · 13 Paramètres · 07 Nouveau groupe.
- **Ne pas modifier les règles de validation existantes** (source de vérité = code). Les règles visibles dans les maquettes sont listées dans `../design-system/forms.md`.
- Champs obligatoires sans « facultatif » ; facultatifs marqués « facultatif » en `#8b8996`.
- Valeurs initiales : celles de l’objet édité (06, 11, 12), ou les **valeurs par défaut des Préférences** (13) pour une nouvelle séance (durée 60, lieu, prix, paiement).
- Soumission : bouton principal ; Entrée dans un champ simple soumet (sauf textarea).
- Erreurs : composant d’erreur existant ; contour rouge `inset 0 0 0 1.5px #c0213d` + message `12px` (PROPOSED si rien n’existe).
- Quitter avec des modifications : confirmation « Quitter sans enregistrer ? » (kit Modals) — PROPOSED.
- Persistance : aucune sauvegarde automatique (sauf thème, localStorage).
