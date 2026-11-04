# Champs de formulaire

| ID | Composant | Valeurs exactes |
|---|---|---|
| F-INPUT | Texte | `height:44–46px` (desktop) / `48px` (mobile) ; `padding:0 14px; border-radius:11–12px; background:#f8f7fb; box-shadow:inset 0 0 0 1px rgba(22,18,40,.12); font:400 14px` (mobile **16px**) ; focus `inset 0 0 0 1.5px #8b5cf6`, pas d’outline par défaut mais focus visible |
| F-SUFFIX | Avec unité | suffixe « € », « min », « % » en `#8b8996` à droite, même police |
| F-ICON | Avec icône | icône 14–15 `#64626e`/`#8b8996` à gauche, `gap:8–10px` (Lieu, Date, Heure, Lien vidéo) |
| F-SELECT | Liste déroulante | comme F-INPUT + chevron 14 `#64626e` à droite ; valeur par défaut grisée `#8b8996` (« Non précisé ») |
| F-AREA | Zone de texte | `min-height:84px` (desktop, 140 pour Consignes) / `88–130px` (mobile) ; `padding:12px 14px; font:400 14px/1.5` ; `resize:vertical` desktop, `none` mobile |
| F-LABEL | Label | `font:600 13–13.5px` (desktop) / `600 14px` (mobile) ; « facultatif » accolé en `font-weight:400; color:#8b8996` |
| F-HELP | Aide | `font:400 12px/1.45; color:#8b8996` sous le champ |
| F-SWITCH | Interrupteur | piste `40×24` (desktop) / `46–48×28` (mobile), `border-radius:12–14px; padding:3px` ; on `#8b5cf6`, off `#d6d4de`/`#d9d7e2` ; pouce blanc 18/22 px. Ligne cliquable entière (`role="switch"`, `aria-checked`) |
| F-CHECK | Case | `20×20` (desktop) / `22×22` (mobile), `border-radius:6–7px` ; off `inset 0 0 0 1.5px rgba(22,18,40,.25)` ; on `#8b5cf6` + « ✓ » blanc |
| F-DROP | Zone de dépôt photo (11) | `padding:12px; border-radius:14px; background:#f8f7fb` ; vignette 56×56 `#ede6ff` ; bouton « Parcourir » |
| F-CALC | Ligne de calcul live | `padding:12px 14px; border-radius:12px; background:#f8f7fb; font:400 13px` + icône info violette (06/12) |

## Validation (règles visibles dans les maquettes)
| Formulaire | Obligatoire | Message / comportement |
|---|---|---|
| 10 Nouveau sportif | Prénom seulement | bouton grisé tant que vide ; « Seul le prénom est obligatoire. » |
| 06/12 Séance | Titre, date, heure, durée (TO-VERIFY code) | sans prix : « Aucun prix : la séance ne sera pas facturée. » / collective « Sans prix, la séance ne compte pas dans l’encaissé. » |
| 08/11 Exercice | Nom (TO-VERIFY) | consignes : 15 lignes max |
| 13 Sécurité | nouveau mot de passe ≥ 10 caractères, confirmation identique | aide « Au moins 10 caractères. » |
| 13 TVA | taux numérique | champ visible seulement si « Je facture la TVA » |
**Messages d’erreur** : non dessinés → utiliser le composant d’erreur existant de l’app (TO-VERIFY). Proposition : texte `400 12px #c0213d` sous le champ + contour `inset 0 0 0 1.5px #c0213d`.
