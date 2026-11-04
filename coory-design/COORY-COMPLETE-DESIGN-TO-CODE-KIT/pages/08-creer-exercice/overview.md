# 08 · Créer un exercice / Créer ma variante — vue d’ensemble

| Champ | Valeur |
|---|---|
| Identifiant | `08-creer-exercice` |
| Objectif | Ajouter un exercice à la bibliothèque du coach, ou créer **sa variante** d’un exercice existant (le formulaire est pré-rempli et l’original reste inchangé). |
| Utilisateur | Coach (rôle « Coach ») |
| Route | /coach/bibliotheque/nouveau et /coach/bibliotheque/nouveau?variante=:slug (routes existantes, vues dans les captures du propriétaire) |
| Entrée de menu active | Bibliothèque |
| Page parente | Bibliothèque (créer) · fiche de l’exercice d’origine (variante) |
| Pages enfants / liens | Exercice d’origine (« Voir l’original ») |
| Desktop | ✅ dessiné |
| Mobile | ✅ dessiné |
| Source | `../../source-design-files/pages/08-creer-exercice/` |

## Captures
- [desktop-original-creer.png](screenshots/desktop-original-creer.png)
- [desktop-original-variante.png](screenshots/desktop-original-variante.png)
- [mobile-original-creer.png](screenshots/mobile-original-creer.png)
- [mobile-original-variante.png](screenshots/mobile-original-variante.png)

## Fichiers de cette page
- `desktop-spec.md` · `mobile-spec.md` — architecture
- `layout-measurements.md` — **toutes les valeurs CSS exactes** (extraction automatique)
- `content.md` — tous les textes, placeholders, aria-labels, données de démo
- `interactive-elements.md` — inventaire automatique de chaque élément cliquable
- `interactions.md` · `features.md` · `responsive-rules.md` · `acceptance-criteria.md`
