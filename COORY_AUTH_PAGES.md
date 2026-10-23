# Coory — Redesign des pages Connexion & Inscription

> Brief pour Claude Code. À utiliser avec `COORY_DESIGN_SYSTEM.md` (tokens, typo, composants) et `COORY_LOGO.md` (logo `C∞ry`).
> Pages concernées : `/login` et `/inscription`. **Garder les couleurs déjà présentes dans le projet** et **toute la logique existante** (auth, validation, appels API, redirections) — ne changer que la présentation.
> Référence visuelle : `Coory Connexion Inscription.dc.html` (écrans 1a → 1d).

---

## 1. Principes

- Thème **sombre par défaut** (le bouton soleil existant bascule en clair via `data-theme="light"`).
- Sobre : aplats, aucun dégradé, aucune ombre sur les cartes, aucun emoji.
- Une seule action rouge par écran : le bouton principal.
- **Palette : celle déjà présente dans le projet** (voir tableau ci-dessous) — ce brief change la mise en page et la typo, pas les couleurs.
- Polices : **Space Grotesk** pour le logo et les titres (≥ 18 px), **Geist** pour tout le texte UI, **Geist Mono** pour les petits libellés techniques (`AFFICHER`, compteur `4 / 10`).

### ⚠️ Couleurs : garder celles du projet

**Ne crée aucune nouvelle couleur et ne remplace pas la palette existante.** Utilise uniquement les variables / classes de couleur déjà présentes dans le code (CSS variables, thème Tailwind, fichier de thème…). Les valeurs hex citées dans ce document servent seulement à indiquer le **rôle** de chaque couleur : mappe-les sur l'équivalent existant du projet.

| Rôle dans ce brief | Valeur indicative | À remplacer par… |
|---|---|---|
| Fond de page | `#0B0B0C` | le fond actuel de l'app (ex. fond bleu-noir actuel de /login) |
| Panneau de marque (gauche) | `#111113` | la couleur « surface / card » existante, légèrement plus claire que le fond |
| Fond des champs | `#141416` | le fond d'input actuel |
| Bordures / séparateurs | `rgba(255,255,255,.07–.08)` | la couleur de bordure actuelle |
| Texte principal | `#F4F2EF` | la couleur de texte actuelle |
| Texte secondaire | `#8A8A90` | la couleur « muted » actuelle |
| Texte discret / placeholder | `#55555B` | la couleur placeholder actuelle |
| Accent (bouton, « tes sportifs. », focus) | `#FF3347` | le rouge déjà utilisé par le bouton « Se connecter » |
| Accent hover | `#FF5C6C` | le hover existant du bouton, sinon accent un peu plus clair |
| Option sélectionnée du choix coach/sportif | `#F4F2EF` sur `#0B0B0C` | **garder le style actuel** (fond bleu-gris foncé de « Je suis coach ») |
| Validation OK (jauge) | `#4ADE80` | la couleur « success » existante si elle existe |

Si une couleur de rôle n'existe pas dans le projet (ex. surface du panneau, success), dérive-la d'une couleur existante (même teinte, luminosité ajustée) plutôt que d'en inventer une, et ajoute-la au thème existant avec un nom explicite.

---

## 2. Layout desktop (≥ 1024 px)

Deux colonnes, pleine hauteur (`min-height: 100vh`), fond `--bg`.

### Colonne gauche — panneau de marque
- Largeur ≈ 51 % (740 px sur 1440), `margin: 16px`, `border-radius: 24px`, fond `#111113`, bordure 1 px `rgba(255,255,255,.06)`, `padding: 44px 48px`, `overflow: hidden`, `position: relative`.
- Contenu en colonne, `justify-content: space-between` :
  1. **Logo** `<CooryLogo variant="wordmark" size={26} />` en haut à gauche.
  2. **Bloc accroche** (au centre vertical, `gap: 24px`) :
     - Sur-titre Geist Mono 12 px, 500, `letter-spacing: .08em`, couleur `--accent`, en majuscules :
       - `/login` → `PLATEFORME DE COACHING`
       - `/inscription` → `ESPACE COACH` ou `ESPACE SPORTIF` selon le type de compte choisi.
     - **H1** Space Grotesk 68 px, 600, `line-height: .98`, `letter-spacing: -0.045em`, sur 3 lignes :
       ```
       Programmer,
       publier et suivre
       tes sportifs.        ← « tes sportifs. » en --accent
       ```
     - Paragraphe Geist 17 px, `line-height: 1.55`, `--muted`, `max-width: 470px` :
       « Programmation et suivi d'entraînements Running, Musculation, Hyrox et Hybride. »
  3. Bas du panneau : vide (pas de cartes ni de pastilles — rester sobre).
- **Filigrane** : la boucle ∞ du logo (même path SVG que `COORY_LOGO.md`), `position: absolute; width: 1180px; right: -420px; bottom: -150px;`, `stroke: rgba(255,255,255,.035)`, `stroke-width: 124`, `pointer-events: none`, `aria-hidden`.

### Colonne droite — formulaire
- `flex: 1`, `padding: 28px 40px 28px 24px`, colonne :
  - En haut à droite : bouton thème 40×40, radius 11, fond `--surface`, bordure `--line`, icône Lucide `sun` 17 px.
  - Au centre : le formulaire (largeur fixe **400 px** login, **440 px** inscription).
  - En bas : pied de page 12 px `--faint` — gauche « © 2026 Coory », droite « Conditions · Confidentialité » (liens).

---

## 3. Page Connexion `/login`

En-tête du formulaire (`gap: 10px`) :
- H2 Space Grotesk 38 px, 600, `letter-spacing: -0.035em` : **« Bon retour. »**
- Sous-titre 14 px `--muted` : « Pas encore de compte ? » + lien **« Créer un compte »** (texte `--text`, soulignement 1 px `--accent`) → `/inscription`.

Champs (`gap: 16px`) :
1. **Adresse e-mail** — `type="email"`, placeholder `toi@exemple.com`.
2. **Mot de passe** — label à gauche, lien « Mot de passe oublié ? » (`--muted`) à droite sur la même ligne. Bouton texte `AFFICHER` / `MASQUER` (Geist Mono 12, `--muted`) positionné à droite **dans** le champ, bascule `type="password"` ↔ `text`.

Bouton : **« Se connecter → »**.

---

## 4. Page Inscription `/inscription`

En-tête :
- H2 38 px : **« Créer un compte »**
- « Déjà un compte ? » + lien **« Se connecter »** → `/login`.

**Type de compte** (segmented control) :
- Conteneur grille 2 colonnes, `padding: 4px`, `gap: 4px`, radius 13, fond `--surface`, bordure `--line`.
- Options 42 px de haut, radius 9, 14 px 500 : « Je suis coach » / « Je suis sportif » (mobile : « Coach » / « Sportif », 44 px).
- Sélectionné : **conserver le style sélectionné actuel du projet**. Non sélectionné : transparent, couleur muted existante.
- Texte d'aide 13 px `--muted` sous le contrôle :
  - Coach : « Tu crées ton espace coach : tes sportifs, ton agenda et tes programmes. »
  - Sportif : « Ton coach t'envoie tes séances. Tu les suis, tu notes tes charges et ton ressenti. »

Champs (`gap: 14px`, inputs 46 px desktop / 48 px mobile) :
1. **Prénom** + **Nom** — côte à côte (2 colonnes, `gap: 12px`), placeholders `Camille` / `Moreau`.
2. **Adresse e-mail** — placeholder `toi@exemple.com`.
3. **Téléphone** *facultatif* + **Ton activité** *facultatif* :
   - Desktop coach : côte à côte (2 colonnes). Sportif : téléphone seul, pleine largeur.
   - Téléphone en Geist Mono, placeholder `+32 …`.
   - « Ton activité » (mobile : « Nom de ton activité ») **affiché uniquement pour le coach**, placeholder `Ex. Studio Renard` (mobile : `Sinon : ton prénom et ton nom`).
   - Le mot « facultatif » en 400, couleur `--faint`, après le label.
4. **Mot de passe** — placeholder `10 caractères minimum`, bouton `AFFICHER`/`MASQUER`. En dessous, **jauge de longueur** :
   - Barre 4 px, radius 4, piste `#2A2A2E`, remplissage `min(100, longueur × 10) %`, transition 250 ms.
   - Couleur : `--faint` si vide, `--accent` si < 10, `--ok` si ≥ 10.
   - Compteur à droite Geist Mono 11 px même couleur : `4 / 10` puis `✓ OK`.
5. **Confirmation du mot de passe** — placeholder `Répète ton mot de passe`, suit le même `type` que le champ mot de passe.

**Case CGU** — toute la ligne est cliquable :
- Case 20×20 (22 mobile), radius 6 ; décochée : bordure `rgba(255,255,255,.2)` ; cochée : fond + bordure `--accent`, ✓ blanc.
- Texte 13 px `#C9C7C3` : « J'ai 18 ans ou plus et j'accepte les **conditions d'utilisation** et la **politique de confidentialité**. » (liens en `--text`, soulignement 1 px `rgba(255,255,255,.3)`).

Bouton :
- Libellé : coach → **« Créer mon espace coach → »**, sportif → **« Créer mon compte → »**.
- `opacity: .55` + `disabled` tant que la case CGU n'est pas cochée.

---

## 5. Styles communs

**Label** : Geist 13 px, 500, `--text`, `gap: 7–8px` avec le champ.

**Input** :
```css
height: 50px;            /* login ; 46px inscription desktop ; 48px mobile */
padding: 0 16px;         /* 0 84px 0 16px si bouton AFFICHER */
border-radius: 12px;
background: var(--surface);
border: 1px solid rgba(255,255,255,.08);
color: var(--text);
font: 15px 'Geist';      /* 14px inscription desktop */
outline: none;
/* placeholder : var(--faint) */
/* focus : border-color var(--accent) */
```

**Bouton principal** :
```css
height: 52px;            /* 54px mobile */
border-radius: 13px;     /* 14px mobile */
background: var(--accent); color: #fff;
font: 600 15px 'Geist';  /* 16px mobile */
display: flex; align-items: center; justify-content: center; gap: 10px;
/* flèche « → » 17px après le libellé */
/* hover : var(--accent-hover) · active : scale(.98) */
```

**Liens texte** : `--text` + `border-bottom: 1px solid var(--accent)`, `padding-bottom: 1px`.

---

## 6. Mobile (< 1024 px)

Une seule colonne, `padding: 14px 22px 28px`, `gap: 24–26px`.

### Connexion mobile
1. Barre haute : logo (24 px) à gauche, bouton thème 40×40 à droite.
2. Accroche : H1 Space Grotesk 38 px, 600, `line-height: 1`, `letter-spacing: -0.045em` : « Programmer, publier et suivre **tes sportifs.** » (rouge sur « tes sportifs. ») + paragraphe 14 px `--muted` : « Programmation et suivi d'entraînements Running, Musculation, Hyrox et Hybride. »
3. Séparateur 1 px `--line`.
4. Titre « Connexion » Space Grotesk 24 px + champs e-mail / mot de passe (lien court « Oublié ? »).
5. En bas (`margin-top: auto`) : bouton « Se connecter → » + « Pas encore de compte ? Créer un compte » centré.
6. Filigrane ∞ : `width: 620px; right: -300px; top: 40px;`, `stroke: rgba(255,255,255,.04)`.

### Inscription mobile
1. Barre haute : logo à gauche, lien « Se connecter » (`--muted`, 13 px) à droite.
2. **Carte d'accroche** : `padding: 20px`, radius 20, fond `#111113`, bordure `rgba(255,255,255,.06)`, `gap: 12px` — sur-titre `ESPACE COACH` / `ESPACE SPORTIF` (Mono 11, rouge), H1 28 px (même phrase), paragraphe 13 px.
3. Titre « Créer un compte » Space Grotesk 26 px.
4. Type de compte + texte d'aide, puis champs en **une colonne** (sauf Prénom/Nom côte à côte), case CGU, bouton.
5. La page défile normalement (pas de hauteur fixe).

Cibles tactiles ≥ 44 px partout.

---

## 7. Comportements à implémenter

- Type de compte : état `role: 'coach' | 'sport'` (défaut `coach`) → sur-titre, texte d'aide, champ activité, libellé du bouton.
- Afficher/masquer : un seul état partagé par mot de passe + confirmation.
- Jauge : calculée sur la longueur du mot de passe (règle existante ≥ 10 caractères).
- Bouton désactivé tant que CGU non cochée ; garder la validation serveur existante.
- Erreurs de champ : bordure `--accent` + message 12 px `--accent` sous le champ.
- Accessibilité : `<label>` reliés aux inputs, `aria-pressed` sur le segmented control, `aria-label` sur le bouton thème et sur le bouton AFFICHER, filigrane `aria-hidden`.

---

## 8. Checklist

- [ ] Logo `C∞ry` conforme à `COORY_LOGO.md`
- [ ] Accroche « Programmer, publier et suivre tes sportifs. » + phrase disciplines, sans cartes ni pastilles
- [ ] Couleurs existantes du projet conservées (aucune nouvelle palette)
- [ ] Un seul bouton rouge par écran, aucun dégradé, aucune ombre
- [ ] Space Grotesk uniquement logo + titres ; Geist pour le reste
- [ ] Desktop 2 colonnes / mobile 1 colonne, testé à 390, 768, 1440
- [ ] Thème clair fonctionnel via le bouton soleil existant
- [ ] Logique d'auth et de validation inchangée
