# Extrait source exact — En-tête de la fiche sportif + barre d’onglets (desktop) + sélecteur d’onglet (mobile) — commun à 2a,2b,2c,2e→2k

Généré automatiquement depuis `CooryFicheSportif.dc.html` (source de vérité visuelle). Chaque ligne = un élément, indentation = imbrication. Les styles sont **exacts** (valeurs CSS inline des maquettes). Les `{{ … }}` sont des valeurs dynamiques calculées dans la logique (voir `reference/source/`). `<sc-for>` = boucle, `<sc-if>` = affichage conditionnel, `<dc-import>` = sous-composant.

```html
<helmet>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    « body{margin:0;background:#f3f2f7}*{box-sizing:border-box}a{color:#6a3ee0;text-decoration:none}a:hover{color:#8b5cf6}input::placeholder,textarea::placeholder{color:#8b8996} »
<div style="display:flex;flex-direction:column;gap:14px;width:100%;height:100%;max-width:1600px;margin:0 auto;font-family:'Plus Jakarta Sans',system-ui,sans-serif;color:#17151d;min-width:0">
  <sc-if value="{{ isD }}" hint-placeholder-val="{{ true }}">
    <section style="border-radius:20px;background:#fff;box-shadow:inset 0 0 0 1px rgba(22,18,40,.05);padding:20px 22px;display:flex;flex-wrap:wrap;align-items:center;gap:16px">
      <span style="width:60px;height:60px;flex:none;border-radius:50%;background:#f0e5d6;display:flex;align-items:center;justify-content:center;font:600 19px 'Plus Jakarta Sans';color:#2a2733">
        « IB »
      <div style="flex:1 1 200px;display:flex;flex-direction:column;gap:6px;min-width:0">
        <div style="display:flex;align-items:center;gap:8px">
          <h1 style="margin:0;font:600 26px/1.15 'Plus Jakarta Sans';letter-spacing:-.025em;white-space:nowrap">
            « Inès Benali »
          <span style="width:22px;height:22px;border-radius:50%;background:rgba(194,38,107,.10);color:#c2266b;display:flex;align-items:center;justify-content:center;font:500 13px 'Plus Jakarta Sans'">
            « ♀ »
        <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;font:400 13.5px 'Plus Jakarta Sans';color:#4a4855">
          <span style="display:flex;align-items:center;gap:6px">
            <span style="width:7px;height:7px;flex:none;border-radius:50%;background:#15803d">
            « Actif »
          <span style="color:#c9c7d1">
            « · »
          <span>
            « Confirmé »
          <span style="color:#c9c7d1">
            « · »
          <span style="display:flex;align-items:center;gap:6px">
            <span style="width:7px;height:7px;flex:none;border-radius:50%;background:#FEC14F">
            « Hyrox »
      <span style="height:40px;padding:0 14px;border-radius:11px;box-shadow:inset 0 0 0 1px rgba(22,18,40,.14);display:flex;align-items:center;gap:8px;font:500 14px 'Plus Jakarta Sans'">
        [icône SVG] <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8.5 8.5 0 0 1-12.4 7.5L3 21l1.5-5.6A8.5 8.5 0 1 1 21 12z"></path></svg>
        « Écrire »
    <div role="tablist" style="display:flex;gap:2px;padding:4px;border-radius:14px;background:#e8e7ee;overflow-x:auto;scrollbar-width:none">
      <sc-for list="{{ tabs }}" as="t" hint-placeholder-count="10">
        <button type="button" role="tab" onClick="{{ t.on }}" aria-selected="{{ t.sel }}" style="flex:1 0 auto;cursor:pointer;border:0;height:38px;padding:0 14px;border-radius:10px;font:500 13.5px 'Plus Jakarta Sans';white-space:nowrap;background:{{ t.bg }};color:{{ t.c }};box-shadow:{{ t.sh }}">
          « {{ t.l }} »
  <sc-if value="{{ isM }}">
    <div style="position:relative;border-radius:20px;background:#fff;box-shadow:inset 0 0 0 1px rgba(22,18,40,.05)">
      <div style="display:flex;align-items:center;gap:12px;padding:16px 16px 14px 20px">
        <span style="position:relative;width:46px;height:46px;flex:none;border-radius:50%;background:#f0e5d6;display:flex;align-items:center;justify-content:center;font:600 15px 'Plus Jakarta Sans';color:#2a2733">
          « IB »
          <span style="position:absolute;right:0;bottom:0;width:12px;height:12px;border-radius:50%;background:#15803d;box-shadow:0 0 0 2.5px #fff">
        <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px">
          <span style="display:flex;align-items:center;gap:6px;font:600 16.5px 'Plus Jakarta Sans';letter-spacing:-.01em;white-space:nowrap">
            « Inès Benali »
            <span style="font:500 12px 'Plus Jakarta Sans';color:#c2266b">
              « ♀ »
          <span style="display:flex;align-items:center;gap:6px;font:400 13px 'Plus Jakarta Sans';color:#64626e;white-space:nowrap">
            « Confirmé · »
            <span style="width:6px;height:6px;border-radius:50%;background:#FEC14F">
            « Hyrox »
        <span aria-label="Écrire" style="width:44px;height:44px;flex:none;border-radius:13px;background:#f3f2f7;display:flex;align-items:center;justify-content:center">
          [icône SVG] <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8.5 8.5 0 0 1-12.4 7.5L3 21l1.5-5.6A8.5 8.5 0 1 1 21 12z"></path></svg>
      <button type="button" onClick="{{ vToggle }}" aria-expanded="{{ vExp }}" style="cursor:pointer;width:100%;min-height:54px;padding:0 16px 0 20px;border:0;border-top:1px solid rgba(22,18,40,.07);border-radius:0 0 20px 20px;background:{{ vBg }};display:flex;align-items:center;gap:10px;text-align:left;color:#17151d">
        [icône SVG] <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6a3ee0" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"></path></svg>
        <span style="flex:1;font:600 15px 'Plus Jakarta Sans'">
          « {{ vCur }} »
        <span style="font:500 12.5px 'Plus Jakarta Sans';color:#8b8996;white-space:nowrap">
          « {{ vIdx }} »
        [icône SVG] <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64626e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform:{{ vRot }};transition:transform .2s"><path d="M6 9l6 6 6-6"></path></svg>
      <sc-if value="{{ vOpen }}">
        <div style="position:absolute;left:0;right:0;top:calc(100% + 6px);z-index:5;padding:6px;border-radius:18px;background:#fff;box-shadow:0 16px 36px rgba(22,18,40,.16),0 0 0 1px rgba(22,18,40,.06);display:grid;grid-template-columns:1fr 1fr;gap:4px">
          <sc-for list="{{ tabs }}" as="t" hint-placeholder-count="10">
            <button type="button" onClick="{{ t.pick }}" style="cursor:pointer;border:0;min-height:46px;padding:0 12px;border-radius:11px;text-align:left;font:500 14px 'Plus Jakarta Sans';white-space:nowrap;background:{{ t.mbg }};color:{{ t.mc }}">
              « {{ t.l }} »
```
