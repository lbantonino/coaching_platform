# COORY — Prompt de développement complet (desktop + mobile)

> **À donner tel quel à Claude Code**, à la racine du projet Coory.
> Fichiers à placer à côté : `COORY_DESIGN_SYSTEM.md`, `COORY_LOGO.md`, `COORY_AUTH_PAGES.md`, `BRIEF_CLAUDE_DESIGN.md`.
> **Référence visuelle qui fait foi :** les prototypes `Coory Prototype Mobile.dc.html` (390 px), `Coory Prototype Desktop.dc.html` (1440 px), `Coory Planche.dc.html` (toutes les pages) et `Coory Composants.dc.html`. Ouvre-les dans un navigateur, reproduis-les **au pixel près**, en desktop **et** en mobile.

---

## 0. Ta mission

Tu es un·e ingénieur·e front-end senior. Tu dois coder **l'application web complète Coory** (SaaS de coaching sportif : espace **coach**, espace **sportif**, **administration**, pages d'**entrée**), en **français**, **mobile first**, avec un rendu **identique aux prototypes** sur téléphone (390 px) et ordinateur (1440 px).

Règles non négociables :
1. **Ne casse rien** : garde la logique existante (auth, base de données, API, validations serveur). Tu changes la **présentation** et tu ajoutes les pages manquantes.
2. **Garde les couleurs existantes du projet** si elles sont déjà définies. Sinon, utilise **exactement** les jetons du §2.
3. **Mobile first** : chaque composant est d'abord écrit pour 390 px, puis élargi avec des media queries `min-width`. Aucun défilement horizontal de la page (seuls les agendas et rangées de pastilles défilent à l'intérieur de leur zone).
4. **Un seul bouton rouge par écran** (l'action principale). Pas de dégradé, pas d'ombre sur les cartes, pas d'emoji. Glyphes autorisés : `→ ↗ ✓ ⌘K · ♀ ♂`.
5. **Contraste ≥ 4,5:1** sur tout texte, dans les deux thèmes. **Zones tactiles ≥ 44 × 44 px.** Inputs en **16 px** minimum (évite le zoom iOS).
6. Chaque page a **4 états** : rempli, vide, chargement (squelettes), erreur (bandeau + « Réessayer »). Les formulaires ont aussi un état **succès**.
7. Aucun module grisé, aucun badge « Bientôt » : tout est actif.

Travaille **par étapes**, en committant à chaque étape : (1) jetons + composants, (2) coquilles de navigation, (3) pages d'entrée, (4) espace coach, (5) espace sportif, (6) admin, (7) recette finale. À la fin de chaque étape, liste ce qui est fait et ce qui reste.

---

## 1. Stack et structure attendues

- Adapte-toi à la stack du projet. Si rien n'est imposé : **Next.js (App Router) + TypeScript + Tailwind CSS**, icônes **lucide-react**, polices via `next/font/google`.
- Thème : attribut `data-theme="dark" | "light"` sur `<html>`, **sombre par défaut**, choix mémorisé dans `localStorage`, bascule via un bouton soleil / lune.
- Arborescence suggérée :
```
src/
  styles/tokens.css            ← jetons §2 (CSS variables)
  components/ui/               ← primitives §4 (Button, Input, PasswordInput, Chip, Badge, Avatar, KpiCard, Card, Tabs, Segmented, Sheet, Dialog, ActionMenu, EmptyState, ErrorState, Skeleton, Toast, Toggle, Checkbox, Stepper)
  components/layout/           ← AppShell, Sidebar, MobileTopBar, HamburgerMenu, SportBottomBar, PageHeader, AuthShell, BrandPanel
  components/blocks/           ← ListBlock, TilesBlock, WeekTimeGrid, MonthGrid, BarsChart, SplitBar, LineChart, Timeline, KeyValue, SegmentsAccordion, Phases, ChatThread, PdfPreview, ActiveWorkout, SessionFeedback, InviteLink
  components/brand/CooryLogo.tsx
  app/(auth)/…  app/coach/…  app/app/…  app/admin/…
  lib/demo-data.ts             ← données d'exemple §8 (en attendant les vraies données)
```
- Breakpoints : `sm` 640, `md` 768, `lg` 1024 (bascule mobile → desktop des coquilles), `xl` 1280, `2xl` 1440 (largeur de référence desktop).

---

## 2. Jetons (copie exacte)

```css
:root, [data-theme="dark"] {
  --page:#070b12; --bg:#0b1019; --panel:#0f1520; --surface:#121821; --surface-2:#1a2331;
  --chip:#243044; --bar:#2b3648;
  --line:rgba(255,255,255,.08); --line-2:rgba(255,255,255,.15);
  --text:#f1f4f8; --muted:#9ba6b5; --faint:#97a2b2;
  --accent:#ff3347; --accent-hover:#ff5c6c; --accent-text:#ff6b79;
  --accent-soft:rgba(255,51,71,.13); --accent-line:rgba(255,51,71,.35); --on-accent:#ffffff;
  --ok:#3ddc84; --ok-soft:rgba(61,220,132,.10); --ok-line:rgba(61,220,132,.30);
  --warn:#f5b544; --warn-soft:rgba(245,181,68,.12);
  --run:#6e9bff; --mus:#a594ff; --hyr:#f0975a; --hyb:#2dd4bf;   /* disciplines */
  --fem:#ff7eb6; --hom:#6ec6ff;                                  /* ♀ / ♂ */
  --fd:'Space Grotesk',system-ui,sans-serif; --fs:'Geist',system-ui,sans-serif; --fm:'Geist Mono',ui-monospace,monospace;
  color-scheme:dark;
}
[data-theme="light"] {
  --page:#e9ecf1; --bg:#ffffff; --panel:#f2f4f8; --surface:#f5f7fa; --surface-2:#eaeef3;
  --chip:#e1e6ee; --bar:#dce2ea;
  --line:rgba(10,20,40,.10); --line-2:rgba(10,20,40,.20);
  --text:#0f1722; --muted:#5d5d64; --faint:#62626a;
  --accent:#d91f34; --accent-hover:#c01a2d; --accent-text:#bb1529;
  --accent-soft:rgba(217,31,52,.08); --accent-line:rgba(217,31,52,.30);
  --ok:#166534; --ok-soft:rgba(22,101,52,.08); --ok-line:rgba(22,101,52,.30);
  --warn:#8a4b06; --warn-soft:rgba(138,75,6,.10);
  --run:#2f5bd3; --mus:#6b4fd8; --hyr:#b4530f; --hyb:#0f766e; --fem:#be185d; --hom:#1d6fb8;
  color-scheme:light;
}
```
**Teintes dérivées** (cartes chiffrées, badges, blocs d'agenda) : `color-mix(in srgb, <couleur> X%, <fond>)`.
- Badge : fond `color-mix(c 15%, transparent)`, texte `c`.
- Carte chiffrée : fond `color-mix(c 10%, var(--surface))`, bordure `color-mix(c 30%, transparent)`, pastille d'icône `color-mix(c 16%, transparent)`.
- Bloc d'agenda : fond `color-mix(c 12%, var(--surface))` + bordure gauche 3 px `c`.

**Typographie** : Space Grotesk 500/600/700 = logo, H1–H3, grands chiffres (jamais sous 18 px). Geist 400/500/600 = tout le texte UI. Geist Mono 400/500 = heures, dates courtes, montants, allures, compteurs, micro-libellés en MAJUSCULES (letter-spacing .06–.08em).
Échelle : H1 page **28 px mobile / 34 px desktop** (600, −0.035em) · H1 entrée 32/40 · titre de bloc 18 (600, −0.02em) · corps 15 · secondaire 13–14 · micro 11–12.
**Formats français** : `6 240 €`, `102,5 kg`, `4×8`, `09:30`, `4:50 /km`, `+12 %`, `−1,8 kg`, séparateur ` · `, guillemets « ».

**Rayons** : 5 (kbd) · 8–12 (contrôles, 12 par défaut) · 14 (boutons larges) · 16–20 (cartes) · 20–22 (pastilles, feuilles du bas) · 50 % (avatars).
**Espacements** : 4 · 6 · 8 · 10 · 12 · 14 · 16 · 18 · 22 · 28 · 32. Toujours `display:flex|grid` + `gap`.
**Mouvement** : 150 ms couleurs, 200–250 ms largeurs/positions, `cubic-bezier(.2,.7,.2,1)`. Pression = `scale(.98)`. Squelettes : pulsation opacité 1 → .45 en 1,4 s.

---

## 3. Logo

Voir `COORY_LOGO.md`. Résumé pour le composant `<CooryLogo size={n} />` :
- Wordmark `C` + boucle ∞ + `ry` en **Space Grotesk 700**, letter-spacing −0.03em.
- Boucle (SVG, `viewBox="-4 -4 1140 532"`, `stroke-width="124"`, `stroke-linejoin="round"`, `stroke="var(--accent)"`) :
  `M390.6 108.8C440.4 150.6 510 166 566 166C622 166 691.6 150.6 741.4 108.8A200 200 0 1 1 741.4 415.2C691.6 373.4 622 358 566 358C510 358 440.4 373.4 390.6 415.2A200 200 0 1 1 390.6 108.8Z`
- SVG inline : `height:.532em; width:1.140em; vertical-align:-.018em; margin:0 -.018em 0 .042em`.
- Tailles : 26 px panneau de marque / sidebar, 24 px en-tête entrée mobile, 19–20 px barre du haut mobile.
- Filigrane (panneau de marque, entrée) : même boucle en `stroke: var(--text)`, opacité 6 %, largeur 1100 px, `right:-420px; bottom:-140px`, `aria-hidden`.

---

## 4. Composants (spécifications exactes)

| Composant | Spécification |
|---|---|
| **Button primary** | fond `--accent`, texte `--on-accent`, 600 15 px, hauteur 44 (52–56 pleine largeur mobile), rayon 12–14, hover `--accent-hover`. **Un seul par écran.** État chargement : spinner 18 px (bordure 2 px blanche 35 %, haut blanc, rotation .8 s) + libellé « …ion… ». |
| **Button outline** | transparent, bordure 1 px `--line-2`, texte `--text`, hover fond `--surface`. |
| **Button ghost / lien** | texte `--text` 500 + soulignement 1 px `--accent` (liens d'action) ou `--line-2` (liens secondaires). |
| **IconButton** | 44×44, rayon 12, fond `--surface`, bordure `--line`, icône 18. Point de notification : 7 px `--accent`, bordure 2 px fond, en haut à droite. |
| **Input** | 50–52 px, rayon 12, fond `--surface`, bordure `--line-2`, focus bordure `--accent`, texte 16 px. Libellé 14/500 au-dessus (gap 8). Mention ` <em>(facultatif)</em>` en `--muted` italique. Erreur **sous le champ** : icône `circle-alert` 15 + texte 13 `--accent-text`, bordure du champ `--accent`, `role="alert"`. |
| **PasswordInput** | Input + bouton œil 44×44 à droite (icônes `eye` / `eye-off`, `aria-label` « Afficher / Masquer le mot de passe »). |
| **Jauge de robustesse** | 4 segments 4 px, gap 4, rayon 4. Score : +1 si ≥ 10 caractères, +1 maj+min, +1 chiffre, +1 symbole ; plafonné à 1 si < 6 caractères. Couleur : 0–1 `--accent`, 2 `--warn`, 3–4 `--ok`. Libellé « Robustesse : Trop faible / Faible / Moyenne / Bonne / Excellente » + « 10 caractères min. » à droite. |
| **Checkbox** | 24 px (26 dans les listes, 30 en mode actif), rayon 7–9, bordure 1,5 px `--line-2`, cochée : fond + bordure `--accent`, ✓ blanc. Toute la ligne est cliquable, `role="checkbox"`. |
| **Toggle** | 46×28, fond `--bar` → `--accent`, pastille blanche 22 px, transition 200 ms. |
| **Chip / filtre** | hauteur 40, padding 0 14, rayon 20, 14/500, bordure `--line-2`. Actif : fond `--text`, texte `--bg`. Multi-sélection : préfixe « ✓ ». Mobile : rangée **défilante** sans retour à la ligne ; desktop : retour à la ligne. |
| **Badge** | 12/500, padding 4×10, rayon 20, fond teinté 15 % + texte couleur (cf. §2). Discipline : point 7 px + libellé. Statuts : Actif/Publié/Payée/Terminée/Faite = ok · En pause/En attente/À livrer/Partielle = warn · En retard/Manquée/Sautée/Haute = accent-text · Brouillon/Archivé/Normale = muted · En cours/Prévue/À venir = run · Reportée/À envoyer = mus. |
| **Avatar** | rond, fond `--chip`, initiales 600 (33 % de la taille). Pastille ♀/♂ 18 px en bas à droite (fond `color-mix(--fem|--hom 22%, --bg)`, texte couleur, bordure 2 px `--bg`). Tailles 36–40 listes, 46–52 cartes, 64 fiche. |
| **KpiCard** | padding 16, rayon 18, teinte §2. Grand chiffre Space Grotesk 600 (30 px desktop, 24 px mobile ; 18–20 px si texte long), pastille d'icône 32 px en haut à droite, libellé 14/500, précision 12 `--muted`. Cliquable vers le module. Grille : **4 colonnes desktop, 2×2 mobile** (5 colonnes sur la fiche sportif, 2 colonnes sur l'Aujourd'hui sportif). |
| **Card / Block** | fond `--surface`, bordure 1 px `--line`, rayon 20, padding 18, gap 14. En-tête : titre 18/600 Space Grotesk + sous-titre 13 `--muted`, lien d'action à droite 13 `--muted` souligné. |
| **Tabs** | Desktop : soulignés (gap 24, actif bordure basse 2 px `--accent`, ligne de base 1 px `--line`). Mobile : **pastilles défilantes** (actif fond `--text`). Variante **Stepper** : numéro rond 22 px (actif / fait : fond `--accent`, fait = « ✓ »). |
| **Sheet (formulaire)** | Mobile : **feuille du bas** (rayon 22 22 0 0, poignée 40×4, hauteur max 88 %, défile). Desktop : **fenêtre centrée** 560 px, rayon 20. Fond d'écran `rgba(3,6,12,.6)`. Boutons « Annuler » (outline) + action rouge. Validation des champs requis → « Ce champ est obligatoire. » sous le champ. |
| **ActionMenu « ••• »** | même conteneur que Sheet ; lignes 52 px icône 19 + libellé 16/500 ; action destructrice en `--accent-text`. |
| **Dialog de confirmation** | icône `triangle-alert` dans carré 48 px `--accent-soft`, titre 20/600, texte 15 `--muted`, boutons « Annuler » + rouge. **Toute action destructrice ou publication passe par là.** |
| **Toast** | bas centré, fond `--text`, texte `--bg`, 14/500, rayon 14, 2,8 s, `role="status"`. |
| **EmptyState** | icône 24 `--muted`, titre 16/600, texte 14 `--muted`, bouton outline facultatif. |
| **ErrorState** | bandeau `--accent-soft` + bordure `--accent-line`, icône `wifi-off`, « Impossible de charger cette page », « La connexion au serveur a échoué. Tes données sont en sécurité. », bouton « Réessayer ». |
| **Skeleton** | barres 12 px rayon 6, fond `--surface-2`, pulsation. |

---

## 5. Coquilles de navigation

### 5.1 Entrée (`AuthShell`)
- **Desktop (≥ 1024)** : panneau de marque à gauche (44 %, max 680 px, marge 16, rayon 24, fond `--panel`, bordure `--line`, padding 44×48, collant en haut), formulaire à droite centré verticalement, **max 440 px** (720 px pour les pages légales, sans panneau).
  Panneau : logo 26 · sur-titre mono 12 `--accent-text` (`PLATEFORME DE COACHING` / `ESPACE COACH` / `ESPACE SPORTIF` / `INVITATION`) · H2 Space Grotesk 64/600 lh .98 −0.045em : « Programmer, / publier et suivre / **tes sportifs.** » (dernière ligne en `--accent-text`) · texte 17 `--muted` : « Programmation et suivi d'entraînements Running, Musculation, Hyrox et Hybride. » · pied « © 2026 Coory · Bruxelles » · filigrane ∞.
- **Mobile** : une colonne, padding 10×20, en-tête logo 24 + bouton thème 44, contenu aligné en haut.
- Pied de page commun : Conditions · Confidentialité · Mentions légales (13 px `--muted`).

### 5.2 Coach et admin (`AppShell`)
- **Desktop** : **Sidebar** 252 px, bordure droite `--line`, collante, padding 22×14 :
  logo 26 → **Principal** : Tableau de bord · Sportifs · Programmes · Agenda · Séances · Facturation · Comptabilité · Bibliothèque → séparateur → **Plus** : Tâches (badge 2) · Documents · Messages (badge 3) · Paramètres → en bas : carte utilisateur (avatar 40, nom, « Coach · Behybrid », chevron → Paramètres) + « Se déconnecter » (outline) + bouton thème.
  Ligne de menu : 44 px, rayon 12, icône 19, 15/500 ; **active** : fond `--accent-soft` + bordure `--accent-line`. Compteurs : mono 11 sur fond `--accent`.
  Les sous-pages activent leur parent (fiche sportif → Sportifs ; éditeur, aperçu, PDF, assistant → Programmes ; détail de séance → Agenda ; retours → Séances ; détail facture → Facturation).
  **En-tête de page** (padding 28×32) : à gauche lien retour (si sous-page) + H1 34 + sous-titre 15 `--muted` ; à droite « Rechercher dans Coory… ⌘K » (260 px → page Recherche), bouton Assistant IA (`sparkles`, coach), cloche (→ Notifications), bouton secondaire outline éventuel, **bouton rouge**, menu « ••• » éventuel.
  Contenu : padding 16×32×56, **grille 12 colonnes**, gap 16.
- **Mobile** : **pas de barre du bas côté coach/admin.** Barre du haut collante (grille `1fr auto 1fr`) : logo 19 · **titre de la page centré** (Space Grotesk 16/600) · cloche + **hamburger**. Le hamburger ouvre un **panneau plein écran** : en-tête logo + « Menu » + fermer · carte utilisateur · `PRINCIPAL` (lignes 16 px) · `PLUS` · « Se déconnecter » + thème. Toucher une ligne ferme le menu et navigue.
  En-tête de page mobile : retour éventuel, H1 28, sous-titre, puis boutons **pleine largeur** sous le titre. Contenu : une colonne, padding 12×16×120.
- **Admin** : même coquille, menu : Vue d'ensemble · Organisations · Utilisateurs et rôles · Abonnements · Journal d'audit · Erreurs · Conformité.

### 5.3 Sportif
- **Desktop** : Sidebar : Aujourd'hui · Mon programme · Calendrier · Historique · Progression · Objectifs · Documents · Messages (badge 1) · Plus : Notifications · Paramètres.
- **Mobile** : barre du haut (logo · titre · cloche) + **barre du bas collante** 5 onglets : **Aujourd'hui · Programme · Progression · Messages · Profil** (icônes 22, libellé 11/500, actif `--accent-text`, hauteur 52). La séance du jour est atteignable en **2 actions** max.

---

## 6. Agenda horaire (`WeekTimeGrid`) — tableau de bord coach + Agenda

C'est un composant clé, à reproduire exactement :
- Plage **06:00 → 22:00** (16 h). Hauteur d'une heure : **48 px desktop, 44 px mobile**. Hauteur totale = 16 × h + 58 px d'en-tête : **toute la journée est visible sans défilement vertical interne** ; la page défile.
- Conteneur : rayon 14, bordure `--line`, fond `--bg`, `overflow:auto`.
- Colonne des heures **collante à gauche** (48 px, fond `--surface`, libellés mono 11 `--muted` centrés sur chaque trait ; 06:00 et 22:00 décalés de 8 px vers l'intérieur).
- En-têtes de jours **collants en haut** (56 px) : « Lun 4 h » + numéro Space Grotesk 18. Aujourd'hui : en-tête teinté accent 10 %, texte `--accent-text`, colonne teintée 4 %.
- Lignes horaires : `repeating-linear-gradient(to bottom, var(--line) 0 1px, transparent 1px <h>px)`.
- Séance : bloc absolu `top = (début − 06:00) × h`, `height = durée × h − 3 px`, marges 3 px, rayon 8, fond teinté + bordure gauche 3 px couleur discipline ; contenu : « 19:00 – 20:30 » mono 11 couleur · titre 12/600 · détail 11 `--muted` seulement si hauteur ≥ 56 px. Clic → détail de séance.
- Ligne « maintenant » : 2 px `--accent` + pastille 10 px sur la colonne du jour.
- **Desktop** : 7 colonnes égales sur toute la largeur. **Mobile** : colonnes de 104 px, **3 jours visibles**, défilement horizontal, positionné à l'ouverture sur **aujourd'hui − 1**. Légende sous la grille : « Glisse vers la droite pour changer de jour » (mobile) / « 7 jours · 16 heures visibles » (desktop) + « 06:00 – 22:00 ».
- Filtres au-dessus (page Agenda) : Toutes · Collectives · Individuelles · Compétitions (calque des compétitions issues des objectifs).
- Vues de la page Agenda : **Semaine** (cette grille) · **Jour** (liste horaire du jour) · **Mois** (grille 7 × 5, cases carrées, points de couleur par discipline, aujourd'hui plein `--accent`) · **Aujourd'hui**.

---

## 7. Pages (contenu, interactions, états)

Notation : **KPI** = 4 cartes chiffrées ; « liste » = tableau en desktop (en-têtes mono 12 en MAJUSCULES, grille `2.4fr 1.5fr 1.3fr .9fr 44px` : principal · badges · barre/infos · valeur · « ••• ») et **liste de cartes empilées en mobile** (et dans les blocs ≤ 6 colonnes). Sélection d'une ligne : fond `--accent-soft`, rayon 12.

### 7.1 Entrée (voir aussi `COORY_AUTH_PAGES.md`)
| Route | Contenu & comportement |
|---|---|
| `/login` | « Bon retour. » · « Pas encore de compte ? **Créer un compte** » · E-mail · Mot de passe (œil, lien « Mot de passe oublié ? ») · rouge « Se connecter → » · séparateur « ou » · Google / Facebook / Apple (préparés, masquables par feature flag ; mobile : pleine largeur « Continuer avec … », desktop : 3 colonnes). Erreurs : « Indique ton adresse e-mail. », « Cette adresse e-mail ne semble pas valide. », « Indique ton mot de passe. » ; erreur serveur en bandeau : « Adresse e-mail ou mot de passe incorrect… ». Succès → espace du rôle. |
| `/inscription` | « Créer un compte » · 2 **grandes cartes radio** Coach (« Je crée des programmes et je suis mes sportifs. », icône `users`) / Sportif (« Je suis les séances préparées par mon coach. », `dumbbell`) — sélection : bordure 1,5 px accent + fond accent-soft + radio rempli · Prénom + Nom (2 colonnes, même en mobile) · E-mail · Téléphone *(facultatif)* mono · **Nom de l'entreprise *(facultatif)* : coach seulement** · Mot de passe + œil + **jauge** · case « J'accepte les conditions d'utilisation et la politique de confidentialité » · rouge « Créer mon compte → » · « Déjà un compte ? Se connecter ». Erreurs sous chaque champ + bandeau « Corrige les champs signalés pour continuer. ». |
| `/verifier-email` | icône `mail-check` 56 · « Vérifie ta boîte mail » · « On vient de t'envoyer un lien de confirmation à **{email}** » · carte : lien valable 24 h / regarde les indésirables · rouge « J'ai confirmé mon e-mail → » · outline « Renvoyer l'e-mail » (→ « E-mail renvoyé ✓ ») · « Modifier l'adresse ». |
| `/bienvenue` | **Coach** : « Bienvenue, {prénom}. » · carte organisation (carré accent avec initiale, nom, « Ton organisation · 1 coach ») · « POUR BIEN DÉMARRER » : Ajoute ton premier sportif (2 min) · Planifie une séance (1 min) · Crée un programme (5 min) · rouge « Accéder à mon tableau de bord → ». **Sportif** : « Ton coach te rattachera à son espace par une invitation. » + 3 étapes numérotées · rouge « Compris » · « Tu as déjà un lien ? Ouvrir l'invitation ». Chargement : « Création de ton espace… ». |
| `/mot-de-passe-oublie` | retour · E-mail · rouge « Recevoir le lien » → carte succès verte « Si un compte existe pour {email}, un lien vient d'être envoyé. Il est valable 1 h. » |
| `/nouveau-mot-de-passe` | Nouveau mot de passe (œil + jauge) · Confirmation (« Les deux mots de passe ne correspondent pas. ») · rouge « Enregistrer le mot de passe » → succès + rouge « Se connecter → ». |
| `/invitation/[jeton]` | carte coach (avatar GL, « Invitation de ton coach », Gianluca Lo Bianco, Behybrid · Bruxelles, « Valable jusqu'au 30 octobre 2026 ») · « Rejoins l'espace de ton coach » · E-mail **verrouillé** (icône cadenas) · Mot de passe + jauge · case CGU · rouge « Rejoindre l'espace → » → espace sportif. |
| `/lien-invalide` | icône `link-2-off` · « Ce lien n'est plus valide » · explication 24 h / 7 jours · rouge « Demander un nouveau lien » · outline « Retour à la connexion ». |
| `/acces-refuse` | icône `shield-x` · `ERREUR 403` · « Accès refusé » · carte « Connectée en tant que … » · rouge « Retour à mon espace » · outline « Changer de compte ». |
| `/conditions` `/confidentialite` `/mentions-legales` | lecture longue 720 px : retour · onglets pastilles entre les 3 documents · `TEXTE PROVISOIRE · MIS À JOUR LE …` · H1 · chapeau 17 · **sommaire** numéroté · sections `01 … 05` (H2 22 + paragraphes 17/1.7) · « Une question ? contact@coory.app ». |

### 7.2 Espace coach
| Route | Contenu & comportement |
|---|---|
| `/coach` **Tableau de bord** | H1 « Bonjour {prénom} », « Vendredi 23 octobre · semaine 43 » · rouge « + Créer » → **ActionMenu** : Programme (assistant) · Séance (sheet) · Sportif (page) · Facture (sheet) · Tâche (sheet). KPI : 7 coachings aujourd'hui · 25 h cette semaine · 3 programmes à livrer · 620 € paiements en attente. Blocs (desktop) : **WeekTimeGrid** 12 col · Tâches prioritaires 4 (cases cochables, priorité) · Revenus du mois 4 (3 240 €, ↗ +12 %, 6 barres, dernière en accent) · Sportifs récents 4 · Programmes en cours 6 (barre « Semaine 6/12 » couleur discipline) · Factures récentes 6. |
| `/coach/sportifs` | rouge « + Nouveau sportif » · KPI · liste filtrable (Tous · Actif · En pause · Archivé · Running · Musculation · Hyrox · Hybride) + recherche · colonnes : sportif (avatar ♀/♂, nom, niveau) · disciplines + statut · objectif · prochaine compétition · « ••• » (Inviter, Modifier, Dupliquer, Supprimer → confirmation). Vide : « Ajoute ton premier sportif ». |
| `/coach/sportifs/nouveau` | formulaire 8 col + carte « Accord santé » 4 col. Champs **exacts** : Nom complet* · Sexe (Femme/Homme/Non précisé) · E-mail *(fac.)* · Téléphone *(fac.)* · Canal préféré (E-mail/Appel/SMS/WhatsApp) · Niveau (Débutant/Intermédiaire/Confirmé/Compétiteur) · Expérience · Disciplines (multi) · Objectif principal · Prochaine compétition · Lieux (Salle de sport, Extérieur (route, trail), Piste d'athlétisme, Domicile, Box Hyrox / CrossFit) · Matériel · Contraintes physiques *(fac., donnée de santé)* · Contraintes d'organisation *(fac.)* · Statut. Rouge « Enregistrer le sportif ». |
| `/coach/sportifs/[id]` **Fiche** | retour · H1 « Inès Benali ♀ » · sous-titre statut/niveau/date · outline « Inviter dans son espace » · rouge « Créer un programme » · « ••• ». **5 KPI** (objectif, séances/sem., durée max, J-148, canal). **7 onglets** : Vue d'ensemble (profil clé/valeur, objectif + phases Préparation → Spécifique → Affûtage → Compétition, disponibilités & contraintes, courbe des repères, notes, historique) · Profil (tous les champs + **accord santé** : toggle, preuve Oral/Par écrit/Formulaire signé, historique) · Objectifs (liste + formulaire : type, catégorie Hyrox Open/Pro/Doubles/Relay, date, temps visé, priorité, statut) · Disponibilités (jours multi, séances/sem., durée max, lieu, remarques) · Repères (tuiles : Race pace, Endurance Z2, Seuil, VMA, FC max, Charge de référence + source Test/Constaté/Estimation coach ; graphique d'évolution ; **calculateur** distance + temps → allure ; **records** 5 km/10 km/Semi/Hyrox, meilleur temps en accent) · Notes (datées + ajout) · Historique (journal). |
| `/coach/sportifs/[id]/inviter` | états en pastilles : Aucune invitation · En attente (expire le …) · Acceptée · Expirée. Rouge « Créer le lien » → lien affiché **une seule fois** (cadre pointillé mono) + « Copier le lien » (→ « Copié ✓ ») + avertissement `--warn`. |
| `/coach/agenda` | rouge « + Nouvelle séance » → sheet : Type (Collective/Individuelle) · Titre* · Discipline · Date* · Heure · Durée · Chaque semaine (toggle) · Date de fin *(fac.)* · Lieu (« Ex. : Piste d'athlétisme, salle, parc ») · Sportif / inscrits (pastilles multi) · Note *(fac.)* (« Ex. : prévoir chronos et plots »). KPI. Onglets Semaine / Jour / Mois / Aujourd'hui (§6). |
| `/coach/agenda/[id]` | « Behybrid on Tracks » · Collective · Running · chaque mercredi 19:00 · rouge « Modifier » (sheet pré-remplie) · « ••• » Supprimer (confirmation). Blocs : détails (quand, lieu, discipline, récurrence, note) · inscrits (avatars) · prochaines dates. |
| `/coach/programmes` | rouge « + Créer un programme » · KPI (18 actifs, 3 à livrer, 8 modèles, 84 % réalisées) · liste filtrable (Tous/Publié/À livrer/Brouillon/Archivé) : programme + sportif, discipline + statut, barre « Semaine x/y », séances/sem., « ••• » (Aperçu, PDF…) · modèles en tuiles · échéances. |
| `/coach/programmes/nouveau` | **Stepper 5 étapes** : 1 Sportif (existant/nouveau) · 2 Objectifs, discipline dominante, notes · 3 Date de début, nb semaines (1–52), séances/sem. (1–14), jours · 4 Point de départ (Vierge, Semaine type, Programme précédent, Modèle) · 5 Aperçu de la structure → rouge « Créer en brouillon ». Boutons « ← Précédent » / « Suivant → ». Carte résumé à droite (desktop). |
| `/coach/programmes/[id]` **Éditeur** | en-tête : programme, sportif, objectif, période, statut, « enregistré à 10:42 » · outline « Aperçu » · rouge « Publier » (confirmation listant les séances incomplètes) · « ••• » : PDF, Dupliquer la semaine (sheet multi), Insérer un modèle, Comparer S1/S2. **Desktop 3 panneaux** : Semaines (3 col, groupées par phase) · Séances de la semaine (4 col : jour, type, durée, statut) · Inspecteur (5 col : blocs en accordéon avec boutons **↑ ↓**). **Mobile : pile** Programme → Semaine → Séance → Blocs avec fil d'Ariane, bouton +, sauvegarde visible, sheets pour les choix, boutons monter/descendre (pas de glisser-déposer), clavier numérique (`inputmode="decimal"`). Notations : `5 × (2 min @ 4:20/km + 2 min récup)` · `A1 Back squat 4 × 6 · 85 kg · repos 2:30 · RPE 8` · `Bloc 1 · Tour 1/3 · Run 1 km + Sled Push 25 m`. |
| `/coach/programmes/[id]/apercu` | séance comme le sportif la verra · vérifications (Vérifiée / Avertissement) · versions (timeline) · rouge « Publier ». |
| `/coach/programmes/[id]/pdf` | aperçu papier blanc (ratio .72) · options (consignes, notes, période) · outline « Envoyer par e-mail » · rouge « Télécharger le PDF ». |
| `/coach/seances` | KPI · onglets Aujourd'hui / À venir / Terminées / En attente de retour · planning (heure mono, avatar, type, statut) 5 col + détail 7 col (blocs + retour du sportif + « Ouvrir l'éditeur de séance ») · outline « Retours des sportifs » · rouge « + Créer une séance ». |
| `/coach/retours` | liste : séance + sportif, commentaire, ressenti (Facile/Modérée/Difficile), **Prescrit vs Réalisé**, RPE. |
| `/coach/bibliotheque` | KPI · tuiles filtrables (Tous/Running/Musculation/Hyrox/Hybride) + recherche : vignette teintée discipline (icône 28), badge, titre « Running · Sortie longue », « Modèle de séance · ouvrir le modèle ↗ » → sheet fiche (discipline, type, matériel, variantes, consignes) + « Utiliser dans un programme ». Rouge « + Ajouter un modèle ». Mobile 2 colonnes, desktop 4. |
| `/coach/facturation` | KPI (encaissé, en attente, en retard, à préparer) · liste (Toutes/Brouillon/À envoyer/En attente/Payée/En retard) : client, statut, n° `FAC-2026-014` · date, montant mono, « ••• » (Marquer comme payée, Relancer…) · paiements et relances. Rouge « + Créer une facture » → sheet : sportif, prestation*, quantité, prix unitaire, TVA (0/6/21 %), échéance, notes. **Pas de paiement en ligne.** |
| `/coach/facturation/[id]` | aperçu facture (lignes, sous-total, TVA, total, IBAN, communication structurée) · suivi (timeline) · outline « Marquer comme payée » · rouge « Envoyer en PDF ». |
| `/coach/comptabilite` | KPI (CA, dépenses, résultat estimé, impayés) · histogramme 12 mois (dernier mois accent) · répartition des dépenses (barre segmentée + légende %) · mouvements récents (Revenu/Dépense, montants ±) · mention « Vue de gestion, pas une comptabilité légale certifiée » · rouge « + Ajouter une dépense ». |
| `/coach/taches` | KPI · onglets Toutes/Aujourd'hui/À venir/Terminées · liste à cocher (barrée + toast « Tâche terminée. ») : tâche, associée à (Programme/Facturation/Paiement/Suivi/Agenda), priorité (Haute/Normale), échéance · rouge « + Nouvelle tâche ». |
| `/coach/documents` | KPI · liste (Tous/Programme/Facture/Contrat/Bilan) + recherche : fichier, catégorie, associé à · modifié, « ••• » · clic = aperçu · rouge « + Importer un fichier » (nom, catégorie, sportif). |
| `/coach/messages` | **Desktop** : conversations 4 col (recherche, avatar, dernier message, heure, non lus) + fil 8 col. **Mobile** : la liste, puis la conversation **plein écran** avec retour « ← Conversations ». Bulles : moi = fond `--text` à droite, l'autre = `--surface-2` à gauche, heure mono 11. Champ « Écrire un message… » + bouton envoyer. Rouge « + Nouveau message ». |
| `/coach/notifications` | filtres (Toutes/Retours/Messages/Invitations/Factures/Tâches) · lignes icône + titre + détail → navigation vers l'élément · rouge « Tout marquer comme lu ». |
| `/coach/recherche` | **Supprimée le 06/11/2026 (D-146, décision d'Antonino) : chaque liste garde sa propre recherche.** Prévu à l'origine : grand champ · résultats groupés Sportifs / Programmes / Séances / Documents, filtrés en direct. |
| `/coach/profil` **Paramètres** | rouge « Enregistrer » · onglets : Profil et entreprise (photo : importer, recadrer carré, supprimer ; prénom, nom, entreprise, téléphone, organisation) · Préférences (thème, langue, notifications par canal) · Facturation et légal (raison sociale, TVA, adresse, IBAN, numérotation, mentions) · Sécurité (e-mail, mot de passe, Google/Facebook/Apple, appareils connectés, « Déconnecter partout » → confirmation) · Abonnement (formule, prix, échéance, moyen de paiement, historique). |
| `/coach/assistant` | discussion (l'assistant propose) + actions proposées cochables · rouge « Valider les 3 actions » → confirmation → exécution. **L'IA ne fait rien sans validation.** |

### 7.3 Espace sportif (priorité téléphone, texte ≥ 16 px, gros contrastes, rien au survol)
| Route | Contenu |
|---|---|
| `/app` **Aujourd'hui** | « Salut Inès » · date · semaine 6/12 · épreuve dans 148 jours · 2 KPI · **grande carte séance du jour** : `AUJOURD'HUI · 18:00 · SÉANCE 4/5`, titre 26, badges, infos, **rouge « Commencer → » 56 px pleine largeur** au-dessus de la ligne de flottaison, lien « Voir le détail » · semaine en 7 ronds 36 px (fait = vert, aujourd'hui = rouge plein, à venir = contour) · message du coach + « Répondre ». États : repos, aucun programme (« Ton coach prépare ton programme » + contacter + carte accord santé), séance en cours à reprendre. |
| `/app/programme` | pastilles S5 S6 S7 S8 · séances de la semaine : jour, nom, durée, intensité, discipline, état (Prévue/Faite/Partielle/Reportée/Manquée). |
| `/app/seance/[id]` | onglets Running / Musculation / Hyrox (3 gabarits) · blocs ordonnés **dépliables** (accordéon, unités très visibles) · infos (objectif, durée, matériel, consignes) · rouge « Commencer ». |
| `/app/seance/[id]/actif` | « Bloc 2/3 » · « Tour 2/3 » · barre de progression · nom du bloc · **cible en très grand** (Space Grotesk 60) + unité mono · cases à cocher 56 px · « ← Bloc précédent » / « Bloc suivant → » · **rouge fixe « Terminer la séance »**. Pas de chrono imposé. « Quitter » → confirmation (progression gardée). |
| `/app/seance/[id]/fin` | Statut (Terminée/Partielle/Sautée) · **RPE 1 à 10** (grille 5 × 2, boutons 52 px) · Difficulté (Facile/Modérée/Difficile) · commentaire *(fac.)* · réel par bloc *(fac.)* · rouge « Enregistrer mon retour » → toast + historique. |
| `/app/historique` | filtres (Toutes/Terminée/Partielle/Sautée) · date, séance, discipline, statut, RPE. |
| `/app/progression` | KPI (séances réalisées/prévues, RPE moyen — **« Aucune donnée » s'il manque des réponses**, records, race pace) · calendrier d'assiduité (mois) · courbe · records. |
| `/app/objectifs` | compte à rebours J-148 · temps visé · phases · liste d'objectifs. |
| `/app/documents` · `/app/messages` · `/app/notifications` | PDF publiés · conversation avec le coach · nouveau programme / nouvelle version / message / rappel. |
| `/app/profil` | identité · **accord santé** (toggle + « Retirer mon accord » → confirmation) · préférences · rouge « Se déconnecter ». |

### 7.4 Administration (desktop prioritaire, mais responsive)
`/admin` vue d'ensemble (KPI organisations, coachs, sportifs, inscriptions du mois + histogramme + dernières orgs) · `/admin/organisations` (nom, propriétaire, nb sportifs, formule, état Active/Suspendue ; « ••• » Suspendre/Réactiver → confirmation) · `/admin/utilisateurs` (nom, e-mail, rôle Coach/Sportif/Admin, dernière connexion) · `/admin/abonnements` (MRR, formules, **quotas** en barres vert/orange/rouge) · `/admin/audit` (qui, quoi, quand) · `/admin/erreurs` (gravité Critique/Avertissement/Info/Résolu + état des intégrations) · `/admin/conformite` (exports, suppressions ; suppression = **confirmation renforcée**, action journalisée).

---

## 8. Données d'exemple (`lib/demo-data.ts`, réalistes)

Coach : **Gianluca Lo Bianco**, organisation **Behybrid**, Bruxelles, `gianluca@behybrid.be`, `+32 470 12 34 56`, BE 0712.345.678.
Sportifs (initiales · sexe · discipline · niveau · objectif · statut) :
Inès Benali IB ♀ Hyrox Confirmé « Hyrox Bruxelles · Pro » 20 mars 2027 Actif · Lucas Janssens LJ ♂ Hybride Intermédiaire « Hyrox Doubles » Actif · Sophie Lambert SL ♀ Musculation Intermédiaire « Force · squat 90 kg » Actif · Thomas Peeters TP ♂ Running Confirmé « Semi < 1 h 45 » Actif · Nadia El Amrani NE ♀ Hyrox Compétiteur « Hyrox Pro » Actif · Emma Durand ED ♀ Running Débutant « 10 km < 55 min » Actif · Yanis Khelifi YK ♂ Musculation En pause · Julie Martin JM ♀ Hybride Archivé.
Séance collective récurrente : **Behybrid on Tracks**, mercredi 19:00–20:30, Parc de Woluwe / Merode, 12 inscrits.
Semaine affichée : 19 → 25 octobre 2026, aujourd'hui = vendredi 23, « maintenant » = 10:42.
Factures `FAC-2026-010` → `016` (120 € à 450 €). CA octobre 4 320 €, dépenses 1 140 € (location 42 %, matériel 27 %, services 19 %, autres 12 %).
Repères d'Inès : race pace 4:50–5:05 /km, Z2 5:40 /km, seuil 4:35 /km, VMA 15,5 km/h, FC max 191 bpm, wall ball 6 kg × 25 ; records 5 km 23:10, 10 km 48:42, semi 1:47:15, Hyrox Open 1:24:30.
Admin : Alice Coory ; 42 organisations, 57 coachs, 1 284 sportifs, 96 inscriptions en octobre, MRR 1 482 €.

---

## 9. Comportements globaux

- Navigation réelle (routes du §7), retour navigateur fonctionnel, titre d'onglet « {Page} · Coory ».
- Recherche ⌘K / Ctrl K ouvre la recherche.
- Filtres et recherches filtrent en direct ; « Aucun résultat » + « Essaie un autre filtre ou une autre recherche. ».
- Les formulaires ne perdent jamais la saisie en cas d'erreur ; le bouton passe en chargement pendant l'envoi.
- Toutes les suppressions, publications, suspensions et déconnexions globales passent par le **Dialog de confirmation**.
- Les feuilles du bas se ferment par « Annuler », la croix, le fond ou Échap ; focus piégé ; `aria-modal`.
- Accessibilité : `label` reliés, `aria-pressed` / `aria-checked` / `aria-selected`, focus visible (2 px `--accent`, décalage 2), ordre de tabulation logique, `prefers-reduced-motion` respecté.
- Performances : squelettes ≤ 300 ms après la navigation, images avatars en `next/image`, aucune dépendance lourde pour les graphiques (SVG simple comme dans les prototypes).

---

## 10. Recette finale (à cocher pour CHAQUE page, en 390 px puis 1440 px, en sombre puis en clair)

- [ ] Rendu identique au prototype correspondant (espacements, tailles, couleurs, rayons).
- [ ] Mobile : pas de défilement horizontal de la page ; menus hamburger (coach/admin) et barre du bas (sportif) OK ; zones tactiles ≥ 44 px.
- [ ] Desktop : sidebar avec élément actif teinté, en-tête avec recherche + cloche + bouton rouge.
- [ ] Un seul bouton rouge ; aucun dégradé ; aucune ombre de carte ; aucun emoji.
- [ ] États rempli / vide / chargement / erreur présents (et succès pour les formulaires).
- [ ] Champs et listes de choix **exactement** comme le brief ; « (facultatif) » en italique ; erreurs sous les champs.
- [ ] Contraste ≥ 4,5:1 vérifié dans les deux thèmes.
- [ ] Agenda 06:00–22:00 entièrement visible, séances à l'heure exacte, mobile 3 jours défilants positionnés sur aujourd'hui.
- [ ] Logique existante intacte (tests verts).

Quand tout est coché, livre un récapitulatif : pages faites, écarts éventuels avec les prototypes et pourquoi, et la liste des TODO restants.
