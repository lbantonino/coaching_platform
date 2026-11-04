# 10 · Nouveau sportif — mesures extraites du fichier source

> **Valeurs EXACTES** lues dans les styles inline de `source-design-files/pages/10-nouveau-sportif/Coory Nouveau Sportif.dc.html` (aucune estimation). Les valeurs entre `{{ }}` sont dynamiques (calculées dans `logic.js`).
> Arborescence : un niveau d’indentation = un niveau DOM. `sc-for` = liste répétée (`list` = source, `as` = variable), `sc-if` = bloc conditionnel (`value`).
> Police partout : **Plus Jakarta Sans**. Le cadre de l’artboard (box-shadow externe, border-radius 18/44 px) est un artefact de présentation : ne pas le reproduire dans l’app.
> Les `span` sans handler sont des boutons/champs statiques dans la maquette : dans l’app ce sont des `button`/`input` réels.

## Artboard « Nouveau sportif desktop »

- **artboard** — `box-shadow:0 0 0 1px rgba(22,18,40,.16),0 24px 60px -24px rgba(22,18,40,.28);width:1280px;background:#f3f2f7;border-radius:18px;padding:14px;display:flex;gap:20px;align-items:flex-start`
  - **aside** — `width:236px; flex:none; height:772px; position:sticky; top:14px; border-radius:20px; background:#fff; padding:24px 14px 16px; display:flex; flex-direction:column; gap:2px`
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
        - **a** [href=#] « Sportifs » — `display:flex; align-items:center; gap:6px; font:500 12px 'Plus Jakarta Sans'; color:#64626e`
          - **svg** 12×12 viewBox=0 0 24 24 stroke=currentColor fill=none sw=2
        - **span** « Nouveau sportif » — `font:600 15px 'Plus Jakarta Sans'`
      - **span** « Rechercher dans Coory » — `height:32px; width:200px; padding:0 10px; border-radius:9px; box-shadow:inset 0 0 0 1px rgba(22,18,40,.12); background:#f8f7fb; display:flex; align-items:center; font:400 12.5px 'Plus Jakarta Sans'; color:#64626e`
      - **span** « Assistant IA » — `height:32px; padding:0 12px; border-radius:9px; background:#8b5cf6; color:#fff; display:flex; align-items:center; font:500 12.5px 'Plus Jakarta Sans'`
    - **div** — `display:flex; flex-direction:column; gap:14px`
      - **div** — `display:flex; flex-direction:column; gap:14px`
        - **sc-for** [list={{ sections }} as=sec]
          - **section** — `border-radius:20px; background:#fff; box-shadow:inset 0 0 0 1px rgba(22,18,40,.05); padding:22px 24px 24px; display:flex; flex-direction:column; gap:18px`
            - **div** — `display:flex; align-items:center; gap:10px`
              - **span** « {{ sec.n }} » — `width:26px; height:26px; border-radius:8px; background:#f5f2fe; color:#6a3ee0; display:flex; align-items:center; justify-content:center; font:600 12px 'Plus Jakarta Sans'`
              - **span** « {{ sec.t }} » — `font:600 16px 'Plus Jakarta Sans'`
            - **div** — `display:grid; grid-template-columns:1fr 1fr; gap:16px`
              - **sc-for** [list={{ sec.fields }} as=f]
                - **div** — `display:flex; flex-direction:column; gap:8px; grid-column:{{ f.span }}`
                  - **span** « {{ f.l }} » — `font:600 13.5px 'Plus Jakarta Sans'`
                    - **span** « {{ f.opt }} » — `color:#8b8996`
                  - **sc-if** [value={{ f.isInput }}]
                    - **span** — `height:46px; padding:0 14px; border-radius:12px; background:#f8f7fb; box-shadow:inset 0 0 0 1px rgba(22,18,40,.12); display:flex; align-items:center; gap:10px; font:400 14px 'Plus Jakarta Sans'; color:{{ f.vc }}`
                      - **span** « {{ f.v }} » — `flex:1`
                      - **sc-if** [value={{ f.caret }}]
                        - **svg** 14×14 viewBox=0 0 24 24 stroke=#64626e fill=none sw=2
                  - **sc-if** [value={{ f.isArea }}]
                    - **span** « {{ f.v }} » — `min-height:84px; padding:12px 14px; border-radius:12px; background:#f8f7fb; box-shadow:inset 0 0 0 1px rgba(22,18,40,.12); font:400 14px/1.5 'Plus Jakarta Sans'; color:#8b8996`
                  - **sc-if** [value={{ f.isChips }}]
                    - **div** — `display:flex; flex-wrap:wrap; gap:8px`
                      - **sc-for** [list={{ f.opts }} as=c]
                        - **button** [onClick={{ c.on }}] « {{ c.mark }}{{ c.l }} » — `border:0; height:34px; padding:0 14px; border-radius:17px; font:500 13px 'Plus Jakarta Sans'; background:{{ c.bg }}; color:{{ c.c }}; box-shadow:{{ c.sh }}`
                  - **sc-if** [value={{ f.isSeg }}]
                    - **div** — `align-self:flex-start; height:40px; padding:3px; border-radius:11px; background:#f1f0f5; display:flex; gap:2px`
                      - **sc-for** [list={{ f.opts }} as=c]
                        - **button** [onClick={{ c.on }}] « {{ c.l }} » — `border:0; padding:0 16px; border-radius:8px; font:500 13px 'Plus Jakarta Sans'; background:{{ c.sbg }}; color:{{ c.sc }}; box-shadow:{{ c.ssh }}`
                  - **sc-if** [value={{ f.isConsent }}]
                    - **div** — `padding:14px; border-radius:14px; background:#f8f7fb; display:flex; flex-direction:column; gap:12px`
                      - **div** — `display:flex; align-items:center; gap:12px`
                        - **span** « Le sportif m’a donné son accord explicite pour noter ses blessures … » — `flex:1; font:400 13.5px/1.45 'Plus Jakarta Sans'; color:#4a4855`
                        - **button** [onClick={{ toggleConsent }} aria-pressed={{ consentAria }}] — `border:0; width:44px; height:26px; flex:none; border-radius:13px; padding:3px; display:flex; justify-content:{{ consentJ }}; background:{{ consentBg }}`
                          - **span** — `width:20px; height:20px; border-radius:10px; background:#fff; box-shadow:0 1px 2px rgba(0,0,0,.2)`
                      - **sc-if** [value={{ consent }}]
                        - **span** « Ex. : douleur genou droit en descente » — `min-height:72px; padding:12px 14px; border-radius:12px; background:#fff; box-shadow:inset 0 0 0 1px rgba(22,18,40,.12); font:400 14px 'Plus Jakarta Sans'; color:#8b8996`
                  - **sc-if** [value={{ f.help }}]
                    - **span** « {{ f.help }} » — `font:400 12px/1.45 'Plus Jakarta Sans'; color:#8b8996`
      - **aside** — `display:grid; grid-template-columns:minmax(0,1fr) 280px; gap:8px 16px; align-items:center`
        - **div** — `grid-row:1 / 3; border-radius:20px; background:#fff; padding:16px 18px; display:flex; flex-direction:column; gap:8px`
          - **span** « Données de santé » — `display:flex; align-items:center; gap:8px; font:600 14px 'Plus Jakarta Sans'`
            - **svg** 15×15 viewBox=0 0 24 24 stroke=#11867a fill=none sw=2
          - **span** « Les blessures ne se notent qu’avec l’accord explicite du sportif. I… » — `font:400 12.5px/1.5 'Plus Jakarta Sans'; color:#64626e`
        - **span** « Enregistrer le sportif » — `height:46px; border-radius:12px; background:#17151d; color:#fff; display:flex; align-items:center; justify-content:center; font:600 14.5px 'Plus Jakarta Sans'`
        - **span** « Seul le prénom est obligatoire. » — `font:400 12px 'Plus Jakarta Sans'; color:#8b8996; text-align:center`

## Artboard « Nouveau sportif mobile »

- **artboard** — `position:relative;width:390px;height:844px;border-radius:44px;background:#f3f2f7;box-shadow:0 0 0 1px rgba(22,18,40,.16),0 24px 60px -24px rgba(22,18,40,.28);overflow:hidden;display:flex;flex-direction:column`
  - **div** — `height:50px; flex:none; display:flex; align-items:center; justify-content:space-between; padding:6px 30px 0; font:600 15px 'Plus Jakarta Sans'`
    - **span** « 9:41 »
    - **span** « 5G ▮ » — `font:600 12px 'Plus Jakarta Sans'`
  - **div** — `flex:none; display:flex; align-items:center; gap:10px; padding:8px 16px 12px`
    - **span** [aria-label=Retour] — `width:44px; height:44px; border-radius:13px; background:#fff; display:flex; align-items:center; justify-content:center`
      - **svg** 18×18 viewBox=0 0 24 24 stroke=currentColor fill=none sw=2
    - **div** — `flex:1; display:flex; flex-direction:column; gap:1px`
      - **span** « Nouveau sportif » — `font:600 16px 'Plus Jakarta Sans'`
  - **div** — `flex:1; min-height:0; overflow-y:auto; padding:0 12px 110px; display:flex; flex-direction:column; gap:12px`
    - **sc-for** [list={{ sections }} as=sec]
      - **section** — `border-radius:22px; background:#fff; padding:18px 16px; display:flex; flex-direction:column; gap:16px`
        - **div** — `display:flex; align-items:center; gap:10px`
          - **span** « {{ sec.n }} » — `width:26px; height:26px; border-radius:8px; background:#f5f2fe; color:#6a3ee0; display:flex; align-items:center; justify-content:center; font:600 12px 'Plus Jakarta Sans'`
          - **span** « {{ sec.t }} » — `font:600 16px 'Plus Jakarta Sans'`
        - **sc-for** [list={{ sec.fields }} as=f]
          - **div** — `display:flex; flex-direction:column; gap:8px`
            - **span** « {{ f.l }} » — `font:600 14px 'Plus Jakarta Sans'`
              - **span** « {{ f.opt }} » — `color:#8b8996`
            - **sc-if** [value={{ f.isInput }}]
              - **span** — `height:48px; padding:0 14px; border-radius:12px; background:#f8f7fb; box-shadow:inset 0 0 0 1px rgba(22,18,40,.12); display:flex; align-items:center; font:400 16px 'Plus Jakarta Sans'; color:{{ f.vc }}`
                - **span** « {{ f.v }} » — `flex:1`
                - **sc-if** [value={{ f.caret }}]
                  - **svg** 14×14 viewBox=0 0 24 24 stroke=#64626e fill=none sw=2
            - **sc-if** [value={{ f.isArea }}]
              - **span** « {{ f.v }} » — `min-height:88px; padding:12px 14px; border-radius:12px; background:#f8f7fb; box-shadow:inset 0 0 0 1px rgba(22,18,40,.12); font:400 15px/1.5 'Plus Jakarta Sans'; color:#8b8996`
            - **sc-if** [value={{ f.isChips }}]
              - **div** — `display:flex; flex-wrap:wrap; gap:8px`
                - **sc-for** [list={{ f.opts }} as=c]
                  - **button** [onClick={{ c.on }}] « {{ c.mark }}{{ c.l }} » — `border:0; height:40px; padding:0 15px; border-radius:20px; font:500 14px 'Plus Jakarta Sans'; background:{{ c.bg }}; color:{{ c.c }}; box-shadow:{{ c.sh }}`
            - **sc-if** [value={{ f.isSeg }}]
              - **div** — `height:44px; padding:3px; border-radius:12px; background:#f1f0f5; display:grid; grid-template-columns:repeat(3,1fr); gap:2px`
                - **sc-for** [list={{ f.opts }} as=c]
                  - **button** [onClick={{ c.on }}] « {{ c.l }} » — `border:0; border-radius:9px; font:500 14px 'Plus Jakarta Sans'; background:{{ c.sbg }}; color:{{ c.sc }}; box-shadow:{{ c.ssh }}`
            - **sc-if** [value={{ f.isConsent }}]
              - **div** — `padding:14px; border-radius:14px; background:#f8f7fb; display:flex; align-items:center; gap:12px`
                - **span** « Accord explicite du sportif » — `flex:1; font:400 14px/1.45 'Plus Jakarta Sans'; color:#4a4855`
                - **button** [onClick={{ toggleConsent }} aria-pressed={{ consentAria }}] — `border:0; width:48px; height:28px; flex:none; border-radius:14px; padding:3px; display:flex; justify-content:{{ consentJ }}; background:{{ consentBg }}`
                  - **span** — `width:22px; height:22px; border-radius:11px; background:#fff`
            - **sc-if** [value={{ f.help }}]
              - **span** « {{ f.help }} » — `font:400 13px/1.45 'Plus Jakarta Sans'; color:#8b8996`
  - **div** — `position:absolute; left:0; right:0; bottom:0; padding:12px 16px 30px; background:linear-gradient(rgba(243,242,247,0),#f3f2f7 30%)`
    - **span** « Enregistrer le sportif » — `height:54px; border-radius:15px; background:#17151d; color:#fff; display:flex; align-items:center; justify-content:center; font:600 16px 'Plus Jakarta Sans'; box-shadow:0 12px 28px -10px rgba(22,18,40,.45)`

