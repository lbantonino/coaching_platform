# Extrait source exact — Onglet « overview » de la fiche sportif

Généré automatiquement depuis `CooryFicheSportif.dc.html` (source de vérité visuelle). Chaque ligne = un élément, indentation = imbrication. Les styles sont **exacts** (valeurs CSS inline des maquettes). Les `{{ … }}` sont des valeurs dynamiques calculées dans la logique (voir `reference/source/`). `<sc-for>` = boucle, `<sc-if>` = affichage conditionnel, `<dc-import>` = sous-composant.

```html
<sc-if value="{{ is_overview }}" hint-placeholder-val="{{ true }}">
  <sc-if value="{{ isD }}" hint-placeholder-val="{{ true }}">
    <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;align-items:stretch">
      <section style="border-radius:20px;background:#fff;box-shadow:inset 0 0 0 1px rgba(22,18,40,.05);padding:22px;display:flex;flex-direction:column;gap:16px;min-width:0;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
          <div style="flex:1 1 auto;display:flex;flex-direction:column;gap:4px;min-width:0">
            <span style="font:600 17px 'Plus Jakarta Sans';letter-spacing:-.01em;white-space:nowrap">
              « Profil du sportif »
          <button type="button" onClick="{{ go_profil }}" style="cursor:pointer;border:0;flex:none;height:34px;padding:0 12px;border-radius:10px;background:#fff;box-shadow:inset 0 0 0 1px rgba(22,18,40,.14);display:flex;align-items:center;gap:6px;font:500 13px 'Plus Jakarta Sans';color:#17151d">
            [icône SVG] <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"></path></svg>
            « Modifier »
        <div>
          <div style="display:grid;grid-template-columns:minmax(110px,160px) minmax(0,1fr);gap:12px;padding:11px 0;border-bottom:1px solid rgba(22,18,40,.07)">
            <span style="font:400 13.5px 'Plus Jakarta Sans';color:#64626e">
              « Nom complet »
            <span style="font:500 14px/1.45 'Plus Jakarta Sans';color:#17151d">
              « Inès Benali »
          <div style="display:grid;grid-template-columns:minmax(110px,160px) minmax(0,1fr);gap:12px;padding:11px 0;border-bottom:1px solid rgba(22,18,40,.07)">
            <span style="font:400 13.5px 'Plus Jakarta Sans';color:#64626e">
              « Sexe »
            <span style="font:500 14px/1.45 'Plus Jakarta Sans';color:#17151d">
              « Femme »
          <div style="display:grid;grid-template-columns:minmax(110px,160px) minmax(0,1fr);gap:12px;padding:11px 0;border-bottom:1px solid rgba(22,18,40,.07)">
            <span style="font:400 13.5px 'Plus Jakarta Sans';color:#64626e">
              « E-mail »
            <span style="font:500 14px/1.45 'Plus Jakarta Sans';color:#17151d">
              « ines.benali@example.test »
          <div style="display:grid;grid-template-columns:minmax(110px,160px) minmax(0,1fr);gap:12px;padding:11px 0;border-bottom:1px solid rgba(22,18,40,.07)">
            <span style="font:400 13.5px 'Plus Jakarta Sans';color:#64626e">
              « Téléphone »
            <span style="font:500 14px/1.45 'Plus Jakarta Sans';color:#8b8996">
              « Non renseigné »
          <div style="display:grid;grid-template-columns:minmax(110px,160px) minmax(0,1fr);gap:12px;padding:11px 0;border-bottom:1px solid rgba(22,18,40,.07)">
            <span style="font:400 13.5px 'Plus Jakarta Sans';color:#64626e">
              « Niveau »
            <span style="font:500 14px/1.45 'Plus Jakarta Sans';color:#17151d">
              « Confirmé »
          <div style="display:grid;grid-template-columns:minmax(110px,160px) minmax(0,1fr);gap:12px;padding:11px 0;border-bottom:1px solid rgba(22,18,40,.07)">
            <span style="font:400 13.5px 'Plus Jakarta Sans';color:#64626e">
              « Expérience »
            <span style="font:500 14px/1.45 'Plus Jakarta Sans';color:#17151d">
              « Deux Hyrox terminés en catégorie Open ; ancienne joueuse de basket. »
          <div style="display:grid;grid-template-columns:minmax(110px,160px) minmax(0,1fr);gap:12px;padding:11px 0;border-bottom:1px solid rgba(22,18,40,.07)">
            <span style="font:400 13.5px 'Plus Jakarta Sans';color:#64626e">
              « Lieux »
            <span style="font:500 14px/1.45 'Plus Jakarta Sans';color:#17151d">
              « Box Hyrox / CrossFit, Salle de sport »
          <div style="display:grid;grid-template-columns:minmax(110px,160px) minmax(0,1fr);gap:12px;padding:11px 0;">
            <span style="font:400 13.5px 'Plus Jakarta Sans';color:#64626e">
              « Matériel »
            <span style="font:500 14px/1.45 'Plus Jakarta Sans';color:#17151d">
              « Box équipée : SkiErg, rameur, traîneau, wall balls, kettlebells. »
      <section style="border-radius:20px;background:#fff;box-shadow:inset 0 0 0 1px rgba(22,18,40,.05);padding:22px;display:flex;flex-direction:column;gap:16px;min-width:0;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
          <div style="flex:1 1 auto;display:flex;flex-direction:column;gap:4px;min-width:0">
            <span style="font:600 17px 'Plus Jakarta Sans';letter-spacing:-.01em;white-space:nowrap">
              « Prochaines séances »
          <button type="button" onClick="{{ go_agenda }}" style="cursor:pointer;border:0;background:transparent;padding:0;flex:none;height:34px;font:500 13px 'Plus Jakarta Sans';color:#6a3ee0;white-space:nowrap">
            « Agenda »
        <div style="display:flex;flex-direction:column;gap:2px;margin:0 -12px">
          <div style="display:grid;grid-template-columns:78px minmax(0,1fr);gap:12px;align-items:center;padding:11px 12px;border-radius:12px;background:rgba(139,92,246,.07)">
            <div style="display:flex;flex-direction:column;gap:1px">
              <span style="font:500 12px 'Plus Jakarta Sans';color:#6a3ee0;white-space:nowrap">
                « Aujourd’hui »
              <span style="font:600 15px 'Plus Jakarta Sans';font-variant-numeric:tabular-nums">
                « 07:00 »
            <div style="display:flex;flex-direction:column;gap:2px;min-width:0">
              <span style="display:flex;align-items:center;gap:7px;font:600 14px 'Plus Jakarta Sans'">
                <span style="width:7px;height:7px;flex:none;border-radius:50%;background:#DD2D4A">
                « Renfo Hyrox »
              <span style="font:400 12.5px/1.45 'Plus Jakarta Sans';color:#64626e">
                « Avec le coach · Salle de sport · 1 h »
          <div style="display:grid;grid-template-columns:78px minmax(0,1fr);gap:12px;align-items:center;padding:11px 12px;border-radius:12px;">
            <div style="display:flex;flex-direction:column;gap:1px">
              <span style="font:500 12px 'Plus Jakarta Sans';color:#64626e;white-space:nowrap">
                « Sam 7 »
              <span style="font:600 15px 'Plus Jakarta Sans';font-variant-numeric:tabular-nums">
                « 10:00 »
            <div style="display:flex;flex-direction:column;gap:2px;min-width:0">
              <span style="display:flex;align-items:center;gap:7px;font:600 14px 'Plus Jakarta Sans'">
                <span style="width:7px;height:7px;flex:none;border-radius:50%;background:#FEC14F">
                « Circuit Hyrox du samedi »
              <span style="font:400 12.5px/1.45 'Plus Jakarta Sans';color:#64626e">
                « Collective · Box Hyrox · 4 inscrits · 1 h 15 »
          <div style="display:grid;grid-template-columns:78px minmax(0,1fr);gap:12px;align-items:center;padding:11px 12px;border-radius:12px;">
            <div style="display:flex;flex-direction:column;gap:1px">
              <span style="font:500 12px 'Plus Jakarta Sans';color:#64626e;white-space:nowrap">
                « Mar 10 »
              <span style="font:600 15px 'Plus Jakarta Sans';font-variant-numeric:tabular-nums">
                « 07:00 »
            <div style="display:flex;flex-direction:column;gap:2px;min-width:0">
              <span style="display:flex;align-items:center;gap:7px;font:600 14px 'Plus Jakarta Sans'">
                <span style="width:7px;height:7px;flex:none;border-radius:50%;background:#DD2D4A">
                « Renfo Hyrox »
              <span style="font:400 12.5px/1.45 'Plus Jakarta Sans';color:#64626e">
                « Avec le coach · Salle de sport · 1 h »
          <div style="display:grid;grid-template-columns:78px minmax(0,1fr);gap:12px;align-items:center;padding:11px 12px;border-radius:12px;">
            <div style="display:flex;flex-direction:column;gap:1px">
              <span style="font:500 12px 'Plus Jakarta Sans';color:#64626e;white-space:nowrap">
                « Sam 14 »
              <span style="font:600 15px 'Plus Jakarta Sans';font-variant-numeric:tabular-nums">
                « 10:00 »
            <div style="display:flex;flex-direction:column;gap:2px;min-width:0">
              <span style="display:flex;align-items:center;gap:7px;font:600 14px 'Plus Jakarta Sans'">
                <span style="width:7px;height:7px;flex:none;border-radius:50%;background:#FEC14F">
                « Circuit Hyrox du samedi »
              <span style="font:400 12.5px/1.45 'Plus Jakarta Sans';color:#64626e">
                « Collective · Box Hyrox · 4 inscrits · 1 h 15 »
          <div style="display:grid;grid-template-columns:78px minmax(0,1fr);gap:12px;align-items:center;padding:11px 12px;border-radius:12px;">
            <div style="display:flex;flex-direction:column;gap:1px">
              <span style="font:500 12px 'Plus Jakarta Sans';color:#64626e;white-space:nowrap">
                « Sam 12 déc. »
              <span style="font:600 15px 'Plus Jakarta Sans';font-variant-numeric:tabular-nums">
                « Journée »
            <div style="display:flex;flex-direction:column;gap:2px;min-width:0">
              <span style="display:flex;align-items:center;gap:7px;font:600 14px 'Plus Jakarta Sans'">
                <span style="width:7px;height:7px;flex:none;border-radius:50%;background:#FEC14F">
                « Hyrox Gent »
              <span style="font:400 12.5px/1.45 'Plus Jakarta Sans';color:#64626e">
                « Compétition · Hyrox · Gand »
      <section style="border-radius:20px;background:#fff;box-shadow:inset 0 0 0 1px rgba(22,18,40,.05);padding:22px;display:flex;flex-direction:column;gap:16px;min-width:0;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
          <div style="flex:1 1 auto;display:flex;flex-direction:column;gap:4px;min-width:0">
            <span style="font:600 17px 'Plus Jakarta Sans';letter-spacing:-.01em;white-space:nowrap">
              « Repères et mesures »
          <button type="button" onClick="{{ go_reperes }}" style="cursor:pointer;border:0;flex:none;height:34px;padding:0 12px;border-radius:10px;background:#fff;box-shadow:inset 0 0 0 1px rgba(22,18,40,.14);display:flex;align-items:center;gap:6px;font:500 13px 'Plus Jakarta Sans';color:#17151d">
            [icône SVG] <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"></path></svg>
            « Modifier »
        <div style="display:flex;flex-wrap:wrap;gap:10px">
          <div style="flex:1 1 100%;min-width:0;display:flex;gap:14px;align-items:flex-start;padding:16px 18px;border-radius:14px;background:#f8f7fb">
            <span style="width:40px;height:40px;flex:none;border-radius:12px;background:rgba(254,193,79,.24);display:flex;align-items:center;justify-content:center;color:#8a6200">
              [icône SVG] <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 9v4l2 2M9 2h6"></path></svg>
            <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px">
              <span style="font:500 13px 'Plus Jakarta Sans';color:#64626e">
                « Race pace (Hyrox) »
              <span style="display:flex;align-items:baseline;gap:6px;white-space:nowrap">
                <span style="font:700 24px/1.1 'Plus Jakarta Sans';letter-spacing:-.02em;color:#8a6200">
                  « 4:50–5:05 »
                <span style="font:600 13.5px 'Plus Jakarta Sans';color:#8a6200">
                  « min/km »
              <span style="font:400 12.5px/1.45 'Plus Jakarta Sans';color:#64626e">
                « ≈ 12,1 km/h · Estimation coach · 1 oct. 2026 »
          <div style="flex:1 1 100%;min-width:0;display:flex;gap:14px;align-items:flex-start;padding:16px 18px;border-radius:14px;background:#f8f7fb">
            <span style="width:40px;height:40px;flex:none;border-radius:12px;background:rgba(221,45,74,.10);display:flex;align-items:center;justify-content:center;color:#DD2D4A">
              [icône SVG] <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 6.5h11M6.5 17.5h11M4 9v6M20 9v6M7 6v12M17 6v12"></path></svg>
            <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px">
              <span style="font:500 13px 'Plus Jakarta Sans';color:#64626e">
                « Charge de référence »
              <span style="display:flex;align-items:baseline;gap:6px;white-space:nowrap">
                <span style="font:700 24px/1.1 'Plus Jakarta Sans';letter-spacing:-.02em;color:#DD2D4A">
                  « 6 kg × 25 »
                <span style="font:600 13.5px 'Plus Jakarta Sans';color:#DD2D4A">
                  « reps »
              <span style="font:400 12.5px/1.45 'Plus Jakarta Sans';color:#64626e">
                « Wall ball · Test · 1 oct. 2026 »
      <section style="border-radius:20px;background:#fff;box-shadow:inset 0 0 0 1px rgba(22,18,40,.05);padding:22px;display:flex;flex-direction:column;gap:16px;min-width:0;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
          <div style="flex:1 1 auto;display:flex;flex-direction:column;gap:4px;min-width:0">
            <span style="font:600 17px 'Plus Jakarta Sans';letter-spacing:-.01em;white-space:nowrap">
              « Objectif actuel »
          <button type="button" onClick="{{ go_objectifs }}" style="cursor:pointer;border:0;flex:none;height:34px;padding:0 12px;border-radius:10px;background:#fff;box-shadow:inset 0 0 0 1px rgba(22,18,40,.14);display:flex;align-items:center;gap:6px;font:500 13px 'Plus Jakarta Sans';color:#17151d">
            [icône SVG] <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"></path></svg>
            « Modifier »
        <div style="border-radius:16px;padding:18px;background:#f8f7fb;display:flex;flex-direction:column;gap:8px">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
            <div style="display:flex;flex-wrap:wrap;gap:6px">
              <span style="height:24px;padding:0 9px;border-radius:12px;display:flex;align-items:center;gap:6px;font:500 12px 'Plus Jakarta Sans';white-space:nowrap;background:#f3f2f7;color:#4a4855">
                <span style="width:7px;height:7px;flex:none;border-radius:50%;background:#FEC14F">
                « Hyrox »
              <span style="height:24px;padding:0 9px;border-radius:12px;display:flex;align-items:center;gap:6px;font:500 12px 'Plus Jakarta Sans';white-space:nowrap;background:rgba(139,92,246,.10);color:#6a3ee0">
                « Principal »
            <span style="height:24px;padding:0 9px;border-radius:12px;display:flex;align-items:center;gap:6px;font:500 12px 'Plus Jakarta Sans';white-space:nowrap;background:rgba(139,92,246,.10);color:#6a3ee0">
              « J-137 »
          <span style="font:600 22px 'Plus Jakarta Sans';letter-spacing:-.02em">
            « Hyrox Bruxelles »
          <span style="font:500 14px 'Plus Jakarta Sans'">
            « 20 mars 2027 »
          <span style="font:400 13px/1.5 'Plus Jakarta Sans';color:#64626e">
            « Catégorie Pro · Bruxelles · Temps visé 1:15:00 »
          <span style="font:400 14px/1.5 'Plus Jakarta Sans';color:#4a4855">
            « Passer de la catégorie Open à Pro. »
        <button type="button" onClick="{{ go_objectifs }}" style="cursor:pointer;border:0;background:transparent;padding:0;flex:none;height:34px;font:500 13px 'Plus Jakarta Sans';color:#6a3ee0;white-space:nowrap">
          « 1 autre objectif en cours »
      <section style="border-radius:20px;background:#fff;box-shadow:inset 0 0 0 1px rgba(22,18,40,.05);padding:22px;display:flex;flex-direction:column;gap:16px;min-width:0;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
          <div style="flex:1 1 auto;display:flex;flex-direction:column;gap:4px;min-width:0">
            <span style="font:600 17px 'Plus Jakarta Sans';letter-spacing:-.01em;white-space:nowrap">
              « Disponibilités et contraintes »
          <button type="button" onClick="{{ go_dispos }}" style="cursor:pointer;border:0;flex:none;height:34px;padding:0 12px;border-radius:10px;background:#fff;box-shadow:inset 0 0 0 1px rgba(22,18,40,.14);display:flex;align-items:center;gap:6px;font:500 13px 'Plus Jakarta Sans';color:#17151d">
            [icône SVG] <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"></path></svg>
            « Modifier »
        <div style="display:flex;flex-direction:column;gap:10px">
          <span style="font:500 13px 'Plus Jakarta Sans';color:#64626e">
            « Jours disponibles · 5 séances, 90 min max »
          <div style="display:flex;gap:6px">
            <span title="Lundi" style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:600 13px 'Plus Jakarta Sans';background:rgba(139,92,246,.12);color:#6a3ee0">
              « L »
            <span title="Mardi" style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:600 13px 'Plus Jakarta Sans';background:rgba(139,92,246,.12);color:#6a3ee0">
              « M »
            <span title="Mercredi" style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:600 13px 'Plus Jakarta Sans';box-shadow:inset 0 0 0 1px rgba(22,18,40,.12);color:#8b8996">
              « M »
            <span title="Jeudi" style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:600 13px 'Plus Jakarta Sans';background:rgba(139,92,246,.12);color:#6a3ee0">
              « J »
            <span title="Vendredi" style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:600 13px 'Plus Jakarta Sans';background:rgba(139,92,246,.12);color:#6a3ee0">
              « V »
            <span title="Samedi" style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:600 13px 'Plus Jakarta Sans';background:rgba(139,92,246,.12);color:#6a3ee0">
              « S »
            <span title="Dimanche" style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:600 13px 'Plus Jakarta Sans';box-shadow:inset 0 0 0 1px rgba(22,18,40,.12);color:#8b8996">
              « D »
        <div>
          <div style="display:grid;grid-template-columns:minmax(110px,160px) minmax(0,1fr);gap:12px;padding:11px 0;border-bottom:1px solid rgba(22,18,40,.07)">
            <span style="font:400 13.5px 'Plus Jakarta Sans';color:#64626e">
              « Organisation »
            <span style="font:500 14px/1.45 'Plus Jakarta Sans';color:#17151d">
              « Box ouverte tôt le matin ; jamais de séance le mercredi. »
          <div style="display:grid;grid-template-columns:minmax(110px,160px) minmax(0,1fr);gap:12px;padding:11px 0;">
            <span style="font:400 13.5px 'Plus Jakarta Sans';color:#64626e">
              « Points d’attention »
            <span style="font:500 14px/1.45 'Plus Jakarta Sans';color:#17151d">
              « Épaule gauche sensible au-dessus de la tête (wall balls, développé militaire). »
      <section style="border-radius:20px;background:#fff;box-shadow:inset 0 0 0 1px rgba(22,18,40,.05);padding:22px;display:flex;flex-direction:column;gap:16px;min-width:0;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
          <div style="flex:1 1 auto;display:flex;flex-direction:column;gap:4px;min-width:0">
            <span style="font:600 17px 'Plus Jakarta Sans';letter-spacing:-.01em;white-space:nowrap">
              « Notes du coach »
          <button type="button" onClick="{{ go_notes }}" style="cursor:pointer;border:0;flex:none;height:34px;padding:0 12px;border-radius:10px;background:#fff;box-shadow:inset 0 0 0 1px rgba(22,18,40,.14);display:flex;align-items:center;gap:6px;font:500 13px 'Plus Jakarta Sans';color:#17151d">
            [icône SVG] <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"></path></svg>
            « Modifier »
        <div style="border-radius:14px;padding:16px;background:#f8f7fb;display:flex;flex-direction:column;gap:8px">
          <span style="font:400 14px/1.55 'Plus Jakarta Sans';color:#17151d">
            « Sportive très sérieuse et investie. Bonne progression sur les séances longues. Objectif : passer en Pro. »
          <span style="font:400 12.5px 'Plus Jakarta Sans';color:#8b8996">
            « Notes libres · mises à jour le 18 sept. 2026 à 19:00 »
      <section style="border-radius:20px;background:#fff;box-shadow:inset 0 0 0 1px rgba(22,18,40,.05);padding:22px;display:flex;flex-direction:column;gap:16px;min-width:0;grid-column:1/-1">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
          <div style="flex:1 1 auto;display:flex;flex-direction:column;gap:4px;min-width:0">
            <span style="font:600 17px 'Plus Jakarta Sans';letter-spacing:-.01em;white-space:nowrap">
              « Historique récent »
          <button type="button" onClick="{{ go_historique }}" style="cursor:pointer;border:0;background:transparent;padding:0;flex:none;height:34px;font:500 13px 'Plus Jakarta Sans';color:#6a3ee0;white-space:nowrap">
            « Voir tout »
        <div style="display:flex;flex-direction:column">
          <sc-for list="{{ histShort }}" as="h" hint-placeholder-count="5">
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
  <sc-if value="{{ isM }}">
    <div style="display:flex;flex-direction:column;gap:24px">
      <div style="display:flex;flex-direction:column;gap:6px">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 10px">
          <span style="font:600 12px 'Plus Jakarta Sans';letter-spacing:.09em;color:#8b8996">
            « PROFIL DU SPORTIF »
          <button type="button" onClick="{{ go_profil }}" style="cursor:pointer;border:0;background:transparent;padding:0;min-height:40px;font:500 13.5px 'Plus Jakarta Sans';color:#6a3ee0;white-space:nowrap">
            « Modifier »
        <div style="border-radius:22px;background:#fff;box-shadow:inset 0 0 0 1px rgba(22,18,40,.05);padding:8px 0;display:flex;flex-direction:column;gap:16px;min-width:0">
          <div style="display:flex;align-items:center;gap:14px;padding:14px 24px;border-bottom:1px solid rgba(22,18,40,.07)">
            <span style="width:34px;height:34px;flex:none;border-radius:10px;background:#f3f2f7;display:flex;align-items:center;justify-content:center;color:#4a4855">
              [icône SVG] <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"></path></svg>
            <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px">
              <span style="font:500 12.5px 'Plus Jakarta Sans';color:#64626e">
                « Nom complet »
              <span style="font:600 15px/1.45 'Plus Jakarta Sans';color:#17151d;overflow-wrap:anywhere">
                « Inès Benali »
          <div style="display:flex;align-items:center;gap:14px;padding:14px 24px;border-bottom:1px solid rgba(22,18,40,.07)">
            <span style="width:34px;height:34px;flex:none;border-radius:10px;background:#f3f2f7;display:flex;align-items:center;justify-content:center;color:#4a4855">
              [icône SVG] <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 15v6M9 18h6"></path></svg>
            <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px">
              <span style="font:500 12.5px 'Plus Jakarta Sans';color:#64626e">
                « Sexe »
              <span style="font:600 15px/1.45 'Plus Jakarta Sans';color:#c2266b;overflow-wrap:anywhere">
                « Femme »
          <div style="display:flex;align-items:center;gap:14px;padding:14px 24px;border-bottom:1px solid rgba(22,18,40,.07)">
            <span style="width:34px;height:34px;flex:none;border-radius:10px;background:#f3f2f7;display:flex;align-items:center;justify-content:center;color:#4a4855">
              [icône SVG] <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM3 7l9 6 9-6"></path></svg>
            <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px">
              <span style="font:500 12.5px 'Plus Jakarta Sans';color:#64626e">
                « Adresse e-mail »
              <span style="font:600 15px/1.45 'Plus Jakarta Sans';color:#17151d;overflow-wrap:anywhere">
                « ines.benali@example.test »
          <div style="display:flex;align-items:center;gap:14px;padding:14px 24px;border-bottom:1px solid rgba(22,18,40,.07)">
            <span style="width:34px;height:34px;flex:none;border-radius:10px;background:#f3f2f7;display:flex;align-items:center;justify-content:center;color:#4a4855">
              [icône SVG] <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"></path></svg>
            <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px">
              <span style="font:500 12.5px 'Plus Jakarta Sans';color:#64626e">
                « Téléphone »
              <span style="font:600 15px/1.45 'Plus Jakarta Sans';color:#8b8996;overflow-wrap:anywhere">
                « Non renseigné »
          <div style="display:flex;align-items:center;gap:14px;padding:14px 24px;border-bottom:1px solid rgba(22,18,40,.07)">
            <span style="width:34px;height:34px;flex:none;border-radius:10px;background:#f3f2f7;display:flex;align-items:center;justify-content:center;color:#4a4855">
              [icône SVG] <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 14l4-4M3.3 19a10 10 0 1 1 17.4 0"></path></svg>
            <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px">
              <span style="font:500 12.5px 'Plus Jakarta Sans';color:#64626e">
                « Niveau »
              <span style="align-self:flex-start;margin-top:2px;height:26px;padding:0 11px;border-radius:13px;display:flex;align-items:center;font:600 13px 'Plus Jakarta Sans';background:rgba(21,128,61,.10);color:#15803d">
                « Confirmé »
          <div style="display:flex;align-items:center;gap:14px;padding:14px 24px;border-bottom:1px solid rgba(22,18,40,.07)">
            <span style="width:34px;height:34px;flex:none;border-radius:10px;background:#f3f2f7;display:flex;align-items:center;justify-content:center;color:#4a4855">
              [icône SVG] <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5"></path></svg>
            <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px">
              <span style="font:500 12.5px 'Plus Jakarta Sans';color:#64626e">
                « Expérience »
              <span style="font:600 15px/1.45 'Plus Jakarta Sans';color:#17151d;overflow-wrap:anywhere">
                « Deux Hyrox terminés en catégorie Open ; ancienne joueuse de basket. »
          <div style="display:flex;align-items:center;gap:14px;padding:14px 24px;border-bottom:1px solid rgba(22,18,40,.07)">
            <span style="width:34px;height:34px;flex:none;border-radius:10px;background:#f3f2f7;display:flex;align-items:center;justify-content:center;color:#4a4855">
              [icône SVG] <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12zM12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"></path></svg>
            <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px">
              <span style="font:500 12.5px 'Plus Jakarta Sans';color:#64626e">
                « Lieux d’entraînement »
              <span style="font:600 15px/1.45 'Plus Jakarta Sans';color:#17151d;overflow-wrap:anywhere">
                « Box Hyrox / CrossFit, Salle de sport »
          <div style="display:flex;align-items:center;gap:14px;padding:14px 24px;">
            <span style="width:34px;height:34px;flex:none;border-radius:10px;background:#f3f2f7;display:flex;align-items:center;justify-content:center;color:#4a4855">
              [icône SVG] <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 6.5h11M6.5 17.5h11M4 9v6M20 9v6M7 6v12M17 6v12"></path></svg>
            <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px">
              <span style="font:500 12.5px 'Plus Jakarta Sans';color:#64626e">
                « Matériel disponible »
              <span style="font:600 15px/1.45 'Plus Jakarta Sans';color:#17151d;overflow-wrap:anywhere">
                « Box équipée : SkiErg, rameur, traîneau, wall balls, kettlebells. »
      <div style="display:flex;flex-direction:column;gap:6px">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 10px">
          <span style="font:600 12px 'Plus Jakarta Sans';letter-spacing:.09em;color:#8b8996">
            « PROCHAINES SÉANCES »
          <button type="button" onClick="{{ go_agenda }}" style="cursor:pointer;border:0;background:transparent;padding:0;min-height:40px;font:500 13.5px 'Plus Jakarta Sans';color:#6a3ee0;white-space:nowrap">
            « Agenda »
        <div style="border-radius:22px;background:#fff;box-shadow:inset 0 0 0 1px rgba(22,18,40,.05);padding:0 0 8px;display:flex;flex-direction:column;gap:0;overflow:hidden;min-width:0">
          <div style="display:grid;grid-template-columns:66px minmax(0,1fr);gap:14px;align-items:center;padding:18px 24px 16px;background:rgba(139,92,246,.09);border-radius:22px 22px 0 0;border-bottom:1px solid rgba(22,18,40,.07)">
            <div style="display:flex;flex-direction:column;gap:1px">
              <span style="font:500 12px 'Plus Jakarta Sans';color:#6a3ee0;white-space:nowrap">
                « Aujourd’hui »
              <span style="font:600 15px 'Plus Jakarta Sans'">
                « 07:00 »
            <div style="display:flex;flex-direction:column;gap:2px;min-width:0">
              <span style="display:flex;align-items:center;gap:7px;font:600 14px 'Plus Jakarta Sans'">
                <span style="width:7px;height:7px;flex:none;border-radius:50%;background:#DD2D4A">
                « Renfo Hyrox »
              <span style="font:400 12.5px 'Plus Jakarta Sans';color:#64626e">
                « Avec le coach · Salle de sport · 1 h »
          <div style="display:grid;grid-template-columns:66px minmax(0,1fr);gap:14px;align-items:center;padding:16px 24px;border-bottom:1px solid rgba(22,18,40,.07)">
            <div style="display:flex;flex-direction:column;gap:1px">
              <span style="font:500 12px 'Plus Jakarta Sans';color:#64626e;white-space:nowrap">
                « Sam 7 »
              <span style="font:600 15px 'Plus Jakarta Sans'">
                « 10:00 »
            <div style="display:flex;flex-direction:column;gap:2px;min-width:0">
              <span style="display:flex;align-items:center;gap:7px;font:600 14px 'Plus Jakarta Sans'">
                <span style="width:7px;height:7px;flex:none;border-radius:50%;background:#FEC14F">
                « Circuit Hyrox du samedi »
              <span style="font:400 12.5px 'Plus Jakarta Sans';color:#64626e">
                « Collective · Box Hyrox · 1 h 15 »
          <div style="display:grid;grid-template-columns:66px minmax(0,1fr);gap:14px;align-items:center;padding:16px 24px;border-bottom:1px solid rgba(22,18,40,.07)">
            <div style="display:flex;flex-direction:column;gap:1px">
              <span style="font:500 12px 'Plus Jakarta Sans';color:#64626e;white-space:nowrap">
                « Mar 10 »
              <span style="font:600 15px 'Plus Jakarta Sans'">
                « 07:00 »
            <div style="display:flex;flex-direction:column;gap:2px;min-width:0">
              <span style="display:flex;align-items:center;gap:7px;font:600 14px 'Plus Jakarta Sans'">
                <span style="width:7px;height:7px;flex:none;border-radius:50%;background:#DD2D4A">
                « Renfo Hyrox »
              <span style="font:400 12.5px 'Plus Jakarta Sans';color:#64626e">
                « Avec le coach · Salle de sport · 1 h »
          <div style="display:grid;grid-template-columns:66px minmax(0,1fr);gap:14px;align-items:center;padding:16px 24px;border-bottom:1px solid rgba(22,18,40,.07)">
            <div style="display:flex;flex-direction:column;gap:1px">
              <span style="font:500 12px 'Plus Jakarta Sans';color:#64626e;white-space:nowrap">
                « Sam 14 »
              <span style="font:600 15px 'Plus Jakarta Sans'">
                « 10:00 »
            <div style="display:flex;flex-direction:column;gap:2px;min-width:0">
              <span style="display:flex;align-items:center;gap:7px;font:600 14px 'Plus Jakarta Sans'">
                <span style="width:7px;height:7px;flex:none;border-radius:50%;background:#FEC14F">
                « Circuit Hyrox du samedi »
              <span style="font:400 12.5px 'Plus Jakarta Sans';color:#64626e">
                « Collective · Box Hyrox · 1 h 15 »
          <div style="display:grid;grid-template-columns:66px minmax(0,1fr);gap:14px;align-items:center;padding:16px 24px;">
            <div style="display:flex;flex-direction:column;gap:1px">
              <span style="font:500 12px 'Plus Jakarta Sans';color:#64626e;white-space:nowrap">
                « Sam 12 déc. »
              <span style="font:600 15px 'Plus Jakarta Sans'">
                « Journée »
            <div style="display:flex;flex-direction:column;gap:2px;min-width:0">
              <span style="display:flex;align-items:center;gap:7px;font:600 14px 'Plus Jakarta Sans'">
                <span style="width:7px;height:7px;flex:none;border-radius:50%;background:#FEC14F">
                « Hyrox Gent »
              <span style="font:400 12.5px 'Plus Jakarta Sans';color:#64626e">
                « Compétition · Hyrox · Gand »
      <div style="display:flex;flex-direction:column;gap:6px">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 10px">
          <span style="font:600 12px 'Plus Jakarta Sans';letter-spacing:.09em;color:#8b8996">
            « REPÈRES ET MESURES »
          <button type="button" onClick="{{ go_reperes }}" style="cursor:pointer;border:0;background:transparent;padding:0;min-height:40px;font:500 13.5px 'Plus Jakarta Sans';color:#6a3ee0;white-space:nowrap">
            « Modifier »
        <div style="border-radius:22px;background:#fff;box-shadow:inset 0 0 0 1px rgba(22,18,40,.05);padding:24px;display:flex;flex-direction:column;gap:16px;min-width:0">
          <div style="display:flex;gap:14px;align-items:flex-start">
            <span style="width:40px;height:40px;flex:none;border-radius:12px;background:rgba(254,193,79,.24);display:flex;align-items:center;justify-content:center;color:#8a6200">
              [icône SVG] <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 9v4l2 2M9 2h6"></path></svg>
            <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px">
              <span style="font:500 13px 'Plus Jakarta Sans';color:#64626e">
                « Race pace (Hyrox) »
              <span style="display:flex;align-items:baseline;gap:6px;white-space:nowrap">
                <span style="font:700 25px/1.1 'Plus Jakarta Sans';letter-spacing:-.02em;color:#8a6200">
                  « 4:50–5:05 »
                <span style="font:600 14px 'Plus Jakarta Sans';color:#8a6200">
                  « min/km »
              <span style="font:400 13px 'Plus Jakarta Sans';color:#64626e">
                « ≈ 12,1 km/h · Estimation coach · 1 oct. 2026 »
          <div style="height:1px;background:rgba(22,18,40,.07)">
          <div style="display:flex;gap:14px;align-items:flex-start">
            <span style="width:40px;height:40px;flex:none;border-radius:12px;background:rgba(221,45,74,.10);display:flex;align-items:center;justify-content:center;color:#DD2D4A">
              [icône SVG] <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 6.5h11M6.5 17.5h11M4 9v6M20 9v6M7 6v12M17 6v12"></path></svg>
            <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px">
              <span style="font:500 13px 'Plus Jakarta Sans';color:#64626e">
                « Charge de référence »
              <span style="display:flex;align-items:baseline;gap:6px;white-space:nowrap">
                <span style="font:700 25px/1.1 'Plus Jakarta Sans';letter-spacing:-.02em;color:#DD2D4A">
                  « 6 kg × 25 »
                <span style="font:600 14px 'Plus Jakarta Sans';color:#DD2D4A">
                  « reps »
              <span style="font:400 13px 'Plus Jakarta Sans';color:#64626e">
                « Wall ball · Test · 1 oct. 2026 »
      <div style="display:flex;flex-direction:column;gap:6px">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 10px">
          <span style="font:600 12px 'Plus Jakarta Sans';letter-spacing:.09em;color:#8b8996">
            « OBJECTIF ACTUEL »
          <button type="button" onClick="{{ go_objectifs }}" style="cursor:pointer;border:0;background:transparent;padding:0;min-height:40px;font:500 13.5px 'Plus Jakarta Sans';color:#6a3ee0;white-space:nowrap">
            « Modifier »
        <div style="border-radius:22px;background:#fff;box-shadow:inset 0 0 0 1px rgba(22,18,40,.05);padding:24px;display:flex;flex-direction:column;gap:16px;min-width:0">
          <div style="display:flex;gap:6px">
            <span style="height:24px;padding:0 9px;border-radius:12px;display:flex;align-items:center;gap:6px;font:500 12px 'Plus Jakarta Sans';background:#f3f2f7;color:#4a4855">
              <span style="width:7px;height:7px;flex:none;border-radius:50%;background:#FEC14F">
              « Hyrox »
            <span style="height:24px;padding:0 9px;border-radius:12px;display:flex;align-items:center;font:500 12px 'Plus Jakarta Sans';background:rgba(139,92,246,.10);color:#6a3ee0">
              « Principal »
          <div style="display:flex;flex-direction:column;gap:4px">
            <span style="font:600 21px 'Plus Jakarta Sans';letter-spacing:-.02em">
              « Hyrox Bruxelles »
            <span style="font:400 13.5px/1.5 'Plus Jakarta Sans';color:#4a4855">
              « 20 mars 2027 · Catégorie Pro · Temps visé 1:15:00 »
          <span style="font:400 14px/1.5 'Plus Jakarta Sans'">
            « Passer de la catégorie Open à Pro. »
          <div style="height:1px;background:rgba(22,18,40,.07)">
          <button type="button" onClick="{{ go_objectifs }}" style="cursor:pointer;border:0;background:transparent;padding:0;min-height:28px;display:flex;align-items:center;justify-content:space-between;font:500 13.5px 'Plus Jakarta Sans';color:#17151d;white-space:nowrap;text-align:left">
            « 1 autre objectif en cours »
            [icône SVG] <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8b8996" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"></path></svg>
      <div style="display:flex;flex-direction:column;gap:6px">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 10px">
          <span style="font:600 12px 'Plus Jakarta Sans';letter-spacing:.09em;color:#8b8996">
            « DISPONIBILITÉS ET CONTRAINTES »
          <button type="button" onClick="{{ go_dispos }}" style="cursor:pointer;border:0;background:transparent;padding:0;min-height:40px;font:500 13.5px 'Plus Jakarta Sans';color:#6a3ee0;white-space:nowrap">
            « Modifier »
        <div style="border-radius:22px;background:#fff;box-shadow:inset 0 0 0 1px rgba(22,18,40,.05);padding:24px;display:flex;flex-direction:column;gap:16px;min-width:0">
          <div style="display:flex;justify-content:space-between">
            <span style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:600 13px 'Plus Jakarta Sans';background:rgba(139,92,246,.12);color:#6a3ee0">
              « L »
            <span style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:600 13px 'Plus Jakarta Sans';background:rgba(139,92,246,.12);color:#6a3ee0">
              « M »
            <span style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:600 13px 'Plus Jakarta Sans';box-shadow:inset 0 0 0 1px rgba(22,18,40,.14);color:#8b8996">
              « M »
            <span style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:600 13px 'Plus Jakarta Sans';background:rgba(139,92,246,.12);color:#6a3ee0">
              « J »
            <span style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:600 13px 'Plus Jakarta Sans';background:rgba(139,92,246,.12);color:#6a3ee0">
              « V »
            <span style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:600 13px 'Plus Jakarta Sans';background:rgba(139,92,246,.12);color:#6a3ee0">
              « S »
            <span style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:600 13px 'Plus Jakarta Sans';box-shadow:inset 0 0 0 1px rgba(22,18,40,.14);color:#8b8996">
              « D »
          <span style="font:500 13.5px 'Plus Jakarta Sans';color:#4a4855">
            « 5 séances par semaine · 90 min max »
          <div style="height:1px;background:rgba(22,18,40,.07)">
          <div style="display:flex;flex-direction:column;gap:4px">
            <span style="font:400 13.5px 'Plus Jakarta Sans';color:#64626e">
              « Contraintes d’organisation »
            <span style="font:500 14px/1.5 'Plus Jakarta Sans'">
              « Box ouverte tôt le matin ; jamais de séance le mercredi. »
          <div style="display:flex;flex-direction:column;gap:4px">
            <span style="font:400 13.5px 'Plus Jakarta Sans';color:#64626e">
              « Blessures et points d’attention »
            <span style="font:500 14px/1.5 'Plus Jakarta Sans'">
              « Épaule gauche sensible au-dessus de la tête (wall balls, développé militaire). »
      <div style="display:flex;flex-direction:column;gap:6px">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 10px">
          <span style="font:600 12px 'Plus Jakarta Sans';letter-spacing:.09em;color:#8b8996">
            « NOTES DU COACH »
          <button type="button" onClick="{{ go_notes }}" style="cursor:pointer;border:0;background:transparent;padding:0;min-height:40px;font:500 13.5px 'Plus Jakarta Sans';color:#6a3ee0;white-space:nowrap">
            « Modifier »
        <div style="border-radius:22px;background:#fff;box-shadow:inset 0 0 0 1px rgba(22,18,40,.05);padding:24px;display:flex;flex-direction:column;gap:16px;min-width:0">
          <span style="font:400 14.5px/1.6 'Plus Jakarta Sans'">
            « Sportive très sérieuse et investie. Bonne progression sur les séances longues. Objectif : passer en Pro. »
          <span style="font:400 12.5px 'Plus Jakarta Sans';color:#8b8996">
            « Mise à jour le 18 sept. 2026 à 19:00 »
      <div style="display:flex;flex-direction:column;gap:6px">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 10px">
          <span style="font:600 12px 'Plus Jakarta Sans';letter-spacing:.09em;color:#8b8996">
            « HISTORIQUE RÉCENT »
          <button type="button" onClick="{{ go_historique }}" style="cursor:pointer;border:0;background:transparent;padding:0;min-height:40px;font:500 13.5px 'Plus Jakarta Sans';color:#6a3ee0;white-space:nowrap">
            « Voir tout »
        <div style="border-radius:22px;background:#fff;box-shadow:inset 0 0 0 1px rgba(22,18,40,.05);padding:24px 24px 6px;display:flex;flex-direction:column;gap:16px;min-width:0">
          <div style="display:flex;flex-direction:column">
            <sc-for list="{{ histShort }}" as="h" hint-placeholder-count="5">
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
