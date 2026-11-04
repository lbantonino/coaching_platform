# Prompt maître — à coller dans Claude Code

```
Voici le kit complet de design de COORY pour la planche « Coory Pages » :
coory-design/COORY-COMPLETE-DESIGN-TO-CODE-KIT/
(et les kits voisins COORY-SPORTIF-PIXEL-PERFECT/ et COORY-MODALS-PIXEL-PERFECT-KIT/).

Procédure obligatoire :
1. Lis README.md.
2. Lis MASTER-INDEX.md.
3. Lis tout design-system/.
4. Lis global-shell/ (composants protégés, layouts, navigation contextuelle, exceptions).
5. Lis IMPLEMENTATION-ORDER.md.
6. Examine le projet COORY existant (routes, composants, API, tokens, tests).
7. Identifie ce qui existe déjà et complète la colonne « Existant » de FUNCTIONAL-GAP-ANALYSIS.md. Montre-moi ce rapport avant de coder.
8. Choisis la prochaine page selon IMPLEMENTATION-ORDER.md.
9. Lis tout son dossier pages/NN-*/ (overview, desktop-spec, mobile-spec, layout-measurements, content, interactive-elements, interactions, features, responsive-rules, acceptance-criteria).
10. Regarde ses captures (screenshots/).
11. Ouvre son fichier source (source-design-files/pages/NN-*/) : il fait foi en cas de doute.
12. Liste les écarts entre l’app et la maquette.
13. Planifie les modifications MINIMALES ; liste les fichiers que tu vas modifier et attends ma validation.
14. Implémente le design.
15. Ajoute uniquement les fonctionnalités NEW-VALIDATED de la page ; pour TO-VERIFY / PROPOSED / À COMPLÉTER, demande-moi.
16. Teste toutes les interactions de interactive-elements.md.
17. Capture le résultat (1280 px et 390 px).
18. Compare aux captures de référence (superposition).
19. Corrige les écarts.
20. Vérifie l’absence de régression (quality-assurance/regression-checklist.md).
21. Coche acceptance-criteria.md, puis passe à la page suivante.

Règles :
- Tout retour vers l’écran précédent garde la règle déjà codée : flèche + nom de l’écran précédent (« ← Agenda », « ← Listes »…), jamais une flèche seule. Sur mobile, ce retour se place dans l’en-tête entre ☰ et ✦ 🔔.
- Supprime l’entrée « Facturation » du menu (la page n’existe plus).
- Paramètres = fenêtre par-dessus la page (pas de route). Ne touche pas à la rubrique Profil.
- Ne redessine pas le shell global (sidebar, header, bouton Assistant IA, cloche, badges) : réutilise-le.
- Ne touche pas à la logique métier existante (API, validations, enregistrements) ; tu changes la présentation et ajoutes les fonctionnalités validées.
- Ne supprime aucune fonctionnalité existante, même absente des maquettes.
- Les données des maquettes sont des données de démo.
- Travaille page par page, jamais toute l’application d’un coup.
- Les notes jaunes, la barre d’état « 9:41 » et le cadre des artboards ne sont pas à implémenter.
```
