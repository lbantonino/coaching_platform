# Dépendances et migrations

## Dépendances
- Aucune nouvelle dépendance UI requise (CSS + composants du projet).
- PDF : Playwright/Chromium (`page.pdf`) **ou** l'outil PDF déjà présent dans le projet ; pdf-lib pour les signets si nécessaire. Vérifier l'existant avant d'ajouter.
- Glisser-déposer (réordonner les séances, glisser dans le bandeau) : réutiliser la lib DnD déjà utilisée par COORY si elle existe ; sinon flèches ↑ ↓ suffisent en phase 1.

## Migrations (à confirmer après l'audit)
- Ajouts probables (additifs, réversibles) : `programs.is_template`, `programs.template_source`, `programs.source_template_id`, `programs.aim_defaults`, table `phases`, `weeks.scheduling`, `sessions.fixed_day / fixed_time / athlete_can_move`, champs de cible (aim, hr zone, pct) sur les étapes / séries, `program_exports`.
- Ne rien supprimer ; données existantes = « dans l'ordre », « kg », « allure ».
- Seed de démo pour la QA visuelle : Inès Ben Ali, Prépa HYROX Gand (26 oct. 2026 → 17 janv. 2027, 12 semaines, 4–5 séances), Lucas Janssens (Force bloc 1), modèles Coory listés en 01.
