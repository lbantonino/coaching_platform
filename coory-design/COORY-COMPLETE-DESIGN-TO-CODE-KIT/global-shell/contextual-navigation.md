# Navigation contextuelle (retours, fils d’Ariane)

## Desktop
Le retour contextuel est **dans le header (SH-02)**, au-dessus du titre :
```
← Parent · Contexte          (font 500 12px #64626e)
Titre de la page             (font 600 15px #17151d)
```
| Page | Fil d’Ariane | Titre | Menu actif |
|---|---|---|---|
| 06 / 12 Modifier la séance | « ← Agenda · Coaching force » (ou titre de séance) | Modifier la séance | Agenda |
| 08 Créer un exercice | « ← Bibliothèque » | Créer un exercice | Bibliothèque |
| 08 Créer ma variante | « ← Bibliothèque · Sled push » | Créer ma variante | Bibliothèque |
| 09 Inviter | « ← Sportifs · Sophie Lambert » | Inviter Sophie Lambert | Sportifs |
| 10 Nouveau sportif | « ← Sportifs » | Nouveau sportif | Sportifs |
| 11 Modifier l’exercice | « ← Bibliothèque · Fentes bulgares avec élastique » | Modifier l’exercice | Bibliothèque |
| 13 Paramètres | (fenêtre modale — pas de fil d’Ariane) | Paramètres | inchangé |

**Conservation du contexte** : le parent dépend du **parcours d’origine** (ex. Modifier la séance ouvert depuis la fiche sportif → « ← Lucas Janssens »). Utiliser l’historique de navigation / un paramètre `from` existant (TO-VERIFY dans le router). Ouverture directe d’URL : parent par défaut = la section du menu actif.

## Mobile — règle du brief
Sur les pages secondaires, le retour contextuel est **intégré dans SH-05**, **entre le hamburger et les actions Assistant IA / Notifications** :
```
[☰]  [← Sportifs]  ……………  [✦][🔔]
```
- Libellé = parent du parcours (« ← Tableau de bord », « ← Agenda », « ← Sportifs »…), `min-height:44px`, `font:500 16px; color:#6a3ee0` (référence : 01 Tâches mobile « liste ouverte », lien `#1b`).
- Le **titre de la page** apparaît alors une seule fois, en tête du contenu (pas de doublon dans l’en-tête).

## ✅ Décision du propriétaire (4 nov. 2026)
La règle du brief s’applique à **toutes** les pages secondaires mobiles (06, 08, 09, 10, 11, 12) : `[☰] [← Parent] …… [✦][🔔]`. L’en-tête autonome « [←] Titre » dessiné dans ces maquettes **ne doit pas être reproduit** ; le titre de la page s’affiche une seule fois en tête du contenu. Les actions de page placées dans cet en-tête sur les maquettes (corbeille rouge de 06, 11, 12) passent dans le contenu, à côté du titre.

## 🔒 Règle permanente : retour = flèche + nom de l’écran précédent
Déjà codée dans COORY — **à conserver partout, desktop et mobile, sans exception** :
- Tout retour vers l’écran ou le panneau précédent s’affiche **« ← Nom de l’écran précédent »** (jamais une flèche seule, jamais « Retour »).
- Le nom = celui de l’écran d’où l’on vient réellement (parcours d’origine), pas un parent fixe.
- Vaut aussi **à l’intérieur d’une page ou d’un panneau** : ex. Tâches mobile « ‹ Listes », panneau Historique de l’Assistant → « ← Conversation », sous-écrans des feuilles et des fenêtres.
- Exceptions : les fenêtres et feuilles (Paramètres, Assistant, modales) se ferment avec **×**, ce n’est pas un retour.
- Ne pas modifier le composant existant ; l’appliquer aux nouvelles pages et panneaux.
