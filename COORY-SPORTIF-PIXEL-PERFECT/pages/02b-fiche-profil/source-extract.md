# Extrait source exact — Onglet « profil » de la fiche sportif

Généré automatiquement depuis `CooryFicheSportif.dc.html` (source de vérité visuelle). Chaque ligne = un élément, indentation = imbrication. Les styles sont **exacts** (valeurs CSS inline des maquettes). Les `{{ … }}` sont des valeurs dynamiques calculées dans la logique (voir `reference/source/`). `<sc-for>` = boucle, `<sc-if>` = affichage conditionnel, `<dc-import>` = sous-composant.

```html
<sc-if value="{{ is_profil }}">
  <div style="display:flex;flex-direction:column;gap:16px">
    <section style="border-radius:20px;background:#fff;box-shadow:inset 0 0 0 1px rgba(22,18,40,.05);padding:18px 22px;display:flex;flex-wrap:wrap;align-items:center;gap:14px 18px;min-width:0;">
      <span style="position:relative;flex:none;width:64px;height:64px;border-radius:50%;background:#f0e5d6;display:flex;align-items:center;justify-content:center;font:600 20px 'Plus Jakarta Sans';color:#2a2733">
        « IB »
        <span style="position:absolute;right:-2px;bottom:-2px;width:24px;height:24px;border-radius:50%;background:#17151d;color:#fff;box-shadow:0 0 0 2.5px #fff;display:flex;align-items:center;justify-content:center">
          [icône SVG] <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h3l2-3h6l2 3h3v13H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"></path></svg>
      <div style="flex:1 1 180px;min-width:0;display:flex;flex-direction:column;gap:3px">
        <span style="font:600 15px 'Plus Jakarta Sans';white-space:nowrap">
          « Photo de profil »
        <span style="font:400 12.5px/1.45 'Plus Jakarta Sans';color:#64626e;text-wrap:pretty">
          « JPEG, PNG ou WebP, 2 Mo maximum. Stockée en privé. »
      <div style="flex:0 1 auto;display:flex;gap:8px">
        <span style="height:40px;padding:0 14px;border-radius:10px;background:#17151d;color:#fff;display:flex;align-items:center;justify-content:center;gap:7px;font:500 13.5px 'Plus Jakarta Sans';white-space:nowrap">
          « Changer la photo »
        <span style="height:40px;padding:0 14px;border-radius:10px;box-shadow:inset 0 0 0 1px rgba(22,18,40,.14);display:flex;align-items:center;justify-content:center;gap:7px;font:500 13.5px 'Plus Jakarta Sans';color:#4a4855;white-space:nowrap">
          [icône SVG] <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"></path></svg>
          « Retirer »
    <section style="border-radius:20px;background:#fff;box-shadow:inset 0 0 0 1px rgba(22,18,40,.05);padding:22px;display:flex;flex-direction:column;gap:16px;min-width:0;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
        <div style="flex:1 1 auto;display:flex;flex-direction:column;gap:4px;min-width:0">
          <span style="font:600 17px 'Plus Jakarta Sans';letter-spacing:-.01em;white-space:nowrap">
            « Informations »
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:16px">
        <span style="grid-column:1/-1;padding-top:8px;font:600 11.5px 'Plus Jakarta Sans';letter-spacing:.09em;color:#8b8996">
          « IDENTITÉ »
        <div style="display:flex;flex-direction:column;gap:8px;min-width:0">
          <span style="font:500 13.5px 'Plus Jakarta Sans'">
            « Prénom »
          <input defaultValue="Inès" placeholder="" style="border:0;outline:0;width:100%;border-radius:12px;box-shadow:inset 0 0 0 1px rgba(22,18,40,.12);background:#fff;color:#17151d;height:46px;padding:0 14px;font:400 15px 'Plus Jakarta Sans';">
        <div style="display:flex;flex-direction:column;gap:8px;min-width:0">
          <span style="font:500 13.5px 'Plus Jakarta Sans'">
            « Nom de famille »
          <input defaultValue="Benali" placeholder="" style="border:0;outline:0;width:100%;border-radius:12px;box-shadow:inset 0 0 0 1px rgba(22,18,40,.12);background:#fff;color:#17151d;height:46px;padding:0 14px;font:400 15px 'Plus Jakarta Sans';">
        <div style="display:flex;flex-direction:column;gap:8px;min-width:0">
          <span style="font:500 13.5px 'Plus Jakarta Sans'">
            « Sexe »
            <span style="font-weight:400;color:#8b8996">
              « (facultatif) »
          <span style="border:0;outline:0;width:100%;border-radius:12px;box-shadow:inset 0 0 0 1px rgba(22,18,40,.12);background:#fff;color:#17151d;height:46px;padding:0 14px;display:flex;align-items:center;justify-content:space-between;gap:8px;font:400 15px 'Plus Jakarta Sans';color:#17151d">
            « Femme »
            [icône SVG] <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8b8996" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"></path></svg>
        <span style="grid-column:1/-1;padding-top:8px;font:600 11.5px 'Plus Jakarta Sans';letter-spacing:.09em;color:#8b8996">
          « CONTACT »
        <div style="display:flex;flex-direction:column;gap:8px;min-width:0">
          <span style="font:500 13.5px 'Plus Jakarta Sans'">
            « Adresse e-mail »
          <input defaultValue="ines.benali@example.test" placeholder="" readOnly style="border:0;outline:0;width:100%;border-radius:12px;box-shadow:inset 0 0 0 1px rgba(22,18,40,.12);background:#fff;color:#17151d;height:46px;padding:0 14px;font:400 15px 'Plus Jakarta Sans';background:#f8f7fb;color:#64626e;">
          <span style="font:400 12.5px/1.45 'Plus Jakarta Sans';color:#64626e">
            « Identifiant de connexion du sportif : non modifiable ici. »
        <div style="display:flex;flex-direction:column;gap:8px;min-width:0">
          <span style="font:500 13.5px 'Plus Jakarta Sans'">
            « Téléphone »
          <input defaultValue="" placeholder="+32 …" style="border:0;outline:0;width:100%;border-radius:12px;box-shadow:inset 0 0 0 1px rgba(22,18,40,.12);background:#fff;color:#17151d;height:46px;padding:0 14px;font:400 15px 'Plus Jakarta Sans';">
        <div style="display:flex;flex-direction:column;gap:8px;min-width:0">
          <span style="font:500 13.5px 'Plus Jakarta Sans'">
            « Canal de contact préféré »
          <span style="border:0;outline:0;width:100%;border-radius:12px;box-shadow:inset 0 0 0 1px rgba(22,18,40,.12);background:#fff;color:#17151d;height:46px;padding:0 14px;display:flex;align-items:center;justify-content:space-between;gap:8px;font:400 15px 'Plus Jakarta Sans';color:#17151d">
            « WhatsApp »
            [icône SVG] <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8b8996" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"></path></svg>
        <span style="grid-column:1/-1;padding-top:8px;font:600 11.5px 'Plus Jakarta Sans';letter-spacing:.09em;color:#8b8996">
          « ADRESSE »
        <div style="display:flex;flex-direction:column;gap:8px;min-width:0;grid-column:1/-1">
          <span style="font:500 13.5px 'Plus Jakarta Sans'">
            « Rue et numéro »
          <input defaultValue="" placeholder="" style="border:0;outline:0;width:100%;border-radius:12px;box-shadow:inset 0 0 0 1px rgba(22,18,40,.12);background:#fff;color:#17151d;height:46px;padding:0 14px;font:400 15px 'Plus Jakarta Sans';">
          <span style="font:400 12.5px/1.45 'Plus Jakarta Sans';color:#64626e">
            « Reprise sur ses factures. »
        <div style="display:flex;flex-direction:column;gap:8px;min-width:0">
          <span style="font:500 13.5px 'Plus Jakarta Sans'">
            « Code postal »
          <input defaultValue="" placeholder="" style="border:0;outline:0;width:100%;border-radius:12px;box-shadow:inset 0 0 0 1px rgba(22,18,40,.12);background:#fff;color:#17151d;height:46px;padding:0 14px;font:400 15px 'Plus Jakarta Sans';">
        <div style="display:flex;flex-direction:column;gap:8px;min-width:0">
          <span style="font:500 13.5px 'Plus Jakarta Sans'">
            « Ville »
          <input defaultValue="" placeholder="" style="border:0;outline:0;width:100%;border-radius:12px;box-shadow:inset 0 0 0 1px rgba(22,18,40,.12);background:#fff;color:#17151d;height:46px;padding:0 14px;font:400 15px 'Plus Jakarta Sans';">
        <div style="display:flex;flex-direction:column;gap:8px;min-width:0">
          <span style="font:500 13.5px 'Plus Jakarta Sans'">
            « Pays »
          <span style="border:0;outline:0;width:100%;border-radius:12px;box-shadow:inset 0 0 0 1px rgba(22,18,40,.12);background:#fff;color:#17151d;height:46px;padding:0 14px;display:flex;align-items:center;justify-content:space-between;gap:8px;font:400 15px 'Plus Jakarta Sans';color:#17151d">
            « Belgique »
            [icône SVG] <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8b8996" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"></path></svg>
        <span style="grid-column:1/-1;padding-top:8px;font:600 11.5px 'Plus Jakarta Sans';letter-spacing:.09em;color:#8b8996">
          « PROFIL SPORTIF »
        <div style="display:flex;flex-direction:column;gap:8px;min-width:0">
          <span style="font:500 13.5px 'Plus Jakarta Sans'">
            « Niveau »
          <span style="border:0;outline:0;width:100%;border-radius:12px;box-shadow:inset 0 0 0 1px rgba(22,18,40,.12);background:#fff;color:#17151d;height:46px;padding:0 14px;display:flex;align-items:center;justify-content:space-between;gap:8px;font:400 15px 'Plus Jakarta Sans';color:#17151d">
            « Confirmé »
            [icône SVG] <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8b8996" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"></path></svg>
        <div style="display:flex;flex-direction:column;gap:8px;min-width:0;grid-column:1/-1">
          <span style="font:500 13.5px 'Plus Jakarta Sans'">
            « Expérience »
          <textarea defaultValue="Deux Hyrox terminés en catégorie Open ; ancienne joueuse de basket." placeholder="" style="border:0;outline:0;width:100%;border-radius:12px;box-shadow:inset 0 0 0 1px rgba(22,18,40,.12);background:#fff;color:#17151d;min-height:96px;padding:12px 14px;resize:vertical;font:400 15px/1.5 'Plus Jakarta Sans'">
        <div style="display:flex;flex-direction:column;gap:8px;min-width:0;grid-column:1/-1">
          <span style="font:500 13.5px 'Plus Jakarta Sans'">
            « Lieux d’entraînement »
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            <span style="height:38px;padding:0 14px;border-radius:19px;display:flex;align-items:center;gap:6px;font:500 13.5px 'Plus Jakarta Sans';white-space:nowrap;background:rgba(139,92,246,.10);color:#6a3ee0;box-shadow:inset 0 0 0 1px rgba(139,92,246,.35)">
              « ✓ Salle de sport »
            <span style="height:38px;padding:0 14px;border-radius:19px;display:flex;align-items:center;gap:6px;font:500 13.5px 'Plus Jakarta Sans';white-space:nowrap;box-shadow:inset 0 0 0 1px rgba(22,18,40,.12);color:#4a4855">
              « Extérieur (route, trail) »
            <span style="height:38px;padding:0 14px;border-radius:19px;display:flex;align-items:center;gap:6px;font:500 13.5px 'Plus Jakarta Sans';white-space:nowrap;box-shadow:inset 0 0 0 1px rgba(22,18,40,.12);color:#4a4855">
              « Piste d’athlétisme »
            <span style="height:38px;padding:0 14px;border-radius:19px;display:flex;align-items:center;gap:6px;font:500 13.5px 'Plus Jakarta Sans';white-space:nowrap;box-shadow:inset 0 0 0 1px rgba(22,18,40,.12);color:#4a4855">
              « Domicile »
            <span style="height:38px;padding:0 14px;border-radius:19px;display:flex;align-items:center;gap:6px;font:500 13.5px 'Plus Jakarta Sans';white-space:nowrap;background:rgba(139,92,246,.10);color:#6a3ee0;box-shadow:inset 0 0 0 1px rgba(139,92,246,.35)">
              « ✓ Box Hyrox / CrossFit »
        <div style="display:flex;flex-direction:column;gap:8px;min-width:0;grid-column:1/-1">
          <span style="font:500 13.5px 'Plus Jakarta Sans'">
            « Matériel disponible »
          <textarea defaultValue="Box équipée : SkiErg, rameur, traîneau, wall balls, kettlebells." placeholder="" style="border:0;outline:0;width:100%;border-radius:12px;box-shadow:inset 0 0 0 1px rgba(22,18,40,.12);background:#fff;color:#17151d;min-height:96px;padding:12px 14px;resize:vertical;font:400 15px/1.5 'Plus Jakarta Sans'">
        <span style="grid-column:1/-1;padding-top:8px;font:600 11.5px 'Plus Jakarta Sans';letter-spacing:.09em;color:#8b8996">
          « STATUT »
        <div style="display:flex;flex-direction:column;gap:8px;min-width:0;grid-column:1/-1">
          <span style="font:500 13.5px 'Plus Jakarta Sans'">
            « Statut »
          <div style="align-self:flex-start;display:flex;flex-wrap:wrap;padding:4px;border-radius:12px;background:#efeef4">
            <span style="height:36px;padding:0 14px;border-radius:9px;display:flex;align-items:center;font:500 13.5px 'Plus Jakarta Sans';white-space:nowrap;background:#fff;color:#17151d;box-shadow:0 1px 3px rgba(22,18,40,.10)">
              « Actif »
            <span style="height:36px;padding:0 14px;border-radius:9px;display:flex;align-items:center;font:500 13.5px 'Plus Jakarta Sans';white-space:nowrap;color:#64626e">
              « En pause »
            <span style="height:36px;padding:0 14px;border-radius:9px;display:flex;align-items:center;font:500 13.5px 'Plus Jakarta Sans';white-space:nowrap;color:#64626e">
              « Archivé »
          <span style="font:400 12.5px/1.45 'Plus Jakarta Sans';color:#64626e">
            « Archiver retire le sportif de la liste active sans rien effacer ; tu peux le restaurer à tout moment. »
      <span style="align-self:flex-start;height:44px;padding:0 18px;border-radius:12px;background:#17151d;color:#fff;display:flex;align-items:center;font:500 14px 'Plus Jakarta Sans';white-space:nowrap">
        « Enregistrer »
```
