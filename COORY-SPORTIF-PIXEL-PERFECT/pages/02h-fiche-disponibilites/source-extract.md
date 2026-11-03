# Extrait source exact — Onglet « dispos » de la fiche sportif

Généré automatiquement depuis `CooryFicheSportif.dc.html` (source de vérité visuelle). Chaque ligne = un élément, indentation = imbrication. Les styles sont **exacts** (valeurs CSS inline des maquettes). Les `{{ … }}` sont des valeurs dynamiques calculées dans la logique (voir `reference/source/`). `<sc-for>` = boucle, `<sc-if>` = affichage conditionnel, `<dc-import>` = sous-composant.

```html
<sc-if value="{{ is_dispos }}">
  <section style="border-radius:20px;background:#fff;box-shadow:inset 0 0 0 1px rgba(22,18,40,.05);padding:22px;display:flex;flex-direction:column;gap:16px;min-width:0;">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
      <div style="flex:1 1 auto;display:flex;flex-direction:column;gap:4px;min-width:0">
        <span style="font:600 17px 'Plus Jakarta Sans';letter-spacing:-.01em;white-space:nowrap">
          « Disponibilités »
        <span style="font:400 13.5px/1.5 'Plus Jakarta Sans';color:#64626e;text-wrap:pretty">
          « Le temps dont le sportif dispose. Ce sont des repères pour construire son programme, pas une prescription. »
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:16px">
      <div style="display:flex;flex-direction:column;gap:8px;min-width:0">
        <span style="font:500 13.5px 'Plus Jakarta Sans'">
          « Séances par semaine »
        <input defaultValue="5" placeholder="" style="border:0;outline:0;width:100%;border-radius:12px;box-shadow:inset 0 0 0 1px rgba(22,18,40,.12);background:#fff;color:#17151d;height:46px;padding:0 14px;font:400 15px 'Plus Jakarta Sans';">
      <div style="display:flex;flex-direction:column;gap:8px;min-width:0">
        <span style="font:500 13.5px 'Plus Jakarta Sans'">
          « Durée maximale d’une séance (min) »
        <input defaultValue="90" placeholder="" style="border:0;outline:0;width:100%;border-radius:12px;box-shadow:inset 0 0 0 1px rgba(22,18,40,.12);background:#fff;color:#17151d;height:46px;padding:0 14px;font:400 15px 'Plus Jakarta Sans';">
      <div style="display:flex;flex-direction:column;gap:8px;min-width:0;grid-column:1/-1">
        <span style="font:500 13.5px 'Plus Jakarta Sans'">
          « Jours disponibles »
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          <span style="height:38px;padding:0 14px;border-radius:19px;display:flex;align-items:center;gap:6px;font:500 13.5px 'Plus Jakarta Sans';white-space:nowrap;background:rgba(139,92,246,.10);color:#6a3ee0;box-shadow:inset 0 0 0 1px rgba(139,92,246,.35)">
            « ✓ Lundi »
          <span style="height:38px;padding:0 14px;border-radius:19px;display:flex;align-items:center;gap:6px;font:500 13.5px 'Plus Jakarta Sans';white-space:nowrap;background:rgba(139,92,246,.10);color:#6a3ee0;box-shadow:inset 0 0 0 1px rgba(139,92,246,.35)">
            « ✓ Mardi »
          <span style="height:38px;padding:0 14px;border-radius:19px;display:flex;align-items:center;gap:6px;font:500 13.5px 'Plus Jakarta Sans';white-space:nowrap;box-shadow:inset 0 0 0 1px rgba(22,18,40,.12);color:#4a4855">
            « Mercredi »
          <span style="height:38px;padding:0 14px;border-radius:19px;display:flex;align-items:center;gap:6px;font:500 13.5px 'Plus Jakarta Sans';white-space:nowrap;background:rgba(139,92,246,.10);color:#6a3ee0;box-shadow:inset 0 0 0 1px rgba(139,92,246,.35)">
            « ✓ Jeudi »
          <span style="height:38px;padding:0 14px;border-radius:19px;display:flex;align-items:center;gap:6px;font:500 13.5px 'Plus Jakarta Sans';white-space:nowrap;background:rgba(139,92,246,.10);color:#6a3ee0;box-shadow:inset 0 0 0 1px rgba(139,92,246,.35)">
            « ✓ Vendredi »
          <span style="height:38px;padding:0 14px;border-radius:19px;display:flex;align-items:center;gap:6px;font:500 13.5px 'Plus Jakarta Sans';white-space:nowrap;background:rgba(139,92,246,.10);color:#6a3ee0;box-shadow:inset 0 0 0 1px rgba(139,92,246,.35)">
            « ✓ Samedi »
          <span style="height:38px;padding:0 14px;border-radius:19px;display:flex;align-items:center;gap:6px;font:500 13.5px 'Plus Jakarta Sans';white-space:nowrap;box-shadow:inset 0 0 0 1px rgba(22,18,40,.12);color:#4a4855">
            « Dimanche »
      <div style="display:flex;flex-direction:column;gap:8px;min-width:0;grid-column:1/-1">
        <span style="font:500 13.5px 'Plus Jakarta Sans'">
          « Contraintes d’organisation »
        <textarea defaultValue="Box ouverte tôt le matin ; jamais de séance le mercredi." placeholder="" style="border:0;outline:0;width:100%;border-radius:12px;box-shadow:inset 0 0 0 1px rgba(22,18,40,.12);background:#fff;color:#17151d;min-height:96px;padding:12px 14px;resize:vertical;font:400 15px/1.5 'Plus Jakarta Sans'">
    <span style="align-self:flex-start;height:44px;padding:0 18px;border-radius:12px;background:#17151d;color:#fff;display:flex;align-items:center;font:500 14px 'Plus Jakarta Sans';white-space:nowrap">
      « Enregistrer les disponibilités »
```
