# Extrait source exact — Onglet « historique » de la fiche sportif

Généré automatiquement depuis `CooryFicheSportif.dc.html` (source de vérité visuelle). Chaque ligne = un élément, indentation = imbrication. Les styles sont **exacts** (valeurs CSS inline des maquettes). Les `{{ … }}` sont des valeurs dynamiques calculées dans la logique (voir `reference/source/`). `<sc-for>` = boucle, `<sc-if>` = affichage conditionnel, `<dc-import>` = sous-composant.

```html
<sc-if value="{{ is_historique }}">
  <section style="flex:1;border-radius:20px;background:#fff;box-shadow:inset 0 0 0 1px rgba(22,18,40,.05);padding:22px;display:flex;flex-direction:column;gap:16px;min-width:0">
    <div style="display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:12px">
      <div style="flex:1 1 280px;display:flex;flex-direction:column;gap:4px;min-width:0">
        <span style="font:600 17px 'Plus Jakarta Sans';letter-spacing:-.01em;white-space:nowrap">
          « Historique »
        <span style="font:400 13.5px/1.5 'Plus Jakarta Sans';color:#64626e;text-wrap:pretty">
          « Tout ce qui s’est passé sur cette fiche, du plus récent au plus ancien. »
      <button type="button" onClick="{{ histToggle }}" aria-expanded="{{ histExp }}" style="cursor:pointer;border:0;flex:none;height:34px;padding:0 12px;border-radius:10px;background:#fff;box-shadow:inset 0 0 0 1px rgba(22,18,40,.14);display:flex;align-items:center;gap:6px;font:500 13px 'Plus Jakarta Sans';color:#17151d;white-space:nowrap">
        « {{ histBtn }} »
        [icône SVG] <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform:{{ histRot }};transition:transform .2s"><path d="M6 9l6 6 6-6"></path></svg>
    <div style="display:flex;flex-direction:column">
      <sc-for list="{{ histShown }}" as="h" hint-placeholder-count="5">
        <div style="display:grid;grid-template-columns:32px minmax(0,1fr);column-gap:12px;position:relative">
          <span style="position:relative;display:flex;justify-content:center">
            <span style="position:absolute;top:36px;bottom:0;left:15.5px;width:1px;background:#e6e4ec;display:{{ h.line }}">
            <span style="width:32px;height:32px;border-radius:50%;background:#f3f2f7;display:flex;align-items:center;justify-content:center;color:#4a4855">
              [icône SVG] <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="{{ h.d }}"></path></svg>
          <div style="display:flex;flex-direction:column;gap:2px;padding:5px 0 18px;min-width:0">
            <div style="display:flex;flex-wrap:wrap;justify-content:space-between;column-gap:12px;row-gap:2px">
              <span style="flex:1 1 220px;font:600 14px/1.4 'Plus Jakarta Sans'">
                « {{ h.t }} »
              <span style="font:400 12.5px 'Plus Jakarta Sans';color:#8b8996;white-space:nowrap">
                « {{ h.date }} »
            <sc-if value="{{ h.hasS }}">
              <span style="font:400 13px/1.45 'Plus Jakarta Sans';color:#64626e">
                « {{ h.s }} »
```
