# Boutons

| ID | Variante | Desktop | Mobile | États |
|---|---|---|---|---|
| BTN-P | Principal (encre) | `height:42–46px; border-radius:11–12px; background:#17151d; color:#fff; font:600 14–14.5px` ; compact header `height:32–40px` | `height:54px; border-radius:15px; font:600 16px` + ombre `0 12px 28px -10px rgba(22,18,40,.45)` | hover : `#2a2733` (TO-VERIFY existant) · disabled : opacité .4, `cursor:not-allowed` (ex. « Enregistrer le sportif » sans prénom) · loading : spinner 16 px blanc, libellé conservé |
| BTN-S | Secondaire (contour) | `height:40–44px; border-radius:11–12px; background:#fff; box-shadow:inset 0 0 0 1px rgba(22,18,40,.14); font:500 13.5–14px` | `height:48–54px; border-radius:13–15px` | hover : fond `#f8f7fb` |
| BTN-T | Tertiaire / gris | `height:36px; padding:0 12px; border-radius:10px; background:#f3f2f7; font:500 12.5px` (actions groupées 03) | — | |
| BTN-D | Danger | texte `#c0213d`/`#be123c`, fond transparent ou `#fdeef1` ; plein `#be123c` dans la barre mobile 03 | idem | toujours suivi d’une **confirmation** ou d’un toast « Annuler » |
| BTN-V | Violet (Assistant, CTA IA) | `height:32px; background:#8b5cf6; border-radius:9px` ; « Valider N actions » (02) | 40×40 icône | |
| BTN-L | Lien | `font:500 12.5–13px; color:#6a3ee0` (« Voir la fiche », « Voir l’original », « Comptabilité ») | idem | hover `#8b5cf6` |
| BTN-I | Icône | `32–40px` carré, `border-radius:9–13px` ; fond `#f3f2f7` (fermer), blanc (mobile) | **44×44 minimum** | aria-label obligatoire |
| BTN-FAB | Bouton flottant | — | voir `global-shell/mobile-layout.md` | rotation 45° ouvert |
| SEG | Sélecteur segmenté | piste `height:40–44px; padding:3–4px; border-radius:11px; background:#f1f0f5` ou `#f3f2f7` ; segment actif `#fff` + ombre `0 1px 3px rgba(22,18,40,.12)`, texte `#17151d` ; inactif transparent `#64626e` | `height:44–48px`, segments égaux (`grid 1fr 1fr`) | rôle `tablist`/`tab` ou `radiogroup` |
| CHIP | Pilule | `height:34px; padding:0 14px; border-radius:17px; font:500 13px` ; off : `#fff` + `inset 0 0 0 1px rgba(22,18,40,.14)` ; on : `#ede6ff`, texte `#5b30d6`, préfixe « ✓ » | `height:40px; border-radius:20px; font:500 14px` | `aria-pressed` |
