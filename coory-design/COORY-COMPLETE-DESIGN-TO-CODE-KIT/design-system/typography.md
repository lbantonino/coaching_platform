# Typographie

**Police unique : Plus Jakarta Sans** (Google Fonts, graisses 400/500/600/700). Pas de seconde famille.
Notation `font: <graisse> <taille>[/<interligne>]` telle qu’écrite dans les sources.

| Rôle | Valeur exacte | Exemples |
|---|---|---|
| Titre d’accueil Assistant | `700 32px/1.2`, `letter-spacing:-.03em` | « Bonjour Gianluca. Comment puis-je t’aider ? » (02) |
| Grand titre de liste | `700 26px/1.1`, `-.025em` (desktop) · `700 28px/1.1` (mobile) | « Toutes » (01) |
| Titre de section mobile | `700 20px`, `-.02em` | « Mes listes » (01) |
| Titre de modale | `700 20px`, `-.01em` | « Paramètres », « Préférences » (13) |
| Titre de card / section | `600 16px` (86 occ.) | « Informations », « Sportifs inscrits » |
| Titre de page (header) | `600 15px` | « Modifier la séance » |
| Titre mobile | `500 16px`, `-.01em` / `600 16px` | en-têtes mobiles |
| Nom / libellé fort | `600 14px` (76) – `600 14.5px` | noms de sportifs, CTA |
| Label de champ | `600 13px`–`13.5px` (desktop), `600 14px` (mobile) | « Titre », « Prix » |
| Corps | `400 14px` / `400 13.5px/1.5` | paragraphes, valeurs de champs |
| Corps mobile (champs) | `400 16px` | **16 px minimum dans les champs mobiles** (évite le zoom iOS) |
| Secondaire | `400 12.5px`–`13px`, `#64626e` | sous-titres, aides |
| Aide / meta | `400 12px`, `#8b8996` | « Une consigne par ligne… » |
| Bouton | `600 14px`–`14.5px` (principal), `500 13px`–`13.5px` (secondaire), `600 16px` (mobile) |
| Pilule / chip | `500 13px` (desktop), `500 14px` (mobile) |
| Libellé de section en capitales | `600 11.5px`, `letter-spacing:.06em`, `#8b8996` | « APERÇU », « SÉANCE COLLECTIVE », « AUJOURD’HUI » |
| Badge | `500 11px/20px` (menu), `600 9.5px/16px` (cloche) |

## Règles
- `text-wrap: pretty` sur les paragraphes ; `balance` sur les titres d’accueil.
- Troncature : une ligne + ellipsis (`overflow:hidden; text-overflow:ellipsis; white-space:nowrap`) pour aperçus de messages, noms de documents, titres d’historique (« Programme de Chloé après bl… »).
- Montants : séparateur de milliers = espace fine insécable `\u202f`, décimales à virgule, « € » précédé d’une espace insécable `\u00a0` (ex. `2 691,98 €`). Signe moins typographique `−`.
- Dates en français abrégé (« jeu. 10 sept. 2026 », « Lun 26 · 07:00 »).
