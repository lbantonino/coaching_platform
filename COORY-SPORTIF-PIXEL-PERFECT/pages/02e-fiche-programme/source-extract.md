# Extrait source exact — Onglet « programme » de la fiche sportif

Généré automatiquement depuis `CooryFicheSportif.dc.html` (source de vérité visuelle). Chaque ligne = un élément, indentation = imbrication. Les styles sont **exacts** (valeurs CSS inline des maquettes). Les `{{ … }}` sont des valeurs dynamiques calculées dans la logique (voir `reference/source/`). `<sc-for>` = boucle, `<sc-if>` = affichage conditionnel, `<dc-import>` = sous-composant.

```html
<sc-if value="{{ is_programme }}">
  <section style="border-radius:20px;background:#fff;box-shadow:inset 0 0 0 1px rgba(22,18,40,.05);padding:22px;display:flex;flex-direction:column;gap:16px;min-width:0;max-width:760px">
    <div style="display:flex;flex-direction:column;gap:4px">
      <span style="font:600 17px 'Plus Jakarta Sans'">
        « Prépa Hyrox Bruxelles · bloc 1 »
      <span style="font:400 13.5px 'Plus Jakarta Sans';color:#64626e">
        « Objectif : Hyrox Bruxelles · Pro »
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px">
      <div style="padding:12px 14px;border-radius:12px;background:#f8f7fb;display:flex;flex-direction:column;gap:3px">
        <span style="font:400 12.5px 'Plus Jakarta Sans';color:#64626e">
          « Période »
        <span style="font:500 14px 'Plus Jakarta Sans'">
          « 26 oct. → 17 janv. »
      <div style="padding:12px 14px;border-radius:12px;background:#f8f7fb;display:flex;flex-direction:column;gap:3px">
        <span style="font:400 12.5px 'Plus Jakarta Sans';color:#64626e">
          « Durée »
        <span style="font:500 14px 'Plus Jakarta Sans'">
          « 12 semaines »
      <div style="padding:12px 14px;border-radius:12px;background:#f8f7fb;display:flex;flex-direction:column;gap:3px">
        <span style="font:400 12.5px 'Plus Jakarta Sans';color:#64626e">
          « Séances »
        <span style="font:500 14px 'Plus Jakarta Sans'">
          « 60 »
      <div style="padding:12px 14px;border-radius:12px;background:#f8f7fb;display:flex;flex-direction:column;gap:3px">
        <span style="font:400 12.5px 'Plus Jakarta Sans';color:#64626e">
          « Version »
        <span style="font:500 14px 'Plus Jakarta Sans'">
          « Publiée n° 1 »
    <span style="flex:none;height:38px;padding:0 14px;border-radius:10px;box-shadow:inset 0 0 0 1px rgba(22,18,40,.14);display:flex;align-items:center;gap:7px;font:500 13.5px 'Plus Jakarta Sans';white-space:nowrap">
      « Voir le programme semaine par semaine »
```
