# Extrait source exact — Onglet « agenda » de la fiche sportif

Généré automatiquement depuis `CooryFicheSportif.dc.html` (source de vérité visuelle). Chaque ligne = un élément, indentation = imbrication. Les styles sont **exacts** (valeurs CSS inline des maquettes). Les `{{ … }}` sont des valeurs dynamiques calculées dans la logique (voir `reference/source/`). `<sc-for>` = boucle, `<sc-if>` = affichage conditionnel, `<dc-import>` = sous-composant.

```html
<sc-if value="{{ is_agenda }}">
  <div style="display:flex;flex-direction:column;gap:12px">
    <section style="border-radius:20px;background:#fff;box-shadow:inset 0 0 0 1px rgba(22,18,40,.05);padding:16px 20px;display:flex;flex-wrap:wrap;align-items:center;gap:12px 20px">
      <div style="flex:1 1 260px;min-width:0;display:flex;flex-direction:column;gap:3px">
        <span style="font:600 15.5px 'Plus Jakarta Sans';letter-spacing:-.01em">
          « Prépa Hyrox Bruxelles · bloc 1 »
        <span style="font:400 13px 'Plus Jakarta Sans';color:#64626e">
          « 12 semaines · 26 oct. → 17 janv. · 5 séances par semaine »
      <div style="flex:1 1 300px;min-width:0;display:flex;align-items:flex-start;gap:10px;padding:10px 14px;border-radius:12px;background:#f6f5fa">
        [icône SVG] <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6a3ee0" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex:none"><path d="M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path></svg>
        <span style="font:400 13px/1.5 'Plus Jakarta Sans';color:#4a4855">
          <strong style="font-weight:600;color:#17151d">
            « Dans l’ordre, au jour choisi. »
          « Inès enchaîne les séances 1 → 5 quand elle veut ; seules celles avec le coach ont une date. »
    <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px">
      <div role="tablist" style="display:flex;padding:4px;border-radius:12px;background:#e8e7ee">
        <sc-for list="{{ aModes }}" as="m" hint-placeholder-count="2">
          <button type="button" onClick="{{ m.on }}" aria-selected="{{ m.sel }}" style="cursor:pointer;border:0;height:32px;padding:0 13px;border-radius:9px;font:500 13px 'Plus Jakarta Sans';white-space:nowrap;background:{{ m.bg }};color:{{ m.c }};box-shadow:{{ m.sh }}">
            « {{ m.l }} »
      <sc-if value="{{ aIsWeek }}" hint-placeholder-val="{{ true }}">
        <div style="position:relative;display:flex;align-items:center;gap:6px">
          <button type="button" onClick="{{ wkPrev }}" aria-label="Semaine précédente" style="cursor:pointer;border:0;width:38px;height:38px;flex:none;border-radius:11px;background:#fff;box-shadow:inset 0 0 0 1px rgba(22,18,40,.12);display:flex;align-items:center;justify-content:center;color:{{ wkPrevC }}">
            [icône SVG] <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"></path></svg>
          <button type="button" onClick="{{ wkToggle }}" aria-expanded="{{ wkExp }}" style="cursor:pointer;border:0;height:38px;padding:0 12px 0 14px;border-radius:11px;background:#fff;box-shadow:{{ wkRing }};display:flex;align-items:center;gap:8px;font:600 14px 'Plus Jakarta Sans';color:#17151d;white-space:nowrap">
            « {{ wkLabel }} »
            <span style="font:500 12.5px 'Plus Jakarta Sans';color:#8b8996">
              « / 12 »
            [icône SVG] <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64626e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"></path></svg>
          <button type="button" onClick="{{ wkNext }}" aria-label="Semaine suivante" style="cursor:pointer;border:0;width:38px;height:38px;flex:none;border-radius:11px;background:#fff;box-shadow:inset 0 0 0 1px rgba(22,18,40,.12);display:flex;align-items:center;justify-content:center;color:{{ wkNextC }}">
            [icône SVG] <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"></path></svg>
          <sc-if value="{{ wkOpen }}">
            <div style="position:absolute;right:0;top:46px;z-index:6;width:236px;padding:8px;border-radius:16px;background:#fff;box-shadow:0 16px 36px rgba(22,18,40,.16),0 0 0 1px rgba(22,18,40,.06);display:grid;grid-template-columns:repeat(4,1fr);gap:4px">
              <sc-for list="{{ wkOpts }}" as="o" hint-placeholder-count="12">
                <button type="button" onClick="{{ o.pick }}" aria-label="{{ o.aria }}" style="cursor:pointer;border:0;height:44px;border-radius:10px;font:600 14px 'Plus Jakarta Sans';background:{{ o.bg }};color:{{ o.c }};box-shadow:{{ o.sh }}">
                  « {{ o.n }} »
              <span style="grid-column:1/-1;padding:6px 4px 2px;font:400 12px 'Plus Jakarta Sans';color:#64626e">
                « Contour violet : semaine actuelle d’Inès »
    <sc-if value="{{ wkOther }}">
      <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 12px;padding:10px 14px;border-radius:12px;background:rgba(139,92,246,.07)">
        <span style="font:400 13px/1.45 'Plus Jakarta Sans';color:#4a4855">
          « Tu consultes la »
          <strong style="font-weight:600;color:#17151d">
            « {{ wkLabelLow }} »
          « . Inès est en semaine 2. »
        <button type="button" onClick="{{ wkBack }}" style="cursor:pointer;border:0;background:transparent;padding:0;min-height:32px;font:500 13px 'Plus Jakarta Sans';color:#6a3ee0;white-space:nowrap">
          « Revenir à la semaine 2 »
    <sc-for list="{{ weeksShown }}" as="w" hint-placeholder-count="1">
      <section style="border-radius:20px;background:#fff;box-shadow:{{ w.ring }};padding:18px;display:flex;flex-direction:column;gap:14px;min-width:0">
        <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px">
          <div style="display:flex;flex-direction:column;gap:2px;min-width:0">
            <span style="font:600 15.5px/1.3 'Plus Jakarta Sans';white-space:nowrap">
              « {{ w.title }} »
            <span style="font:400 12.5px/1.4 'Plus Jakarta Sans';color:#64626e">
              « {{ w.sub }} »
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            <sc-if value="{{ w.cur }}">
              <span style="height:24px;padding:0 9px;border-radius:12px;display:flex;align-items:center;font:500 12px 'Plus Jakarta Sans';white-space:nowrap;background:rgba(139,92,246,.10);color:#6a3ee0">
                « Semaine actuelle »
            <span style="height:24px;padding:0 9px;border-radius:12px;display:flex;align-items:center;font:500 12px 'Plus Jakarta Sans';white-space:nowrap;background:#f3f2f7;color:#4a4855">
              « {{ w.ph }} »
        <sc-if value="{{ isD }}" hint-placeholder-val="{{ true }}">
          <div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px">
            <sc-for list="{{ w.ses }}" as="s" hint-placeholder-count="5">
              <div style="min-width:0;border-radius:14px;padding:14px;background:{{ s.bg }};display:flex;flex-direction:column;gap:8px">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
                  <span style="width:26px;height:26px;flex:none;border-radius:50%;background:{{ s.c }};color:{{ s.bc }};display:flex;align-items:center;justify-content:center;font:700 12.5px 'Plus Jakarta Sans'">
                    « {{ s.n }} »
                <span style="font:600 14.5px/1.3 'Plus Jakarta Sans';color:#17151d;overflow-wrap:anywhere">
                  « {{ s.name }} »
                <span style="font:400 12.5px/1.4 'Plus Jakarta Sans';color:#4a4855">
                  <span style="font-weight:600;color:{{ s.tc }}">
                    « {{ s.kind }} »
                  « · {{ s.type }} »
                <sc-if value="{{ s.coach }}">
                  <span style="margin-top:auto;padding-top:8px;border-top:1px solid rgba(22,18,40,.08);display:flex;align-items:flex-start;gap:6px;font:500 12px/1.4 'Plus Jakarta Sans';color:{{ s.wc }}">
                    [icône SVG] <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none"><path d="M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"></path></svg>
                    <span style="min-width:0">
                      « Coach · {{ s.when }} »
        <sc-if value="{{ isM }}">
          <div style="display:flex;flex-direction:column;gap:8px">
            <sc-for list="{{ w.ses }}" as="s" hint-placeholder-count="5">
              <div style="display:flex;align-items:center;gap:14px;min-width:0;border-radius:14px;padding:16px;background:{{ s.bg }}">
                <span style="width:30px;height:30px;flex:none;border-radius:50%;background:{{ s.c }};color:{{ s.bc }};display:flex;align-items:center;justify-content:center;font:700 12.5px 'Plus Jakarta Sans'">
                  « {{ s.n }} »
                <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px">
                  <span style="font:600 15px/1.3 'Plus Jakarta Sans';color:#17151d;overflow-wrap:anywhere">
                    « {{ s.name }} »
                  <span style="font:400 12.5px 'Plus Jakarta Sans';color:#4a4855">
                    « {{ s.kind }} · {{ s.type }} »
                  <sc-if value="{{ s.coach }}">
                    <span style="display:flex;align-items:center;gap:6px;padding-top:3px;font:500 12.5px 'Plus Jakarta Sans';color:{{ s.wc }}">
                      [icône SVG] <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none"><path d="M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"></path></svg>
                      <span style="min-width:0">
                        « Avec le coach · {{ s.when }} »
        <sc-if value="{{ w.comp }}">
          <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:12px;background:rgba(139,92,246,.07);font:500 13px 'Plus Jakarta Sans';color:#6a3ee0">
            [icône SVG] <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V4M4 4h12l-2 4 2 4H4"></path></svg>
            « Compétition · Sam 12 déc. · Hyrox Gent »
```
