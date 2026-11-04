# 08 · Créer un exercice / Créer ma variante — mesures extraites du fichier source

> **Valeurs EXACTES** lues dans les styles inline de `source-design-files/pages/08-creer-exercice/Coory Exercice.dc.html` (aucune estimation). Les valeurs entre `{{ }}` sont dynamiques (calculées dans `logic.js`).
> Arborescence : un niveau d’indentation = un niveau DOM. `sc-for` = liste répétée (`list` = source, `as` = variable), `sc-if` = bloc conditionnel (`value`).
> Police partout : **Plus Jakarta Sans**. Le cadre de l’artboard (box-shadow externe, border-radius 18/44 px) est un artefact de présentation : ne pas le reproduire dans l’app.
> Les `span` sans handler sont des boutons/champs statiques dans la maquette : dans l’app ce sont des `button`/`input` réels.

## Artboard « Exercice desktop »

- **artboard** — `box-shadow:0 0 0 1px rgba(22,18,40,.16),0 24px 60px -24px rgba(22,18,40,.28);width:1280px;min-height:800px;background:#f3f2f7;border-radius:18px;padding:14px;display:flex;gap:20px;align-items:stretch`
  - **aside** — `width:236px; flex:none; border-radius:20px; background:#fff; padding:24px 14px 16px; display:flex; flex-direction:column; gap:2px`
    - **div** — `display:flex; align-items:center; justify-content:space-between; padding:4px 10px 24px`
      - **svg** 96× viewBox=0 0 472 72 stroke= fill= sw=
      - **svg** 17×17 viewBox=0 0 24 24 stroke=#64626e fill=none sw=1.8
    - **sc-for** [list={{ nav1 }} as=n]
      - **span** « {{ n.l }} » — `display:flex; align-items:center; gap:10px; height:34px; padding:0 12px; border-radius:9px; font:400 13.5px 'Plus Jakarta Sans'; white-space:nowrap; background:{{ n.bg }}; color:{{ n.c }}`
        - **svg** 16×16 viewBox=0 0 24 24 stroke=currentColor fill=none sw=1.7
    - **div** — `height:1px; background:rgba(22,18,40,.08); margin:10px 4px`
    - **sc-for** [list={{ nav2 }} as=n]
      - **span** — `display:flex; align-items:center; gap:10px; height:34px; padding:0 12px; border-radius:9px; font:400 13.5px 'Plus Jakarta Sans'; white-space:nowrap; color:#4a4855`
        - **svg** 16×16 viewBox=0 0 24 24 stroke=currentColor fill=none sw=1.7
        - **span** « {{ n.l }} » — `flex:1`
        - **sc-if** [value={{ n.b }}]
          - **span** « {{ n.b }} » — `min-width:20px; height:20px; border-radius:10px; background:rgba(139,92,246,.12); color:#6a3ee0; font:500 11px/20px 'Plus Jakarta Sans'; text-align:center`
    - **div** — `flex:1`
    - **div** — `display:flex; align-items:center; gap:10px; padding:8px`
      - **span** « GL » — `width:38px; height:38px; border-radius:50%; background:#2a2733; color:#fff; display:flex; align-items:center; justify-content:center; font:600 12px 'Plus Jakarta Sans'; box-shadow:0 0 0 2px #fff,0 0 0 3.5px #8b5cf6`
      - **div** — `display:flex; flex-direction:column`
        - **span** « Gianluca Lo Bianco » — `font:600 14px 'Plus Jakarta Sans'`
        - **span** « Coach » — `font:400 12px 'Plus Jakarta Sans'; color:#64626e`
  - **main** — `flex:1; min-width:0; display:flex; flex-direction:column; gap:16px`
    - **header** — `border-radius:20px; background:#fff; padding:14px 18px 14px 22px; display:flex; align-items:center; gap:10px`
      - **div** — `flex:1; display:flex; flex-direction:column; gap:3px`
        - **a** [href=#] « {{ crumb }} » — `display:flex; align-items:center; gap:6px; font:500 12px 'Plus Jakarta Sans'; color:#64626e`
          - **svg** 12×12 viewBox=0 0 24 24 stroke=currentColor fill=none sw=2
        - **span** « {{ title }} » — `display:flex; align-items:center; gap:10px; font:600 15px 'Plus Jakarta Sans'`
          - **svg** 17×17 viewBox=0 0 24 24 stroke=#6a3ee0 fill=none sw=1.8
      - **span** « Rechercher dans Coory » — `height:32px; width:200px; padding:0 10px; border-radius:9px; box-shadow:inset 0 0 0 1px rgba(22,18,40,.12); background:#f8f7fb; display:flex; align-items:center; gap:7px; font:400 12.5px 'Plus Jakarta Sans'; color:#64626e`
      - **span** « Assistant IA » — `height:32px; padding:0 12px; border-radius:9px; background:#8b5cf6; color:#fff; display:flex; align-items:center; font:500 12.5px 'Plus Jakarta Sans'`
    - **div** — `display:flex; flex-direction:column; gap:16px`
      - **section** — `border-radius:20px; background:#fff; box-shadow:inset 0 0 0 1px rgba(22,18,40,.05); padding:24px; display:flex; flex-direction:column; gap:22px`
        - **sc-if** [value={{ isVar }}]
          - **div** — `padding:12px 14px; border-radius:12px; background:#f5f2fe; display:flex; align-items:center; gap:10px; font:400 13px 'Plus Jakarta Sans'; color:#4a4855`
            - **svg** 15×15 viewBox=0 0 24 24 stroke=#6a3ee0 fill=none sw=1.8
            - **span** « Variante de . L’exercice d’origine reste inchangé. » — `flex:1`
              - **strong** « « Sled push » » — `color:#17151d`
            - **a** [href=#] « Voir l’original » — `font:500 12.5px 'Plus Jakarta Sans'`
        - **label** — `display:flex; flex-direction:column; gap:8px`
          - **span** « Nom de l’exercice » — `font:600 13.5px 'Plus Jakarta Sans'`
          - **input** [placeholder=Ex. Squat goblet value={{ name }} onChange={{ setName }}] — `height:46px; padding:0 14px; border-radius:12px; border:0; background:#f8f7fb; box-shadow:inset 0 0 0 1px rgba(22,18,40,.12); font:400 14px 'Plus Jakarta Sans'; color:#17151d` — états: `style-focus: box-shadow:inset 0 0 0 1.5px #8b5cf6`
        - **div** — `display:flex; flex-direction:column; gap:10px`
          - **span** « Rubrique » — `font:600 13.5px 'Plus Jakarta Sans'`
          - **div** — `display:flex; flex-wrap:wrap; gap:8px`
            - **sc-for** [list={{ rubs }} as=c]
              - **button** [onClick={{ c.on }}] « {{ c.mark }}{{ c.l }} » — `border:0; height:34px; padding:0 14px; border-radius:17px; display:flex; align-items:center; gap:6px; font:500 13px 'Plus Jakarta Sans'; background:{{ c.bg }}; color:{{ c.c }}; box-shadow:{{ c.sh }}`
        - **div** — `display:flex; flex-direction:column; gap:10px`
          - **div** — `display:flex; align-items:baseline; gap:10px`
            - **span** « Groupes musculaires » — `font:600 13.5px 'Plus Jakarta Sans'`
            - **span** « {{ gCount }} » — `font:400 12.5px 'Plus Jakarta Sans'; color:#8b8996`
          - **div** — `display:flex; flex-wrap:wrap; gap:8px`
            - **sc-for** [list={{ groups }} as=c]
              - **button** [onClick={{ c.on }}] « {{ c.mark }}{{ c.l }} » — `border:0; height:34px; padding:0 14px; border-radius:17px; display:flex; align-items:center; gap:6px; font:500 13px 'Plus Jakarta Sans'; background:{{ c.bg }}; color:{{ c.c }}; box-shadow:{{ c.sh }}`
        - **div** — `display:flex; flex-direction:column; gap:8px`
          - **span** « Matériel » — `font:600 13.5px 'Plus Jakarta Sans'`
          - **span** — `height:46px; padding:0 14px; border-radius:12px; background:#f8f7fb; box-shadow:inset 0 0 0 1px rgba(22,18,40,.12); display:flex; align-items:center; font:400 14px 'Plus Jakarta Sans'`
            - **span** « {{ mat }} » — `flex:1`
            - **svg** 14×14 viewBox=0 0 24 24 stroke=#64626e fill=none sw=2
        - **label** — `display:flex; flex-direction:column; gap:8px`
          - **span** « Consignes » — `font:600 13.5px 'Plus Jakarta Sans'`
          - **textarea** [placeholder=Tiens-toi debout, pieds à largeur de hanches.
Descends en gardant l…] — `min-height:140px; padding:12px 14px; border-radius:12px; border:0; background:#f8f7fb; box-shadow:inset 0 0 0 1px rgba(22,18,40,.12); font:400 14px/1.55 'Plus Jakarta Sans'; color:#17151d`
          - **span** « Une étape par ligne. Le sportif les voit dans son programme. » — `font:400 12px 'Plus Jakarta Sans'; color:#8b8996`
      - **aside** — `border-radius:20px; background:#fff; box-shadow:inset 0 0 0 1px rgba(22,18,40,.05); padding:18px 22px; display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1.4fr) 190px 120px; align-items:center; gap:12px 24px`
        - **span** « APERÇU » — `grid-column:1 / -1; font:600 11.5px 'Plus Jakarta Sans'; letter-spacing:.06em; color:#8b8996`
        - **div** — `display:flex; flex-direction:column; gap:6px`
          - **span** « {{ nameShown }} » — `font:600 16px 'Plus Jakarta Sans'`
          - **span** « {{ rub }} » — `align-self:flex-start; height:24px; padding:0 10px; border-radius:12px; background:#f5f2fe; color:#6a3ee0; font:500 12px/24px 'Plus Jakarta Sans'`
        - **div** — `display:flex; flex-direction:column; gap:8px; border-left:1px solid rgba(22,18,40,.07); font:400 13px 'Plus Jakarta Sans'`
          - **div** — `display:flex; justify-content:space-between; gap:10px`
            - **span** « Muscles » — `color:#64626e`
            - **span** « {{ gList }} » — `text-align:right`
          - **div** — `display:flex; justify-content:space-between; gap:10px`
            - **span** « Matériel » — `color:#64626e`
            - **span** « {{ mat }} » — `text-align:right`
        - **span** « {{ cta }} » — `height:42px; border-radius:11px; background:#17151d; color:#fff; display:flex; align-items:center; justify-content:center; font:600 14px 'Plus Jakarta Sans'`
        - **span** « Annuler » — `height:42px; border-radius:11px; box-shadow:inset 0 0 0 1px rgba(22,18,40,.14); display:flex; align-items:center; justify-content:center; font:500 14px 'Plus Jakarta Sans'`

## Artboard « Exercice mobile »

- **artboard** — `position:relative;width:390px;height:844px;border-radius:44px;background:#f3f2f7;box-shadow:0 0 0 1px rgba(22,18,40,.16),0 24px 60px -24px rgba(22,18,40,.28);overflow:hidden;display:flex;flex-direction:column`
  - **div** — `height:50px; flex:none; display:flex; align-items:center; justify-content:space-between; padding:6px 30px 0; font:600 15px 'Plus Jakarta Sans'`
    - **span** « 9:41 »
    - **span** « 5G ▮ » — `font:600 12px 'Plus Jakarta Sans'`
  - **div** — `flex:none; display:flex; align-items:center; gap:10px; padding:8px 16px 12px`
    - **span** [aria-label=Retour] — `width:44px; height:44px; border-radius:13px; background:#fff; display:flex; align-items:center; justify-content:center; box-shadow:0 1px 2px rgba(22,18,40,.06)`
      - **svg** 18×18 viewBox=0 0 24 24 stroke=currentColor fill=none sw=2
    - **div** — `flex:1; min-width:0; display:flex; flex-direction:column; gap:1px`
      - **span** « {{ crumb }} » — `font:500 12px 'Plus Jakarta Sans'; color:#64626e`
      - **span** « {{ title }} » — `font:600 16px 'Plus Jakarta Sans'`
  - **div** — `flex:1; min-height:0; overflow-y:auto; padding:0 12px 110px; display:flex; flex-direction:column; gap:12px`
    - **sc-if** [value={{ isVar }}]
      - **div** — `padding:12px 14px; border-radius:16px; background:#fff; display:flex; align-items:center; gap:10px; font:400 13.5px 'Plus Jakarta Sans'; color:#4a4855`
        - **svg** 16×16 viewBox=0 0 24 24 stroke=#6a3ee0 fill=none sw=1.8
        - **span** « Variante de » — `flex:1`
          - **strong** « « Sled push » » — `color:#17151d`
        - **a** [href=#] « Original » — `font:500 13px 'Plus Jakarta Sans'`
    - **div** — `border-radius:22px; background:#fff; padding:18px 16px; display:flex; flex-direction:column; gap:18px`
      - **label** — `display:flex; flex-direction:column; gap:8px`
        - **span** « Nom de l’exercice » — `font:600 14px 'Plus Jakarta Sans'`
        - **input** [placeholder=Ex. Squat goblet value={{ name }} onChange={{ setName }}] — `height:48px; padding:0 14px; border-radius:12px; border:0; background:#f8f7fb; box-shadow:inset 0 0 0 1px rgba(22,18,40,.12); font:400 16px 'Plus Jakarta Sans'; color:#17151d`
      - **div** — `display:flex; flex-direction:column; gap:10px`
        - **span** « Rubrique » — `font:600 14px 'Plus Jakarta Sans'`
        - **div** — `display:flex; flex-wrap:wrap; gap:8px`
          - **sc-for** [list={{ rubs }} as=c]
            - **button** [onClick={{ c.on }}] « {{ c.mark }}{{ c.l }} » — `border:0; height:40px; padding:0 15px; border-radius:20px; font:500 14px 'Plus Jakarta Sans'; background:{{ c.bg }}; color:{{ c.c }}; box-shadow:{{ c.sh }}`
      - **div** — `display:flex; flex-direction:column; gap:10px`
        - **div** — `display:flex; align-items:baseline; justify-content:space-between`
          - **span** « Groupes musculaires » — `font:600 14px 'Plus Jakarta Sans'`
          - **span** « {{ gCount }} » — `font:400 12.5px 'Plus Jakarta Sans'; color:#8b8996`
        - **div** — `display:flex; flex-wrap:wrap; gap:8px`
          - **sc-for** [list={{ groups }} as=c]
            - **button** [onClick={{ c.on }}] « {{ c.mark }}{{ c.l }} » — `border:0; height:40px; padding:0 15px; border-radius:20px; font:500 14px 'Plus Jakarta Sans'; background:{{ c.bg }}; color:{{ c.c }}; box-shadow:{{ c.sh }}`
      - **div** — `display:flex; flex-direction:column; gap:8px`
        - **span** « Matériel » — `font:600 14px 'Plus Jakarta Sans'`
        - **span** — `height:48px; padding:0 14px; border-radius:12px; background:#f8f7fb; box-shadow:inset 0 0 0 1px rgba(22,18,40,.12); display:flex; align-items:center; font:400 16px 'Plus Jakarta Sans'`
          - **span** « {{ mat }} » — `flex:1`
          - **svg** 14×14 viewBox=0 0 24 24 stroke=#64626e fill=none sw=2
      - **label** — `display:flex; flex-direction:column; gap:8px`
        - **span** « Consignes » — `font:600 14px 'Plus Jakarta Sans'`
        - **textarea** [placeholder=Tiens-toi debout, pieds à largeur de hanches.
Descends en gardant l…] — `min-height:130px; padding:12px 14px; border-radius:12px; border:0; background:#f8f7fb; box-shadow:inset 0 0 0 1px rgba(22,18,40,.12); font:400 16px/1.5 'Plus Jakarta Sans'; color:#17151d`
        - **span** « Une étape par ligne. » — `font:400 13px 'Plus Jakarta Sans'; color:#8b8996`
  - **div** — `position:absolute; left:0; right:0; bottom:0; padding:12px 16px 30px; background:linear-gradient(rgba(243,242,247,0),#f3f2f7 30%); display:flex; gap:10px`
    - **span** « Annuler » — `height:54px; padding:0 20px; border-radius:15px; background:#fff; box-shadow:inset 0 0 0 1px rgba(22,18,40,.12); display:flex; align-items:center; font:500 15px 'Plus Jakarta Sans'`
    - **span** « {{ cta }} » — `flex:1; height:54px; border-radius:15px; background:#17151d; color:#fff; display:flex; align-items:center; justify-content:center; font:600 16px 'Plus Jakarta Sans'; box-shadow:0 12px 28px -10px rgba(22,18,40,.45)`

