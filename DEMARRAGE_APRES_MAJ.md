# Démarrage avec Claude Code — pack V1.1

## Si Claude Code est déjà lancé mais aucun code n'a été créé

1. Arrêter toute génération de fichiers en cours ; **tu n'as pas besoin de fermer Claude Code**.
2. Décompresser **ce ZIP V1.1**, pas le V1.0. Ouvrir le dossier `Coaching_Platform/` dans VS Code.
3. Vérifier que `CLAUDE.md`, `00_INDEX.md`, `SUIVI_IMPLEMENTATION.md` et `docs/` sont à la racine affichée dans l'éditeur.
4. Dans Claude Code, démarrer la session **depuis cette racine** ou changer de dossier si nécessaire.
5. Copier le texte sous la ligne `---` de `PROMPT_DEMARRAGE_CLAUDE_CODE.md` (instructions initiales) dans Claude Code.
6. Autoriser d'abord **l'analyse P0 seulement** ; valider chaque opération de création/installation demandée.

## Si Claude Code a déjà créé des fichiers avec la V1.0

1. Sauvegarder le projet actuel et son dossier `.git` (commit si Git initialisé), sans écraser les sources applicatives.
2. Décompresser le V1.1 dans un dossier temporaire **séparé**.
3. Copier **les Markdown de documentation** du V1.1 dans le dépôt : `CLAUDE.md`, `00_INDEX.md`, `docs/*.md`, `PROMPT_DEMARRAGE_CLAUDE_CODE.md` et les guides. Ne pas remplacer un `SUIVI_IMPLEMENTATION.md` déjà modifié : **fusionner** son historique réel avec les nouvelles règles.
4. Dans Claude Code, demander : **« Lis la documentation V1.1, compare-la au code existant et propose un plan de migration minimal sans modifier les fichiers. Ne fais rien avant mon accord. »**
5. Conserver tous les travaux applicatifs corrects. Aucune commande `rm -rf`, réinitialisation Git ou écrasement automatique.

## Première consigne à Claude Code (si doute)

> Lis `CLAUDE.md`, `00_INDEX.md`, `docs/11_BASE_DONNEES_ET_API.md`, `docs/12_ARCHITECTURE_SECURITE.md`, `docs/14_TESTS_ET_ROADMAP.md` et `SUIVI_IMPLEMENTATION.md`. Vérifie ma stack et le contenu actuel du dépôt, sans rien modifier. Résume les différences éventuelles avec la V1.1 et propose les trois premières petites tâches P0. Attends mon accord avant d'installer ou coder.

## Ordre après P0

P1 authentification + organisations + RLS ; P2 CRM ; P3 bibliothèque ; P4 éditeur multi-sports ; P5 publication/PDF ; P6 sportif/mobile/feedback ; P7 messages ; P8 facturation SaaS ; P9 extensions.

**Rappel :** aucune vraie clé Supabase/Stripe n'est fournie par cette archive. Ne jamais mettre de secrets dans Git.
