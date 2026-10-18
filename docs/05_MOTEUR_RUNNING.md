# 05 — Moteur Running (course à pied)

## 1. Couverture
Types de séances : endurance fondamentale, récupération, sortie longue, sortie longue progressive, endurance rapide, tempo, seuil, répétitions/fractionné court et long, côtes, fartlek, blocs à allure spécifique 5 km/10 km/semi/marathon, race pace, échauffement/retour au calme, test performance facultatif, séance libre ; tous sont des **modèles** et pas des prescriptions auto-générées.

Les PDF de référence montrent des colonnes Endurance Rapide, Hyrox Pace, Easy Run, Sortie Longue, avec des zones et temps d'effort/récupération. La Zone 2 `6:40–7:15 min/km` est la valeur visible **pour le sportif du PDF seulement**, pas un défaut système.

## 2. Schéma d'un segment de course (`running_step`)
- `step_type`: warmup | steady | interval_effort | recovery | cooldown | drill | hill | walk | transition.
- `target_mode`: duration_sec | distance_m | open_ended ; au moins un si non libre.
- `duration_sec` ou `distance_m`, pas de valeur négative.
- `intensity_target` : pace range en `sec/km`, heart_rate bpm min/max, HR zone identifiée, RPE, speed km/h (convertie), ou free_text ; un ou plusieurs cibles possibles sans exiger FC.
- `terrain`: road | track | treadmill | trail | incline ; `incline_pct` si tapis, facultatif.
- `cadence_spm` optionnel ; `notes_visible`, `notes_coach`.
- `estimated_duration_sec` calculée si durée explicite ou distance+allure ; marquer « estimation ».
- `actual`: durée, distance, allure réellement relevée manuellement (V2), RPE segment optionnel.

## 3. Éditeur par blocs
**Simple** : 45 min zone 2, une étape ; **Intervalles** : `repeat_count` N, étapes effort puis récupération ; **Ladder** : étapes de durées différentes, éventuellement répétées ; **Mixte** : effort Running alterné exercices Hyrox dans un bloc unifié ; **Course + renfo** : bloc Hybride.

Chaque séance peut contenir plusieurs blocs séquentiels et leurs notes : `warm-up -> interval x N -> steady -> cooldown`. Un bloc peut contenir plusieurs allures. Ajouter/supprimer/réordonner les étapes en UI, dupliquer bloc, transformer récup marche en footing, enregistrer modèle.

### Exemple structuré inspiré de Running janvier 2027
- Segment 1 : 26 min @ 6:15 min/km.
- Bloc répété 5 fois : effort 2 min @ 5:00 min/km ; récupération 2 min.
- Segment 3 : 26 min @ 6:15 min/km.
Ce scénario apparaît dans le document du 04/01/2027. Les semaines suivantes changent certains paramètres et d'autres segments ; ne pas inférer une règle automatique unique ni supprimer leurs différences.

## 4. Repères et personnalisation athlète
La fiche client enregistre allures/FC par type, unité et date d'évaluation. Le coach choisit une cible « allure fixe », « zone athlète » ou « relatif à repère avec delta ». Lorsque des repères évoluent, les séances **non publiées** peuvent proposer un recalcul (jamais silencieux) ; les versions publiées restent inchangées.

Afficher `05:00 min/km`, `300 s/km` en base et km/h dérivé si utile. Formule sûre : `vitesse_km_h = 3600 / pace_sec_per_km`. La conversion distance+allure fournit une durée estimée, pas une donnée mesurée. Distinguer rythme de course de rythme machine SkiErg/RowErg `sec/500m`.

## 5. Bibliothèque Running
Attributs modèle : intitulé, objectif, niveau **indicatif**, équipement/tapis/piste, durée estimée, tags, structure bloc, consignes. Prévoir modèles de séances fréquemment observées (long run, easy, tempo, fractionné, Race Pace Running), mais n'ajouter une référence d'entraînement chiffrée personnalisée au catalogue public qu'après validation coach.

## 6. UX Running
- Desktop : timeline colorée avec segments, répétitions et récupération, badge intensité et volume total estimé.
- Coach mobile : cartes accordéon « Échauffement », « 5 × (2 min effort + 2 min récup) », « Retour au calme », champs directs (durée, allure, récup, rép).
- Sportif mobile : progression « Bloc 2/3 » et répétition « 3/5 », cible grande et lisible ; minuteur facultatif (ne pas promettre vibration/live watch sans implémentation).
- Explication claire des conversions, avertissement si absence d'allure cible et validation sans faux seuil.

## 7. Bords et validation
Allure `min:sec` parseur robuste : `4:5` -> demander confirmation ou normaliser `04:05` avec UX explicite ; pace > 0 et max configurable. Les zones FC peuvent ne pas être connues. `recovery` peut avoir durée seule, distance seule, ou marche. Les objectifs peuvent être des intervalles `6:40–7:15` ; pas obligatoirement allure exacte. Temps total estimé doit distinguer une séance « open-ended » sans durée calculable. Les tâches mélangeant Run et stations Hyrox sont modélisées par moteur Hybride, pas écrasées en texte libre.

## 8. Tests
- [RUN-01] Parsing et round-trip `4:55 min/km` <-> 295 `sec/km`.
- [RUN-02] Bloc 5 × (2 min effort + 2 min récupération) produit 20 min de durée cible si repos après chaque répétition ; documenter l'option sans repos final pour les autres cas.
- [RUN-03] Une sortie longue de 40 min zone 2 peut être utilisée dans 2 semaines/client indépendants.
- [RUN-04] Une référence FC/allure inconnue n'empêche pas la création en brouillon.
- [RUN-05] Intervalles + exercices (p. ex. BBJ) dans Hybride rendent un affichage correct.
- [RUN-06] Export PDF récapitule chaque bloc, durée, allure et note coach visible sans troncature.
