# Guide d'implémentation

Le guide complet adressé à Claude Code est `16_CLAUDE_CODE/CLAUDE_CODE_MASTER_PROMPT.md` (règles, ordre de lecture, méthode en 6 phases) et `15_IMPLEMENTATION/IMPLEMENTATION_PLAN.md`.

Rappels clés :
1. Audit du dépôt avant toute modification.
2. Réutiliser composants et dépendances existants.
3. Ne pas remplacer l'authentification ni la logique métier hors périmètre.
4. Ne pas improviser de valeur visuelle : tokens + code source font foi.
5. Vérifier chaque écran dans un navigateur (diff Playwright).
