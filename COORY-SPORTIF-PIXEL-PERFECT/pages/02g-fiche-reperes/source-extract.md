# Extrait source exact — Onglet « reperes » de la fiche sportif

Généré automatiquement depuis `CooryFicheSportif.dc.html` (source de vérité visuelle). Chaque ligne = un élément, indentation = imbrication. Les styles sont **exacts** (valeurs CSS inline des maquettes). Les `{{ … }}` sont des valeurs dynamiques calculées dans la logique (voir `reference/source/`). `<sc-for>` = boucle, `<sc-if>` = affichage conditionnel, `<dc-import>` = sous-composant.

```html
<sc-if value="{{ is_reperes }}">
  <div style="display:flex;flex-direction:column;gap:16px">
    <section style="border-radius:20px;background:#fff;box-shadow:inset 0 0 0 1px rgba(22,18,40,.05);padding:22px;display:flex;flex-direction:column;gap:16px;min-width:0;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
        <div style="flex:1 1 auto;display:flex;flex-direction:column;gap:4px;min-width:0">
          <span style="font:600 17px 'Plus Jakarta Sans';letter-spacing:-.01em;white-space:nowrap">
            « Allures et repères »
          <span style="font:400 13.5px/1.5 'Plus Jakarta Sans';color:#64626e;text-wrap:pretty">
            « Valeurs propres à ce sportif, datées. Une nouvelle mesure ne remplace pas l’ancienne : l’historique est conservé. »
      <div style="display:flex;flex-direction:column;gap:10px">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:12px">
          <div style="position:relative;min-width:0;display:flex;flex-direction:column;gap:14px;padding:{{ cPad }};border-radius:16px;background:#f8f7fb;box-shadow:{{ cA.ring }}">
            <div style="display:flex;align-items:center;gap:12px">
              <span style="width:40px;height:40px;flex:none;border-radius:12px;background:{{ cA.tint }};display:flex;align-items:center;justify-content:center;color:{{ cA.c }}">
                [icône SVG] <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="{{ cA.icon }}"></path></svg>
              <span style="flex:1;min-width:0;font:600 11px 'Plus Jakarta Sans';letter-spacing:.07em;color:#8b8996;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                « {{ cA.cat }} »
              <div style="position:relative;flex:none">
                <button type="button" aria-haspopup="listbox" aria-expanded="{{ cA.exp }}" onClick="{{ cA.toggle }}" style="cursor:pointer;border:0;height:36px;padding:0 10px 0 12px;border-radius:10px;background:#fff;box-shadow:inset 0 0 0 1px rgba(22,18,40,.12);display:flex;align-items:center;gap:6px;font:500 13px 'Plus Jakarta Sans';color:#17151d;white-space:nowrap">
                  « Changer »
                  [icône SVG] <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none;transform:{{ cA.rot }};transition:transform .2s"><path d="M6 9l6 6 6-6"></path></svg>
                <sc-if value="{{ cA.open }}">
                  <div role="listbox" style="position:absolute;top:calc(100% + 6px);z-index:20;min-width:100%;width:max-content;max-width:min(340px, calc(100vw - 48px));padding:6px;border-radius:14px;background:#fff;box-shadow:0 16px 36px rgba(22,18,40,.16),0 0 0 1px rgba(22,18,40,.08);display:flex;flex-direction:column;gap:1px;right:0">
                    <span style="padding:8px 12px 4px;font:600 11px 'Plus Jakarta Sans';letter-spacing:.07em;color:#8b8996">
                      « ALLURES ET REPÈRES RUNNING »
                    <sc-for list="{{ cA.optsRun }}" as="o" hint-placeholder-count="4">
                      <button type="button" role="option" aria-selected="{{ o.sel }}" onClick="{{ o.pick }}" style="cursor:pointer;border:0;width:100%;min-height:40px;padding:0 12px;border-radius:10px;display:flex;align-items:center;gap:10px;text-align:left;font:500 13.5px 'Plus Jakarta Sans';background:{{ o.bg }};color:#17151d" style-hover="background:#f6f5fa">
                        <span style="flex:1;white-space:nowrap">
                          « {{ o.l }} »
                        <span style="font:400 12.5px 'Plus Jakarta Sans';color:#64626e;white-space:nowrap">
                          « {{ o.v }} »
                        <span style="width:14px;color:#6a3ee0;font-weight:700">
                          « {{ o.check }} »
                    <span style="padding:10px 12px 4px;font:600 11px 'Plus Jakarta Sans';letter-spacing:.07em;color:#8b8996">
                      « CHARGES DE RÉFÉRENCE »
                    <sc-for list="{{ cA.optsMus }}" as="o" hint-placeholder-count="4">
                      <button type="button" role="option" aria-selected="{{ o.sel }}" onClick="{{ o.pick }}" style="cursor:pointer;border:0;width:100%;min-height:40px;padding:0 12px;border-radius:10px;display:flex;align-items:center;gap:10px;text-align:left;font:500 13.5px 'Plus Jakarta Sans';background:{{ o.bg }};color:#17151d" style-hover="background:#f6f5fa">
                        <span style="flex:1;white-space:nowrap">
                          « {{ o.l }} »
                        <span style="font:400 12.5px 'Plus Jakarta Sans';color:#64626e;white-space:nowrap">
                          « {{ o.v }} »
                        <span style="width:14px;color:#6a3ee0;font-weight:700">
                          « {{ o.check }} »
            <div style="display:flex;flex-direction:column;gap:6px;min-width:0">
              <span style="font:500 13.5px 'Plus Jakarta Sans';color:#4a4855">
                « {{ cA.l }} »
              <span style="display:flex;align-items:baseline;gap:6px;white-space:nowrap">
                <span style="font:700 26px/1.1 'Plus Jakarta Sans';letter-spacing:-.02em;color:{{ cA.c }}">
                  « {{ cA.v }} »
                <span style="font:600 13.5px 'Plus Jakarta Sans';color:{{ cA.c }}">
                  « {{ cA.u }} »
              <span style="font:400 12.5px/1.5 'Plus Jakarta Sans';color:#64626e">
                « {{ cA.d }} »
            <button type="button" onClick="{{ cA.show }}" style="cursor:pointer;border:0;background:transparent;padding:0;align-self:flex-start;text-align:left;white-space:nowrap;font:500 13px 'Plus Jakarta Sans';color:#6a3ee0">
              « {{ cA.showL }} »
          <div style="position:relative;min-width:0;display:flex;flex-direction:column;gap:14px;padding:{{ cPad }};border-radius:16px;background:#f8f7fb;box-shadow:{{ cB.ring }}">
            <div style="display:flex;align-items:center;gap:12px">
              <span style="width:40px;height:40px;flex:none;border-radius:12px;background:{{ cB.tint }};display:flex;align-items:center;justify-content:center;color:{{ cB.c }}">
                [icône SVG] <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="{{ cB.icon }}"></path></svg>
              <span style="flex:1;min-width:0;font:600 11px 'Plus Jakarta Sans';letter-spacing:.07em;color:#8b8996;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                « {{ cB.cat }} »
              <div style="position:relative;flex:none">
                <button type="button" aria-haspopup="listbox" aria-expanded="{{ cB.exp }}" onClick="{{ cB.toggle }}" style="cursor:pointer;border:0;height:36px;padding:0 10px 0 12px;border-radius:10px;background:#fff;box-shadow:inset 0 0 0 1px rgba(22,18,40,.12);display:flex;align-items:center;gap:6px;font:500 13px 'Plus Jakarta Sans';color:#17151d;white-space:nowrap">
                  « Changer »
                  [icône SVG] <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none;transform:{{ cB.rot }};transition:transform .2s"><path d="M6 9l6 6 6-6"></path></svg>
                <sc-if value="{{ cB.open }}">
                  <div role="listbox" style="position:absolute;top:calc(100% + 6px);z-index:20;min-width:100%;width:max-content;max-width:min(340px, calc(100vw - 48px));padding:6px;border-radius:14px;background:#fff;box-shadow:0 16px 36px rgba(22,18,40,.16),0 0 0 1px rgba(22,18,40,.08);display:flex;flex-direction:column;gap:1px;right:0">
                    <span style="padding:8px 12px 4px;font:600 11px 'Plus Jakarta Sans';letter-spacing:.07em;color:#8b8996">
                      « ALLURES ET REPÈRES RUNNING »
                    <sc-for list="{{ cB.optsRun }}" as="o" hint-placeholder-count="4">
                      <button type="button" role="option" aria-selected="{{ o.sel }}" onClick="{{ o.pick }}" style="cursor:pointer;border:0;width:100%;min-height:40px;padding:0 12px;border-radius:10px;display:flex;align-items:center;gap:10px;text-align:left;font:500 13.5px 'Plus Jakarta Sans';background:{{ o.bg }};color:#17151d" style-hover="background:#f6f5fa">
                        <span style="flex:1;white-space:nowrap">
                          « {{ o.l }} »
                        <span style="font:400 12.5px 'Plus Jakarta Sans';color:#64626e;white-space:nowrap">
                          « {{ o.v }} »
                        <span style="width:14px;color:#6a3ee0;font-weight:700">
                          « {{ o.check }} »
                    <span style="padding:10px 12px 4px;font:600 11px 'Plus Jakarta Sans';letter-spacing:.07em;color:#8b8996">
                      « CHARGES DE RÉFÉRENCE »
                    <sc-for list="{{ cB.optsMus }}" as="o" hint-placeholder-count="4">
                      <button type="button" role="option" aria-selected="{{ o.sel }}" onClick="{{ o.pick }}" style="cursor:pointer;border:0;width:100%;min-height:40px;padding:0 12px;border-radius:10px;display:flex;align-items:center;gap:10px;text-align:left;font:500 13.5px 'Plus Jakarta Sans';background:{{ o.bg }};color:#17151d" style-hover="background:#f6f5fa">
                        <span style="flex:1;white-space:nowrap">
                          « {{ o.l }} »
                        <span style="font:400 12.5px 'Plus Jakarta Sans';color:#64626e;white-space:nowrap">
                          « {{ o.v }} »
                        <span style="width:14px;color:#6a3ee0;font-weight:700">
                          « {{ o.check }} »
            <div style="display:flex;flex-direction:column;gap:6px;min-width:0">
              <span style="font:500 13.5px 'Plus Jakarta Sans';color:#4a4855">
                « {{ cB.l }} »
              <span style="display:flex;align-items:baseline;gap:6px;white-space:nowrap">
                <span style="font:700 26px/1.1 'Plus Jakarta Sans';letter-spacing:-.02em;color:{{ cB.c }}">
                  « {{ cB.v }} »
                <span style="font:600 13.5px 'Plus Jakarta Sans';color:{{ cB.c }}">
                  « {{ cB.u }} »
              <span style="font:400 12.5px/1.5 'Plus Jakarta Sans';color:#64626e">
                « {{ cB.d }} »
            <button type="button" onClick="{{ cB.show }}" style="cursor:pointer;border:0;background:transparent;padding:0;align-self:flex-start;text-align:left;white-space:nowrap;font:500 13px 'Plus Jakarta Sans';color:#6a3ee0">
              « {{ cB.showL }} »
        <button type="button" onClick="{{ swap }}" style="cursor:pointer;border:0;background:transparent;align-self:center;height:36px;padding:0 12px;border-radius:10px;display:flex;align-items:center;gap:7px;font:500 13px 'Plus Jakarta Sans';color:#4a4855;white-space:nowrap">
          [icône SVG] <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3l4 4-4 4M3 7h18M7 21l-4-4 4-4M21 17H3"></path></svg>
          « Inverser les deux cartes »
      <div style="display:flex;flex-direction:column;gap:12px;padding:18px;border-radius:16px;box-shadow:inset 0 0 0 1px rgba(22,18,40,.08)">
        <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px 16px">
          <span style="font:600 15px 'Plus Jakarta Sans'">
            « Évolution »
          <div style="display:flex;gap:8px;flex:{{ ddFlex }};min-width:0">
            <div style="position:relative;flex:{{ ddItem }};min-width:0">
              <button type="button" aria-haspopup="listbox" aria-expanded="{{ chDd.exp }}" onClick="{{ chDd.toggle }}" style="cursor:pointer;border:0;width:100%;height:38px;padding:0 12px;border-radius:10px;background:#fff;box-shadow:inset 0 0 0 1px rgba(22,18,40,.14);display:flex;align-items:center;gap:8px;font:500 13.5px 'Plus Jakarta Sans';color:#17151d;white-space:nowrap">
                <span style="width:8px;height:8px;flex:none;border-radius:50%;background:{{ ch.line }}">
                <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;text-align:left">
                  « {{ ch.l }} »
                [icône SVG] <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none;transform:{{ chDd.rot }};transition:transform .2s"><path d="M6 9l6 6 6-6"></path></svg>
              <sc-if value="{{ chDd.open }}">
                <div role="listbox" style="position:absolute;top:calc(100% + 6px);z-index:20;min-width:100%;width:max-content;max-width:min(340px, calc(100vw - 48px));padding:6px;border-radius:14px;background:#fff;box-shadow:0 16px 36px rgba(22,18,40,.16),0 0 0 1px rgba(22,18,40,.08);display:flex;flex-direction:column;gap:1px;left:0">
                  <span style="padding:8px 12px 4px;font:600 11px 'Plus Jakarta Sans';letter-spacing:.07em;color:#8b8996">
                    « ALLURES ET REPÈRES RUNNING »
                  <sc-for list="{{ chRun }}" as="o" hint-placeholder-count="4">
                    <button type="button" role="option" aria-selected="{{ o.sel }}" onClick="{{ o.pick }}" style="cursor:pointer;border:0;width:100%;min-height:40px;padding:0 12px;border-radius:10px;display:flex;align-items:center;gap:10px;text-align:left;font:500 13.5px 'Plus Jakarta Sans';background:{{ o.bg }};color:#17151d" style-hover="background:#f6f5fa">
                      <span style="flex:1;white-space:nowrap">
                        « {{ o.l }} »
                      <span style="font:400 12.5px 'Plus Jakarta Sans';color:#64626e;white-space:nowrap">
                        « {{ o.v }} »
                      <span style="width:14px;color:#6a3ee0;font-weight:700">
                        « {{ o.check }} »
                  <span style="padding:10px 12px 4px;font:600 11px 'Plus Jakarta Sans';letter-spacing:.07em;color:#8b8996">
                    « CHARGES DE RÉFÉRENCE »
                  <sc-for list="{{ chMus }}" as="o" hint-placeholder-count="4">
                    <button type="button" role="option" aria-selected="{{ o.sel }}" onClick="{{ o.pick }}" style="cursor:pointer;border:0;width:100%;min-height:40px;padding:0 12px;border-radius:10px;display:flex;align-items:center;gap:10px;text-align:left;font:500 13.5px 'Plus Jakarta Sans';background:{{ o.bg }};color:#17151d" style-hover="background:#f6f5fa">
                      <span style="flex:1;white-space:nowrap">
                        « {{ o.l }} »
                      <span style="font:400 12.5px 'Plus Jakarta Sans';color:#64626e;white-space:nowrap">
                        « {{ o.v }} »
                      <span style="width:14px;color:#6a3ee0;font-weight:700">
                        « {{ o.check }} »
            <div style="position:relative;flex:none">
              <button type="button" aria-haspopup="listbox" aria-label="Période" aria-expanded="{{ perDd.exp }}" onClick="{{ perDd.toggle }}" style="cursor:pointer;border:0;height:38px;padding:0 10px 0 12px;border-radius:10px;background:#fff;box-shadow:inset 0 0 0 1px rgba(22,18,40,.14);display:flex;align-items:center;gap:6px;font:500 13.5px 'Plus Jakarta Sans';color:#17151d;white-space:nowrap">
                « {{ perDd.l }} »
                [icône SVG] <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none;transform:{{ perDd.rot }};transition:transform .2s"><path d="M6 9l6 6 6-6"></path></svg>
              <sc-if value="{{ perDd.open }}">
                <div role="listbox" style="position:absolute;top:calc(100% + 6px);z-index:20;min-width:100%;width:max-content;max-width:min(340px, calc(100vw - 48px));padding:6px;border-radius:14px;background:#fff;box-shadow:0 16px 36px rgba(22,18,40,.16),0 0 0 1px rgba(22,18,40,.08);display:flex;flex-direction:column;gap:1px;right:0">
                  <sc-for list="{{ pers }}" as="o" hint-placeholder-count="4">
                    <button type="button" role="option" aria-selected="{{ o.sel }}" onClick="{{ o.pick }}" style="cursor:pointer;border:0;width:100%;min-height:40px;padding:0 12px;border-radius:10px;display:flex;align-items:center;gap:10px;text-align:left;font:500 13.5px 'Plus Jakarta Sans';background:{{ o.bg }};color:#17151d" style-hover="background:#f6f5fa">
                      <span style="flex:1;white-space:nowrap">
                        « {{ o.l }} »
                      <span style="font:400 12.5px 'Plus Jakarta Sans';color:#64626e;white-space:nowrap">
                        « {{ o.v }} »
                      <span style="width:14px;color:#6a3ee0;font-weight:700">
                        « {{ o.check }} »
        <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:4px 8px;margin-bottom:4px">
          <span style="font:400 12.5px/1.45 'Plus Jakarta Sans';color:#64626e;white-space:nowrap">
            « {{ ch.delta }} »
          <span style="font:700 16px 'Plus Jakarta Sans';color:{{ ch.c }};white-space:nowrap">
            « {{ ch.cur }} »
        <div style="display:grid;grid-template-columns:36px minmax(0,1fr);gap:8px;margin-top:10px">
          <div style="position:relative;height:160px">
            <sc-for list="{{ ch.ticks }}" as="t" hint-placeholder-count="5">
              <span style="position:absolute;right:0;top:{{ t.top }};transform:translateY(-50%);font:400 11px 'Plus Jakarta Sans';color:#8b8996">
                « {{ t.l }} »
          <div style="position:relative;height:160px;background-image:repeating-linear-gradient(to bottom,rgba(22,18,40,.07) 0 1px,transparent 1px 25%);border-bottom:1px solid rgba(22,18,40,.07)">
            [icône SVG] <svg viewBox="0 0 600 160" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%"><path d="{{ ch.area }}" fill="{{ ch.fill }}"></path><path d="{{ ch.path }}" fill="none" stroke="{{ ch.line }}" stroke-width="2" vector-effect="non-scaling-stroke"></path></svg>
            <sc-for list="{{ ch.pts }}" as="p" hint-placeholder-count="3">
              <span style="position:absolute;left:{{ p.x }};top:{{ p.y }};width:9px;height:9px;margin:-4.5px;border-radius:50%;background:#fff;box-shadow:inset 0 0 0 2px {{ ch.line }}">
          <span>
          <div style="display:flex;justify-content:space-between;font:400 11.5px 'Plus Jakarta Sans';color:#8b8996;white-space:nowrap">
            <sc-for list="{{ ch.xl }}" as="p" hint-placeholder-count="3">
              <span>
                « {{ p.l }} »
        <span style="font:400 12.5px 'Plus Jakarta Sans';color:#64626e">
          « {{ ch.note }} »
      <div style="display:flex;flex-direction:column;gap:8px">
        <div style="height:46px;padding:0 14px;border-radius:12px;box-shadow:inset 0 0 0 1px rgba(22,18,40,.09);display:flex;align-items:center;gap:10px;font:500 13.5px 'Plus Jakarta Sans';color:#4a4855">
          [icône SVG] <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b8996" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"></path></svg>
          « Voir les valeurs en tableau »
        <div style="height:46px;padding:0 14px;border-radius:12px;box-shadow:inset 0 0 0 1px rgba(22,18,40,.09);display:flex;align-items:center;gap:10px;font:500 13.5px 'Plus Jakarta Sans';color:#4a4855">
          [icône SVG] <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b8996" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"></path></svg>
          « Historique et corrections (4 mesures) »
        <div style="height:46px;padding:0 14px;border-radius:12px;box-shadow:inset 0 0 0 1px rgba(22,18,40,.09);display:flex;align-items:center;gap:10px;font:500 13.5px 'Plus Jakarta Sans';color:#4a4855">
          [icône SVG] <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b8996" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"></path></svg>
          « Calculer les allures depuis un test (Cooper ou 5 km) »
      <div style="height:1px;background:rgba(22,18,40,.07)">
      <span style="font:600 15px 'Plus Jakarta Sans'">
        « Ajouter une mesure »
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:16px">
        <div style="display:flex;flex-direction:column;gap:8px;min-width:0">
          <span style="font:500 13.5px 'Plus Jakarta Sans'">
            « Type de repère »
          <span style="border:0;outline:0;width:100%;border-radius:12px;box-shadow:inset 0 0 0 1px rgba(22,18,40,.12);background:#fff;color:#17151d;height:46px;padding:0 14px;display:flex;align-items:center;justify-content:space-between;gap:8px;font:400 15px 'Plus Jakarta Sans';color:#17151d">
            « Endurance (zone 2) »
            [icône SVG] <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8b8996" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"></path></svg>
        <div style="display:flex;flex-direction:column;gap:8px;min-width:0">
          <span style="font:500 13.5px 'Plus Jakarta Sans'">
            « Allure (min/km) »
          <input defaultValue="" placeholder="4:55 ou 6:40-7:15" style="border:0;outline:0;width:100%;border-radius:12px;box-shadow:inset 0 0 0 1px rgba(22,18,40,.12);background:#fff;color:#17151d;height:46px;padding:0 14px;font:400 15px 'Plus Jakarta Sans';">
          <span style="font:400 12.5px/1.45 'Plus Jakarta Sans';color:#64626e">
            « Une allure ou une plage, secondes sur deux chiffres. »
        <div style="display:flex;flex-direction:column;gap:8px;min-width:0">
          <span style="font:500 13.5px 'Plus Jakarta Sans'">
            « Date de la mesure »
          <input defaultValue="03/11/2026" placeholder="" style="border:0;outline:0;width:100%;border-radius:12px;box-shadow:inset 0 0 0 1px rgba(22,18,40,.12);background:#fff;color:#17151d;height:46px;padding:0 14px;font:400 15px 'Plus Jakarta Sans';">
        <div style="display:flex;flex-direction:column;gap:8px;min-width:0">
          <span style="font:500 13.5px 'Plus Jakarta Sans'">
            « Source »
          <div style="align-self:flex-start;display:flex;flex-wrap:wrap;padding:4px;border-radius:12px;background:#efeef4">
            <span style="height:36px;padding:0 14px;border-radius:9px;display:flex;align-items:center;font:500 13.5px 'Plus Jakarta Sans';white-space:nowrap;background:#fff;color:#17151d;box-shadow:0 1px 3px rgba(22,18,40,.10)">
              « Test »
            <span style="height:36px;padding:0 14px;border-radius:9px;display:flex;align-items:center;font:500 13.5px 'Plus Jakarta Sans';white-space:nowrap;color:#64626e">
              « Constaté »
            <span style="height:36px;padding:0 14px;border-radius:9px;display:flex;align-items:center;font:500 13.5px 'Plus Jakarta Sans';white-space:nowrap;color:#64626e">
              « Estimation coach »
        <div style="display:flex;flex-direction:column;gap:8px;min-width:0;grid-column:1/-1">
          <span style="font:500 13.5px 'Plus Jakarta Sans'">
            « Note privée du coach »
            <span style="font-weight:400;color:#8b8996">
              « (facultatif) »
          <textarea defaultValue="" placeholder="" style="border:0;outline:0;width:100%;border-radius:12px;box-shadow:inset 0 0 0 1px rgba(22,18,40,.12);background:#fff;color:#17151d;min-height:96px;padding:12px 14px;resize:vertical;font:400 15px/1.5 'Plus Jakarta Sans'">
      <span style="align-self:flex-start;height:44px;padding:0 18px;border-radius:12px;background:#17151d;color:#fff;display:flex;align-items:center;font:500 14px 'Plus Jakarta Sans';white-space:nowrap">
        « Ajouter la mesure »
    <section style="border-radius:20px;background:#fff;box-shadow:inset 0 0 0 1px rgba(22,18,40,.05);padding:22px;display:flex;flex-direction:column;gap:16px;min-width:0;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
        <div style="flex:1 1 auto;display:flex;flex-direction:column;gap:4px;min-width:0">
          <span style="font:600 17px 'Plus Jakarta Sans';letter-spacing:-.01em;white-space:nowrap">
            « Records personnels »
          <span style="font:400 13.5px/1.5 'Plus Jakarta Sans';color:#64626e;text-wrap:pretty">
            « Meilleur temps par épreuve, calculé sur toutes les performances enregistrées. Un Hyrox se compare dans sa catégorie. »
      <div style="display:flex;flex-wrap:wrap;gap:10px">
        <div style="flex:1 1 220px;padding:16px;border-radius:14px;background:#f8f7fb;display:flex;flex-direction:column;gap:6px;min-width:0">
          <span style="display:flex;align-items:center;gap:7px;font:500 13px 'Plus Jakarta Sans';color:#4a4855">
            <span style="width:7px;height:7px;flex:none;border-radius:50%;background:#7776FF">
            « 5 km »
          <span style="font:600 24px/1.1 'Plus Jakarta Sans';letter-spacing:-.02em;white-space:nowrap">
            « 23:15 »
          <span style="font:400 12.5px/1.45 'Plus Jakarta Sans';color:#64626e">
            « 4:39 min/km · 3 mai 2026 »
        <div style="flex:1 1 220px;padding:16px;border-radius:14px;background:#f8f7fb;display:flex;flex-direction:column;gap:6px;min-width:0">
          <span style="display:flex;align-items:center;gap:7px;font:500 13px 'Plus Jakarta Sans';color:#4a4855">
            <span style="width:7px;height:7px;flex:none;border-radius:50%;background:#FEC14F">
            « Hyrox Open »
          <span style="font:600 24px/1.1 'Plus Jakarta Sans';letter-spacing:-.02em;white-space:nowrap">
            « 1:21:30 »
          <span style="font:400 12.5px/1.45 'Plus Jakarta Sans';color:#64626e">
            « Hyrox Rotterdam · 26 sept. 2026 »
      <div style="height:46px;padding:0 14px;border-radius:12px;box-shadow:inset 0 0 0 1px rgba(22,18,40,.09);display:flex;align-items:center;gap:10px;font:500 13.5px 'Plus Jakarta Sans';color:#4a4855">
        [icône SVG] <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b8996" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"></path></svg>
        « Toutes les performances (3) »
      <div style="height:1px;background:rgba(22,18,40,.07)">
      <span style="font:600 15px 'Plus Jakarta Sans'">
        « Ajouter une performance »
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:16px">
        <div style="display:flex;flex-direction:column;gap:8px;min-width:0">
          <span style="font:500 13.5px 'Plus Jakarta Sans'">
            « Épreuve »
          <span style="border:0;outline:0;width:100%;border-radius:12px;box-shadow:inset 0 0 0 1px rgba(22,18,40,.12);background:#fff;color:#17151d;height:46px;padding:0 14px;display:flex;align-items:center;justify-content:space-between;gap:8px;font:400 15px 'Plus Jakarta Sans';color:#17151d">
            « 5 km »
            [icône SVG] <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8b8996" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"></path></svg>
        <div style="display:flex;flex-direction:column;gap:8px;min-width:0">
          <span style="font:500 13.5px 'Plus Jakarta Sans'">
            « Temps »
          <input defaultValue="" placeholder="21:45" style="border:0;outline:0;width:100%;border-radius:12px;box-shadow:inset 0 0 0 1px rgba(22,18,40,.12);background:#fff;color:#17151d;height:46px;padding:0 14px;font:400 15px 'Plus Jakarta Sans';">
          <span style="font:400 12.5px/1.45 'Plus Jakarta Sans';color:#64626e">
            « mm:ss ou h:mm:ss, temps officiel ou chrono final. »
        <div style="display:flex;flex-direction:column;gap:8px;min-width:0">
          <span style="font:500 13.5px 'Plus Jakarta Sans'">
            « Date de la performance »
          <input defaultValue="03/11/2026" placeholder="" style="border:0;outline:0;width:100%;border-radius:12px;box-shadow:inset 0 0 0 1px rgba(22,18,40,.12);background:#fff;color:#17151d;height:46px;padding:0 14px;font:400 15px 'Plus Jakarta Sans';">
        <div style="display:flex;flex-direction:column;gap:8px;min-width:0">
          <span style="font:500 13.5px 'Plus Jakarta Sans'">
            « Course »
            <span style="font-weight:400;color:#8b8996">
              « (facultatif) »
          <input defaultValue="" placeholder="Ex. : 20 km de Bruxelles, Hyrox Gent" style="border:0;outline:0;width:100%;border-radius:12px;box-shadow:inset 0 0 0 1px rgba(22,18,40,.12);background:#fff;color:#17151d;height:46px;padding:0 14px;font:400 15px 'Plus Jakarta Sans';">
      <span style="align-self:flex-start;height:44px;padding:0 18px;border-radius:12px;background:#17151d;color:#fff;display:flex;align-items:center;font:500 14px 'Plus Jakarta Sans';white-space:nowrap">
        « Ajouter la performance »
```
