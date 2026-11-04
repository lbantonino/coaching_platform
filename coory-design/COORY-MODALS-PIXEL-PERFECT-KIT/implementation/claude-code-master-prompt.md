# Prompt maître — Claude Code

```
Tu vas restyler les 36 boîtes de dialogue de COORY à partir du dossier COORY-MODALS-PIXEL-PERFECT-KIT, au pixel près, desktop ET mobile, sans casser l’existant.

1. Lis README.md, puis MASTER-INDEX.md, puis design-system/ et shared-components/.
2. Lis IMPLEMENTATION-ORDER.md et FUNCTIONAL-GAP-ANALYSIS.md.
3. Ouvre source-design-files/shared/Coory Boites.dc.html (valeurs exactes en styles inline, écrans repérés par data-shot).
4. Analyse le code de COORY : trouve le composant modal / bottom sheet / menu existant et chaque boîte des 36. Liste-moi les fichiers concernés et attends ma validation.
5. Phase A : tokens + ModalShell + Field. Montre-moi le résultat.
6. Ensuite, boîte par boîte, dans l’ordre d’IMPLEMENTATION-ORDER.md :
   a. lis modals/NN-*/ (overview, desktop-spec, mobile-spec, interactions, responsive-rules, design-decisions, acceptance-criteria) ;
   b. regarde screenshots/desktop-original.png et mobile-original.png ;
   c. lis source-design-files/interface-NN/spec.json ;
   d. implémente sans supprimer aucune fonctionnalité ;
   e. teste ouverture, fermeture (✕, overlay, Échap, Annuler), validation, erreurs ;
   f. fais une capture desktop (1440) et mobile (390), compare à la référence, corrige les écarts ;
   g. coche acceptance-criteria.md ; passe à la suivante.
7. Ne modifie jamais plusieurs boîtes à la fois. Les points marqués ⚠️ sont à vérifier dans le code, pas à inventer.
8. Le décor gris derrière chaque boîte dans les maquettes n’est pas à coder.
9. À la fin : mets à jour QA-REPORT.md avec l’état réel de chaque boîte.
```
