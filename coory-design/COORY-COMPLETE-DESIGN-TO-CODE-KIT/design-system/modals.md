# Modales, feuilles, menus

| ID | Type | Valeurs | Comportement |
|---|---|---|---|
| M-DIALOG | Modale desktop (13, 07 Nouveau groupe) | `width:1000px; height:690px` (13) ; `border-radius:24px; background:#fff; box-shadow:0 30px 80px -20px rgba(22,18,40,.5)` ; overlay `rgba(23,21,29,.42)` centré | focus piégé, Échap ferme, clic overlay ferme (sauf modifications non enregistrées → confirmation), scroll interne seulement, `role="dialog"` + `aria-label` |
| M-ASSIST | Boîte Assistant (02) | desktop : `left/right:170px; top:92px; max-height:660px; border-radius:26px`, overlay `rgba(14,12,22,.48)` + flou ; mobile : `left/right:10px; top:64px; max-height:740px; border-radius:30px` + flèche vers le bouton ✦ | voir `features/assistant-ai.md` |
| M-SHEET | Feuille mobile (07) | `border-radius:26px 26px 0 0; height:780px` max, poignée, overlay `rgba(23,21,29,.42)` | glisser vers le bas ferme ; safe area bas |
| M-MENU | Menu déroulant | `border-radius:14–16px; padding:6px; background:#fff; box-shadow:0 18px 40px -12px rgba(22,18,40,.35), 0 0 0 1px rgba(22,18,40,.06)` ; items `height:36px` desktop / `46–48px` mobile, `border-radius:9–11px` ; séparateur `1px rgba(22,18,40,.08)` ; item danger rouge en dernier | clic extérieur et Échap ferment ; flèches ↑↓ naviguent ; Entrée valide ; position : sous le déclencheur, alignée à droite (menus « … ») ou pleine largeur (13 mobile) |
| M-TOAST | Toast « Annuler » (03) | mobile `left/right:12px; bottom:28px; height:54px; border-radius:16px; background:#17151d; color:#fff` | 5 s, bouton « Annuler » restaure l’état |
| M-ACTIONBAR | Barre d’actions groupées mobile (03) | fond `#17151d`, boutons 52 px `rgba(255,255,255,.08)`, Supprimer `#be123c` | apparaît en mode sélection |

Les **36 boîtes de dialogue** existantes (confirmations, feuilles, menus d’actions) sont spécifiées dans le kit **COORY-MODALS-PIXEL-PERFECT-KIT** : les réutiliser, notamment pour « Supprimer la séance », « Supprimer l’exercice », « Révoquer ce lien », « Déconnecter partout ».
