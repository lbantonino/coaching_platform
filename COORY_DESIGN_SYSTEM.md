# Coory — Design System (version rouge)

> Source of truth for redesigning the Coory app. Put this file at the root of the Coory project and ask Claude Code to follow it literally.
> Companion file: `COORY_LOGO.md` (full logo spec + SVGs).
> Coory is a SaaS coaching platform: **coach web app** (desktop) + **client mobile app**. UI language: **French**.

---

## 1. Principles

1. **Dark first.** Dark theme is the default. Light theme is supported via `data-theme="light"`.
2. **One accent, used rarely.** Red `#FF3347` (« Rouge signal ») is reserved for the single most important thing on screen.
3. **Flat.** No gradients on components. No glow, no glassmorphism, no neon. Modern, not futuristic.
4. **Borders, not shadows.** Cards are defined by a 1px hairline. Shadows only on the outer app/device frame.
5. **Numbers first.** Data is the hero: large numerals, mono for values, muted units.

---

## 2. Brand / Logo

- Name **Coory**, wordmark `C∞ry` in Space Grotesk Bold: capital **C**, the **oo** merged into one continuous **red infinity loop**, then **ry**. Letters in text color, only the loop is accent.
- Accent: **Rouge signal `#FF3347`** (light theme fills `#E5283C`, red text on light `#D91E32`).
- **Full spec, SVG code and usage rules → `COORY_LOGO.md`.**

---

## 3. Color tokens

Use **semantic tokens** in components, never raw hex.

```css
:root {                      /* DARK — default */
  --page:#111114;            /* outer page (graphite, D-23 ; was #050505) */
  --bg:#16161A;              /* app background (graphite, D-23 ; was #0B0B0C) */
  --surface:#1F1F24;         /* cards (D-23 ; was #141416) */
  --surface-2:#28282E;       /* hover, active nav (D-23 ; was #1C1C1F) */
  --chip:#323239;            /* chips, avatars, neutral pills (D-23 ; was #26262A) */
  --bar:#38383F;             /* progress tracks, planned bars (D-23 ; was #2A2A2E) */
  --line:rgba(255,255,255,.14);   /* card borders, dividers (was .07, D-22) */
  --line-2:rgba(255,255,255,.36); /* control outlines, dashed drop zones (was .13, D-22) */
  --text:#F4F2EF;
  --muted:#ABABB3;              /* was #8A8A90 (D-22, D-23) */
  --faint:#8E8E97;              /* was #55555B (D-22, D-23) */

  --accent:#FF3347;          /* fills: primary button, hero stat, active segment */
  --accent-hover:#FF5C6C;
  --accent-text:#FF5C6C;     /* accent used as text/lines (D-23 ; was #FF3347, 4.1:1 on a red pill over graphite) */
  --logo-loop:#FF3347;       /* logo loop keeps the exact brand red (D-23) */
  --accent-soft:rgba(255,51,71,.11); /* tinted pill bg, completed set cells (was .14, D-22) */
  --on-accent:#FFFFFF;       /* ALWAYS white text on red */

  --inv:#F4F2EF; --on-inv:#0B0B0C;   /* inverse button / selected filter chip */

  --ok:#4ADE80;     --ok-soft:rgba(74,222,128,.12);
  --warn:#FBBF24;   --warn-soft:rgba(251,191,36,.12);
  --danger:#FFFFFF; --danger-soft:var(--accent); /* alert = solid red pill, white text */

  --shadow-frame:0 30px 80px rgba(0,0,0,.55);
}
[data-theme="light"] {
  --page:#E6E4E0; --bg:#FFFFFF; --surface:#F5F4F2; --surface-2:#ECEBE8;
  --chip:#E6E5E2; --bar:#DEDDD9;
  --line:rgba(0,0,0,.08); --line-2:rgba(0,0,0,.14);
  --text:#141416; --muted:#6A6A70; --faint:#A3A3A8;
  --accent:#E5283C; --accent-hover:#FF3347;  /* slightly deeper for contrast with white text */
  --accent-text:#D91E32;     /* red as text/lines on light */
  --logo-loop:#D91E32;
  --accent-soft:rgba(229,40,60,.10); --on-accent:#FFFFFF;
  --inv:#141416; --on-inv:#FFFFFF;
  --ok:#16A34A; --ok-soft:rgba(22,163,74,.10);
  --warn:#B7791F; --warn-soft:rgba(183,121,31,.12);
  --danger:#FFFFFF; --danger-soft:var(--accent);
  --shadow-frame:0 30px 70px rgba(0,0,0,.10);
}
```

> **Ajustement du 22/10/2026 (D-22, demande d'Antonino : « on ne lit pas très bien en sombre »)** : en thème sombre, `--faint` était à 2,5:1 et `--muted` à 4,4:1 sur les pastilles, sous le minimum WCAG de 4,5:1 ; les filets étaient presque invisibles. Valeurs relevées ci-dessus, toutes vérifiées : texte ≥ 4,5:1, contour des champs ≥ 3:1. Le rouge de marque `#FF3347` (et donc le logo) ne change pas. Thème clair inchangé.

> **Ajustement du 22/10/2026 (D-23, choix d'Antonino sur aperçus)** : thème sombre en **graphite** au lieu du quasi-noir (cartes mieux détachées, moins « trou noir ») ; rouge texte un cran plus clair (#FF5C6C) pour rester ≥ 4,5:1 sur le graphite, le logo gardant #FF3347 via `--logo-loop`. Toutes les paires texte / fond revérifiées (WCAG AA).

**Discipline colors (D-23)** — color that *means* something, never decoration. One per native discipline, used on goal pills now, then on sessions, programs and calendar. Icons stay neutral.

| Discipline | Dark | Light | Token |
|---|---|---|---|
| Running | `#60A5FA` | `#1D4ED8` | `--run` / `--run-soft` |
| Musculation (incl. remise en forme) | `#A78BFA` | `#6D28D9` | `--strength` / `--strength-soft` |
| Hyrox | `#FB923C` | `#9A3412` | `--hyrox` / `--hyrox-soft` |
| Hybride | `#2DD4BF` | `#115E59` | `--hybrid` / `--hybrid-soft` |

Soft = same color at 12 % (dark) / 10 % (light) opacity. Text on card and on its soft pill ≥ 4.5:1 in both themes.

**Where red is allowed:** primary CTA (max 1 per view), one hero stat card per row, current week/segment, active mobile tab, active page-tab underline, completed set check, notification dot, nav counters, current bar in charts.
**Never:** page backgrounds, large text blocks, raw `#FF3347` text on light theme (use `--accent-text`), dark text on red.

**Status mapping:** `ok` green = done/active client · `accent` tinted red = in progress / PR · `warn` amber = missed / late · `danger` = pain / alert, rendered as **solid red pill with white text** so it never looks like "in progress" · `muted+chip` = upcoming.

---

## 4. Typography

```css
--font-display:'Space Grotesk', system-ui, sans-serif; /* logo, H1–H3, display numbers */
--font-sans:'Geist', system-ui, sans-serif;            /* all UI text, labels, body, buttons */
--font-mono:'Geist Mono', ui-monospace, monospace;     /* data */
```
Load (Google Fonts, all OFL): `https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap`

**Pairing rule:** Space Grotesk (futuristic, technical) only for the logo, page/section titles and big KPI numbers. Everything else — body, labels, buttons, nav, tables — stays in Geist for calm readability. Never use Space Grotesk below 18px.

| Role | Size / weight | Tracking | Use |
|---|---|---|---|
| Display · **Space Grotesk** | 40–48 / 500 | -0.03em | KPI numbers |
| H1 · **Space Grotesk** | 32 / 500 | -0.03em | Page title |
| H2 · **Space Grotesk** | 28 / 500 | -0.03em | Section / program title |
| H3 · **Space Grotesk** | 22 / 500 | -0.02em | Mobile card title |
| Title · Geist | 15 / 500 | 0 | Card titles |
| Body | 14 / 400, lh 1.5 | 0 | Default text |
| Small | 13 / 400 | 0 | Secondary |
| Caption | 12 / 400, `--muted` | 0 | Meta |
| Mono | 11–12 / 500 | 0 | Times, loads, sets, deltas, week codes |

Rules: headings never bold (500 max). Units smaller and `--muted` (`87<small>%</small>`). Mono micro-labels may be UPPERCASE (`S7 · JOUR 2`). Sentence case everywhere.

---

## 5. Spacing, radii, sizes

- Spacing scale (px): `2 4 6 8 10 12 14 16 20 22 28 32 40`. Layout with flex/grid + `gap`.
- Radii: `5` kbd & mono chips · `7–10` controls · `14–16` cards · `20` pills & mobile hero cards · `48` device · `999` pills/avatars.
- Controls: height `32` (sm) / `38` (md, desktop default) / `52` (lg, mobile CTA). Mobile hit targets ≥ 44px.
- Desktop: 1440 frame, sidebar `232px`, content padding `22px 32px`, grid gap `14px`.
- Mobile: 390 frame, side padding `20px`, card gap `10px`, fixed bottom bar on `--bg` with top hairline.
- Motion: `150ms` color/background, `250ms cubic-bezier(.2,.7,.2,1)` for widths. Press = `scale(.98)`. No bounce.

---

## 6. Components

All components read tokens only. Hover = one surface step lighter. Focus = border `--accent`.

### Button
- Variants: `primary` (bg `--accent`, text `--on-accent`, hover `--accent-hover`) · `inverse` (bg `--inv`, text `--on-inv`) · `outline` (transparent, border `--line-2`) · `ghost` (transparent, text `--muted` → `--text` on hover, bg `--surface-2`).
- Sizes sm/md/lg = 32/38/52 px, radius 8/10/14, font 12/13/15, weight 600. Optional leading icon (15px), gap 8. Disabled = opacity .4.

### IconButton
38×38, radius 10, bg `--surface`, border `--line`, icon 16px. Optional `dot` (6px `--accent`, top-right).

### Badge (status pill)
Font 11, padding `4px 9px`, radius 20, color `--{tone}`, bg `--{tone}-soft`. Tones: ok, live(accent), warn, danger, neutral(`--muted` on `--chip`). `mono` counter variant: Geist Mono 11/500, padding `1px 6px`, radius 6, bg `--accent`, text `--on-accent`.

### Chip
- Filter: font 12, padding `5px 10px`, radius 20, border `--line`, text `--muted`; selected = bg `--inv`, text `--on-inv`.
- Data (mono): Geist Mono 11, padding `3px 7px`, radius 6, bg `--chip` (e.g. `4×8`, `85 kg`).

### Avatar
Initials on `--chip`, round, font ≈ 34% of size, weight 600. Sizes 32 / 34 / 42 / 64. Stack: -8px overlap, 2px ring in background color.

### Input
Height 38, radius 10, bg `--surface`, border `--line` (focus `--accent`), padding `0 12px`, font 13, leading icon 15px, optional `⌘K` kbd (mono 11, border `--line-2`, radius 5).

### Segmented
Container: padding 4, gap 4, radius 11, bg `--surface`, border `--line`. Item: padding `6px 12px`, radius 7, font 12. Selected = bg `--chip` text `--text`; `accent` variant = bg `--accent` text `--on-accent` (week tabs, mono).

### Card
bg `--surface`, border `1px --line`, radius 16, padding 22, gap 14. Header: title 15/500 + optional subtitle 12 `--muted` + right action (link in `--accent-text`). Nested items inside a card sit on `--bg` (inverted depth).

### StatCard
Padding 20, radius 16, gap 18. Label 13, delta mono 12 (`--ok`/`--warn`), value 40/500 -0.03em with muted unit 24px, caption 12 `--muted`. `highlight` = bg `--accent`, all text `--on-accent` — **max one per row**.

### ProgressBar / Segments
Bar: height 4, radius = height, track `--bar`, fill `--accent`. Segments (program weeks): gap 4, height 6; past = `--text`, current = `--accent`, future = `--bar`.

### NavItem (desktop sidebar)
Padding `9px 10px`, radius 9, gap 12, font 14, icon 17. Default `--muted`; hover `--text`; active = bg `--surface-2`, text `--text` (never red). Optional mono counter badge.

### Tabs (page)
Gap 28, font 14, bottom border `--line`; active = text `--text` + 2px `--accent` underline; others `--muted`.

### TabBar (mobile)
4 items, icon 21 + label 11, padding `12px 28px 28px`, bg `--bg`, top border `--line`; active = `--accent-text`.

### SetRow (client workout logging)
Grid `28px 1fr 1fr 1fr 40px`, gap 6, Geist Mono 13/500. Cells: padding 8, radius 8, bg `--bg` (done: `--accent-soft`). Check: 40×34, radius 9, bg `--chip` text `--faint` → done: bg `--accent` text `--on-accent`. Header row mono 11 `--faint`: `# · CHARGE · REPS · RPE`.

### Charts
Bars: radius `5px 5px 2px 2px`, planned = `--bar`, done = `--accent` (current week full, older weeks lower opacity). Line: 2.5px `--accent`, area `--accent-soft`, grid lines `--line`. Axis labels mono 11 `--faint`.

---

## 7. Screens (reference)

**Coach web** (sidebar: Tableau de bord, Clients, Programmes, Exercices, Calendrier, Messages, Paiements)
- Dashboard: greeting H1 + meta · 4 StatCards (1 highlight) · weekly sessions bar chart · "Aujourd'hui" list (time mono · avatar · name/program · Badge).
- Program builder: exercise library (search, muscle chips, draggable rows) · program title + week Segmented (accent) · week Segments · day columns with exercise cards (letter A/B/C, name, mono chips sets/load) · dashed "+ Ajouter".
- Client profile: avatar 64 + name H2 + status Badge · Tabs · KPI row · 1RM line chart · attendance heatmap · check-ins list with tag Badges.

**Client mobile** (tabs: Accueil, Programme, Progrès, Coach)
- Home: date + "Salut {prénom}" · today's session card (mono time in accent, title, chips, lg primary CTA) · week day dots (today = accent fill) · 2 mini stats · coach message card · dashed check-in prompt.
- Workout: back / `S7 · JOUR 2` / menu · title · accent progress banner (sets done, timer mono) · exercise cards with SetRows · fixed bottom: message IconButton + inverse "Terminer la séance".

---

## 8. Content & voice (French)

- Coach side: factual, label-first, numbers first: « 6 séances aujourd'hui · 7 check-ins à relire », « Inviter un client ».
- Client side: **tu** + first name, encouraging without hype: « Salut Camille », « Garde 2 reps en réserve. »
- Sentence case. Separator ` · `. Em dash in titles (« Hypertrophie — 12 semaines »). French quotes « ».
- Numbers: `6 240 €`, `102,5 kg`, `4×8`, `+3,2 %`, `−1,8 kg`, times `09:30`.
- Vocabulary: séance, série, reps, charge, RPE, repos, bloc (Accumulation / Intensification / Réalisation), check-in, 1RM, adhésion.
- **No emoji.** Allowed glyphs: → ↗ ✓ ⌘K.

---

## 9. Iconography

Lucide (outline, stroke ~1.7, round caps), monochrome `currentColor` (`--text` / `--muted` / `--faint`). Sizes: 15–17 desktop, 21 mobile tab bar, 13 in segmented controls. Only the active mobile tab may be accent-colored. Core set: house, users, list, dumbbell, calendar, message-square, credit-card, search, bell, plus, check, activity, moon, sun, chevron-left, grip-vertical.

---

## 10. Redesign plan for Claude Code

1. **Tokens first.** Create `src/styles/tokens.css` with the exact blocks of §3 + the font/spacing variables of §4–5, import it globally, load Space Grotesk + Geist + Geist Mono. If the project uses Tailwind, map tokens in `theme.extend`:
   ```js
   colors: { page:'var(--page)', bg:'var(--bg)', surface:'var(--surface)', 'surface-2':'var(--surface-2)', chip:'var(--chip)', bar:'var(--bar)',
     line:'var(--line)', 'line-2':'var(--line-2)', text:'var(--text)', muted:'var(--muted)', faint:'var(--faint)',
     accent:{ DEFAULT:'var(--accent)', hover:'var(--accent-hover)', text:'var(--accent-text)', soft:'var(--accent-soft)', on:'var(--on-accent)' },
     ok:'var(--ok)', warn:'var(--warn)' },
   fontFamily: { display:['Space Grotesk','system-ui','sans-serif'], sans:['Geist','system-ui','sans-serif'], mono:['Geist Mono','ui-monospace','monospace'] },
   borderRadius: { sm:'7px', md:'10px', card:'16px', pill:'20px' }
   ```
2. **Theme.** Dark by default; toggle `data-theme="light"` on `<html>`, persist in `localStorage`.
3. **Primitives.** Build the components of §6 (Button, IconButton, Badge, Chip, Avatar, Input, Segmented, Card, StatCard, ProgressBar/Segments, NavItem, Tabs, TabBar, SetRow) in `src/components/ui/`, reading tokens only — no hard-coded hex.
4. **Logo.** Implement `<CooryLogo />` per `COORY_LOGO.md` and replace the old logo/favicon.
5. **Screens.** Restyle existing screens one by one using §7 as reference layouts. Keep existing logic/data; change only presentation.
6. **Remove** old colors, gradients, shadows on cards, and any emoji in UI copy.

**Accessibility:** text contrast ≥ 4.5:1 — use `--accent-text` for red text on light; white on `#FF3347` is ~3.6:1, so use accent fills only behind bold ≥14px text, buttons and large numbers. Inputs focus = 1px `--accent` border; buttons focus = 2px `--accent` outline, offset 2. Mobile hit targets ≥ 44px.

**Checklist per screen:** one red CTA max · no gradients · cards = surface + 1px hairline, no shadow · data numbers in Geist Mono · French formatting · works in dark and light.
