# QA fonctionnelle et cas de test

Chaque ligne de `FEATURE_TRACEABILITY_MATRIX.md` = au moins un test. Cas prioritaires :

| ID | Scénario | Attendu |
|---|---|---|
| TC-01 | Créer un programme 12 semaines × 4 séances depuis zéro | 12 semaines datées, 48 séances vides, statut Brouillon, ouvre 03 |
| TC-02 | Créer depuis le modèle Coory « Prépa Hyrox » | copie datée ; modifier une séance de la copie ne change pas le modèle |
| TC-03 | Ouvrir un modèle Coory | aucune modification possible ; « Dupliquer dans Mes modèles » crée une copie modifiable |
| TC-04 | Enregistrer un programme comme modèle | apparaît dans Mes modèles sans sportif ni dates |
| TC-05 | Créer une phase S5–9, la renommer, la supprimer | les semaines restent |
| TC-06 | Passer la semaine 2 en jours fixes, portée « phase Base » | S1–S4 en jours fixes (S1 si passée : inchangée) |
| TC-07 | Fixer 2 séances le même jour | avertissement, autorisé |
| TC-08 | Tenter de changer le jour d'une séance coach | impossible (cadenas) |
| TC-09 | Sportif autorisé déplace une séance à jour fixe | déplacée dans la même semaine, coach notifié ; hors semaine : refusé |
| TC-10 | Étape Running en zone FC sans FC max | champs bpm vides à remplir, pas de calcul |
| TC-11 | Exercice en % du max sans max connu | % seul + avertissement [P] |
| TC-12 | Simulation Hyrox « Officielles » pour Open Femme | charges officielles appliquées aux 8 stations ; modifier une ligne n'affecte pas les autres |
| TC-13 | Publier un programme modifié | vN+1, toast, le sportif voit la nouvelle version |
| TC-14 | Avertissement bloquant à la publication | « Publier » désactivé [D/P] |
| TC-15 | Recherche sans résultat | état vide + « Effacer la recherche et les filtres » |
| TC-16 | Agenda : déplier une séance puis une autre | une seule dépliée |
| TC-17 | Générer les PDF d'un programme de 12 semaines | PDF 1 = 13 pages, PDF 2 = 1 + nombre de fiches ; tous les liens OK (PDF_QA) |
| TC-18 | Aucun graphique de séance n'apparaît nulle part | ✓ |
