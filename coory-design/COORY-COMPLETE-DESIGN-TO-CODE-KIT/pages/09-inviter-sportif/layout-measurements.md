# 09 · Inviter un sportif — mesures extraites du fichier source

> **Valeurs EXACTES** lues dans les styles inline de `source-design-files/pages/09-inviter-sportif/Coory Inviter.dc.html` (aucune estimation). Les valeurs entre `{{ }}` sont dynamiques (calculées dans `logic.js`).
> Arborescence : un niveau d’indentation = un niveau DOM. `sc-for` = liste répétée (`list` = source, `as` = variable), `sc-if` = bloc conditionnel (`value`).
> Police partout : **Plus Jakarta Sans**. Le cadre de l’artboard (box-shadow externe, border-radius 18/44 px) est un artefact de présentation : ne pas le reproduire dans l’app.
> Les `span` sans handler sont des boutons/champs statiques dans la maquette : dans l’app ce sont des `button`/`input` réels.

## Artboard « Inviter desktop »

- **artboard** — `box-shadow:0 0 0 1px rgba(22,18,40,.16),0 24px 60px -24px rgba(22,18,40,.28);width:1280px;height:800px;background:#f3f2f7;border-radius:18px;padding:14px;display:flex;gap:20px`
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
        - **a** [href=#] « Sportifs · {{ st.name }} » — `display:flex; align-items:center; gap:6px; font:500 12px 'Plus Jakarta Sans'; color:#64626e`
          - **svg** 12×12 viewBox=0 0 24 24 stroke=currentColor fill=none sw=2
        - **span** « Inviter {{ st.name }} » — `font:600 15px 'Plus Jakarta Sans'`
      - **span** « Rechercher dans Coory » — `height:32px; width:200px; padding:0 10px; border-radius:9px; box-shadow:inset 0 0 0 1px rgba(22,18,40,.12); background:#f8f7fb; display:flex; align-items:center; font:400 12.5px 'Plus Jakarta Sans'; color:#64626e`
      - **span** « Assistant IA » — `height:32px; padding:0 12px; border-radius:9px; background:#8b5cf6; color:#fff; display:flex; align-items:center; font:500 12.5px 'Plus Jakarta Sans'`
    - **div** — `flex:1; display:flex; justify-content:center`
      - **section** — `width:560px; border-radius:20px; background:#fff; box-shadow:inset 0 0 0 1px rgba(22,18,40,.05); padding:26px; display:flex; flex-direction:column; gap:20px; align-self:flex-start`
        - **div** — `display:flex; align-items:center; gap:14px`
          - **span** « {{ st.ini }} » — `width:52px; height:52px; flex:none; border-radius:50%; background:{{ st.avBg }}; color:#fff; display:flex; align-items:center; justify-content:center; font:600 16px 'Plus Jakarta Sans'`
          - **div** — `flex:1; min-width:0; display:flex; flex-direction:column; gap:3px`
            - **span** « {{ st.name }} » — `font:600 17px 'Plus Jakarta Sans'`
            - **span** « {{ st.email }} » — `font:400 13px 'Plus Jakarta Sans'; color:#64626e`
          - **span** « {{ st.pill }} » — `height:26px; padding:0 10px; border-radius:13px; display:flex; align-items:center; gap:6px; white-space:nowrap; font:500 12px 'Plus Jakarta Sans'; background:{{ st.pBg }}; color:{{ st.pC }}`
            - **span** — `width:6px; height:6px; border-radius:3px; background:currentColor`
        - **p** « {{ st.text }} » — `margin:0; font:400 14px/1.55 'Plus Jakarta Sans'; color:#4a4855`
        - **sc-if** [value={{ st.isLink }}]
          - **div** — `display:flex; flex-direction:column; gap:10px`
            - **div** — `height:46px; padding:0 6px 0 14px; border-radius:12px; background:#f8f7fb; box-shadow:inset 0 0 0 1px rgba(22,18,40,.12); display:flex; align-items:center; gap:10px`
              - **span** « coory.app/invitation/7f3k-92xa-sophie » — `flex:1; min-width:0; overflow:hidden; white-space:nowrap; font:400 13.5px 'Plus Jakarta Sans'`
              - **span** « Copier le lien » — `height:34px; padding:0 12px; border-radius:9px; background:#17151d; color:#fff; display:flex; align-items:center; font:600 13px 'Plus Jakarta Sans'`
            - **div** — `display:grid; grid-template-columns:repeat(3,1fr); gap:8px`
              - **sc-for** [list={{ shares }} as=s]
                - **span** « {{ s }} » — `height:40px; border-radius:11px; box-shadow:inset 0 0 0 1px rgba(22,18,40,.14); display:flex; align-items:center; justify-content:center; font:500 13px 'Plus Jakarta Sans'`
        - **sc-if** [value={{ st.primary }}]
          - **span** « {{ st.primary }} » — `height:46px; border-radius:12px; background:#17151d; color:#fff; display:flex; align-items:center; justify-content:center; font:600 14.5px 'Plus Jakarta Sans'`
        - **sc-if** [value={{ st.second }}]
          - **span** « {{ st.second }} » — `height:44px; border-radius:12px; box-shadow:inset 0 0 0 1px rgba(22,18,40,.14); display:flex; align-items:center; justify-content:center; font:500 14px 'Plus Jakarta Sans'; color:{{ st.secC }}`
        - **sc-if** [value={{ st.showRules }}]
          - **ul** — `margin:0; padding:16px 0 0; border-top:1px solid rgba(22,18,40,.07); display:flex; flex-direction:column; gap:8px`
            - **sc-for** [list={{ rules }} as=r]
              - **li** « {{ r.l }} » — `display:flex; gap:10px; align-items:center; font:400 13px 'Plus Jakarta Sans'; color:#64626e`
                - **svg** 14×14 viewBox=0 0 24 24 stroke=#6a3ee0 fill=none sw=2

## Artboard « Inviter mobile »

- **artboard** — `position:relative;width:390px;height:844px;border-radius:44px;background:#f3f2f7;box-shadow:0 0 0 1px rgba(22,18,40,.16),0 24px 60px -24px rgba(22,18,40,.28);overflow:hidden;display:flex;flex-direction:column`
  - **div** — `height:50px; flex:none; display:flex; align-items:center; justify-content:space-between; padding:6px 30px 0; font:600 15px 'Plus Jakarta Sans'`
    - **span** « 9:41 »
    - **span** « 5G ▮ » — `font:600 12px 'Plus Jakarta Sans'`
  - **div** — `flex:none; display:flex; align-items:center; gap:10px; padding:8px 16px 12px`
    - **span** [aria-label=Retour] — `width:44px; height:44px; border-radius:13px; background:#fff; display:flex; align-items:center; justify-content:center`
      - **svg** 18×18 viewBox=0 0 24 24 stroke=currentColor fill=none sw=2
    - **div** — `flex:1; display:flex; flex-direction:column; gap:1px`
      - **span** « Inviter {{ st.first }} » — `font:600 16px 'Plus Jakarta Sans'`
  - **div** — `flex:1; padding:0 12px; display:flex; flex-direction:column; gap:12px`
    - **div** — `border-radius:22px; background:#fff; padding:18px 16px; display:flex; flex-direction:column; gap:16px`
      - **div** — `display:flex; align-items:center; gap:12px`
        - **span** « {{ st.ini }} » — `width:48px; height:48px; flex:none; border-radius:50%; background:{{ st.avBg }}; color:#fff; display:flex; align-items:center; justify-content:center; font:600 15px 'Plus Jakarta Sans'`
        - **div** — `flex:1; min-width:0; display:flex; flex-direction:column; gap:2px`
          - **span** « {{ st.name }} » — `font:600 16px 'Plus Jakarta Sans'`
          - **span** « {{ st.email }} » — `font:400 13px 'Plus Jakarta Sans'; color:#64626e; overflow:hidden; white-space:nowrap`
      - **span** « {{ st.pill }} » — `align-self:flex-start; height:28px; padding:0 11px; border-radius:14px; display:flex; align-items:center; gap:6px; font:500 12.5px 'Plus Jakarta Sans'; background:{{ st.pBg }}; color:{{ st.pC }}`
        - **span** — `width:6px; height:6px; border-radius:3px; background:currentColor`
      - **p** « {{ st.text }} » — `margin:0; font:400 14.5px/1.55 'Plus Jakarta Sans'; color:#4a4855`
      - **sc-if** [value={{ st.isLink }}]
        - **div** — `display:flex; flex-direction:column; gap:10px`
          - **div** « coory.app/invitation/7f3k-92xa… » — `height:48px; padding:0 14px; border-radius:12px; background:#f8f7fb; box-shadow:inset 0 0 0 1px rgba(22,18,40,.12); display:flex; align-items:center; font:400 14px 'Plus Jakarta Sans'; overflow:hidden; white-space:nowrap`
          - **div** — `display:grid; grid-template-columns:repeat(3,1fr); gap:8px`
            - **sc-for** [list={{ shares }} as=s]
              - **span** « {{ s }} » — `height:44px; border-radius:12px; box-shadow:inset 0 0 0 1px rgba(22,18,40,.14); display:flex; align-items:center; justify-content:center; font:500 13.5px 'Plus Jakarta Sans'`
      - **sc-if** [value={{ st.second }}]
        - **span** « {{ st.second }} » — `height:44px; display:flex; align-items:center; justify-content:center; font:500 14.5px 'Plus Jakarta Sans'; color:{{ st.secC }}`
    - **sc-if** [value={{ st.showRules }}]
      - **ul** — `margin:0; padding:4px 8px; display:flex; flex-direction:column; gap:8px`
        - **sc-for** [list={{ rules }} as=r]
          - **li** « {{ r.l }} » — `display:flex; gap:10px; align-items:center; font:400 13px 'Plus Jakarta Sans'; color:#64626e`
            - **svg** 14×14 viewBox=0 0 24 24 stroke=#6a3ee0 fill=none sw=2
  - **sc-if** [value={{ st.mPrimary }}]
    - **div** — `position:absolute; left:0; right:0; bottom:0; padding:12px 16px 30px`
      - **span** « {{ st.mPrimary }} » — `height:54px; border-radius:15px; background:#17151d; color:#fff; display:flex; align-items:center; justify-content:center; font:600 16px 'Plus Jakarta Sans'; box-shadow:0 12px 28px -10px rgba(22,18,40,.45)`

