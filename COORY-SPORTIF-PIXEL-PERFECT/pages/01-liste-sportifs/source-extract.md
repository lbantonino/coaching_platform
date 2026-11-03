# Extrait source exact — 01 Liste des sportifs (1a desktop + 1b mobile)

Généré automatiquement depuis `Coory Sportifs.dc.html` (source de vérité visuelle). Chaque ligne = un élément, indentation = imbrication. Les styles sont **exacts** (valeurs CSS inline des maquettes). Les `{{ … }}` sont des valeurs dynamiques calculées dans la logique (voir `reference/source/`). `<sc-for>` = boucle, `<sc-if>` = affichage conditionnel, `<dc-import>` = sous-composant.

```html
<div id="1a" style="display:flex;flex-direction:column;gap:14px">
  <div style="display:flex;align-items:center;gap:10px">
    <span style="font:600 12px 'Plus Jakarta Sans';padding:4px 9px;border-radius:8px;background:#17151d;color:#fff">
      « 1a »
    <span style="font:600 16px 'Plus Jakarta Sans';white-space:nowrap">
      « Desktop · 1280 »
  <div data-screen-label="Sportifs desktop" style="box-shadow:0 0 0 1px rgba(22,18,40,.16),0 24px 60px -24px rgba(22,18,40,.28);width:1280px;background:#f3f2f7;border-radius:18px;padding:14px;display:flex;gap:20px;align-items:stretch">
    <aside style="width:236px;flex:none;min-height:740px;border-radius:20px;background:#fff;padding:24px 14px 16px;display:flex;flex-direction:column;gap:2px;position:sticky;top:14px">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 10px 24px">
        [icône SVG] <svg viewBox="0 0 472 72" width="96" role="img" aria-label="Coory"><g fill="none" stroke="#17151d" stroke-width="16"><path d="M84 8H36A28 28 0 0 0 36 64H84"></path><path d="M320 72V8H352A18 18 0 0 1 352 44H320"></path><path d="M342 44L385 80"></path><path d="M394 -10L428 40L462 -10M428 40V80"></path></g><rect x="108" y="8" width="104" height="56" rx="28" fill="none" stroke="#17151d" stroke-width="16"></rect><rect x="184" y="8" width="104" height="56" rx="28" fill="none" stroke="#8b5cf6" stroke-width="16"></rect></svg>
        [icône SVG] <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#64626e" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="3"></rect><path d="M9 3v18M15 10l-2 2 2 2"></path></svg>
      <sc-for list="{{ nav1 }}" as="n" hint-placeholder-count="7">
        <span style="display:flex;align-items:center;gap:10px;height:34px;padding:0 12px;border-radius:9px;font:400 13.5px 'Plus Jakarta Sans';white-space:nowrap;background:{{ n.bg }};color:{{ n.c }}">
          [icône SVG] <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="{{ n.d }}"></path></svg>
          « {{ n.l }} »
      <div style="height:1px;background:rgba(22,18,40,.08);margin:10px 4px">
      <sc-for list="{{ nav2 }}" as="n" hint-placeholder-count="5">
        <span style="display:flex;align-items:center;gap:10px;height:34px;padding:0 12px;border-radius:9px;font:400 13.5px 'Plus Jakarta Sans';white-space:nowrap;color:#4a4855">
          [icône SVG] <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="{{ n.d }}"></path></svg>
          <span style="flex:1">
            « {{ n.l }} »
          <sc-if value="{{ n.b }}">
            <span style="min-width:20px;height:20px;border-radius:10px;background:rgba(139,92,246,.12);color:#6a3ee0;font:500 11px/20px 'Plus Jakarta Sans';text-align:center">
              « {{ n.b }} »
      <div style="flex:1">
      <div style="display:flex;align-items:center;gap:10px;padding:8px">
        <span style="position:relative;width:38px;height:38px;border-radius:50%;background:#2a2733;color:#fff;display:flex;align-items:center;justify-content:center;font:600 12px 'Plus Jakarta Sans';box-shadow:0 0 0 2px #fff,0 0 0 3.5px #8b5cf6">
          « GL »
          <span style="position:absolute;right:-2px;bottom:-2px;width:10px;height:10px;border-radius:50%;background:#15803d;box-shadow:0 0 0 2px #fff">
        <div style="flex:1;min-width:0;display:flex;flex-direction:column">
          <span style="font:600 14px 'Plus Jakarta Sans';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
            « Gianluca Lo Bianco »
          <span style="font:400 12px 'Plus Jakarta Sans';color:#64626e">
            « Coach »
    <main style="flex:1;min-width:0;display:flex;flex-direction:column;gap:16px">
      <header style="border-radius:20px;background:#fff;padding:16px 18px 16px 22px;display:flex;align-items:center;gap:10px">
        <span style="flex:1;display:flex;align-items:center;gap:10px;font:600 15px 'Plus Jakarta Sans';white-space:nowrap">
          [icône SVG] <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6a3ee0" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"></path></svg>
          « Sportifs »
        <span style="height:32px;width:200px;padding:0 6px 0 10px;border-radius:9px;box-shadow:inset 0 0 0 1px rgba(22,18,40,.12);background:#f8f7fb;display:flex;align-items:center;gap:7px;font:400 12.5px 'Plus Jakarta Sans';color:#64626e">
          [icône SVG] <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3"></path></svg>
          <span style="flex:1;white-space:nowrap">
            « Rechercher dans Coory »
          <span style="font:500 10px 'Plus Jakarta Sans';padding:2px 5px;border-radius:5px;box-shadow:inset 0 0 0 1px rgba(22,18,40,.14)">
            « ⌘K »
        <span style="height:32px;padding:0 12px;border-radius:9px;background:#8b5cf6;color:#fff;display:flex;align-items:center;gap:6px;font:500 12.5px 'Plus Jakarta Sans';white-space:nowrap">
          [icône SVG] <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><path d="M12 2l2.2 6.1L20 10l-5.8 2L12 18l-2.2-6L4 10l5.8-1.9z"></path></svg>
          « Assistant IA »
        <span style="position:relative;width:32px;height:32px;border-radius:9px;box-shadow:inset 0 0 0 1px rgba(22,18,40,.12);display:flex;align-items:center;justify-content:center">
          [icône SVG] <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0"></path></svg>
          <span style="position:absolute;top:-6px;right:-6px;width:16px;height:16px;border-radius:50%;background:#8b5cf6;color:#fff;font:600 9.5px/16px 'Plus Jakarta Sans';text-align:center">
            « 6 »
        <span style="height:32px;padding:0 14px;border-radius:9px;background:#17151d;color:#fff;display:flex;align-items:center;gap:6px;font:500 12.5px 'Plus Jakarta Sans';white-space:nowrap">
          [icône SVG] <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"></path></svg>
          « Nouveau sportif »
      <section style="border-radius:20px;background:#fff;box-shadow:inset 0 0 0 1px rgba(22,18,40,.05);display:flex;flex-direction:column">
        <div style="padding:26px 24px 18px;display:flex;flex-direction:column;gap:18px">
          <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:16px">
            <div style="display:flex;gap:10px">
              <div style="position:relative;width:220px">
                <button type="button" onClick="{{ dd_stD.toggle }}" aria-expanded="{{ dd_stD.exp }}" style="cursor:pointer;width:100%;min-height:52px;padding:7px 14px;border:0;border-radius:12px;background:#fff;box-shadow:{{ dd_stD.ring }};display:flex;align-items:center;gap:8px;text-align:left;color:#17151d">
                  <span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px">
                    <span style="font:400 12.5px 'Plus Jakarta Sans';color:#64626e">
                      « Statut »
                    <span style="font:600 15px 'Plus Jakarta Sans';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                      « {{ dd_stD.val }} »
                  [icône SVG] <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64626e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none;transform:{{ dd_stD.rot }};transition:transform .2s"><path d="M6 9l6 6 6-6"></path></svg>
                <sc-if value="{{ dd_stD.open }}">
                  <div role="listbox" style="position:absolute;left:0;right:0;top:58px;z-index:5;padding:6px;border-radius:14px;background:#fff;box-shadow:0 14px 34px rgba(22,18,40,.16),0 0 0 1px rgba(22,18,40,.06);display:flex;flex-direction:column">
                    <sc-for list="{{ dd_stD.opts }}" as="o" hint-placeholder-count="4">
                      <button type="button" onClick="{{ o.pick }}" style="cursor:pointer;border:0;min-height:44px;padding:0 10px;border-radius:9px;display:flex;align-items:center;gap:8px;text-align:left;font:500 14px 'Plus Jakarta Sans';background:{{ o.bg }};color:{{ o.c }}">
                        <span style="width:7px;height:7px;flex:none;border-radius:50%;background:{{ o.dot }}">
                        <span style="flex:1;white-space:nowrap">
                          « {{ o.l }} »
                        <span style="font:500 12.5px 'Plus Jakarta Sans';color:#8b8996">
                          « {{ o.n }} »
              <div style="position:relative;width:220px">
                <button type="button" onClick="{{ dd_progD.toggle }}" aria-expanded="{{ dd_progD.exp }}" style="cursor:pointer;width:100%;min-height:52px;padding:7px 14px;border:0;border-radius:12px;background:#fff;box-shadow:{{ dd_progD.ring }};display:flex;align-items:center;gap:8px;text-align:left;color:#17151d">
                  <span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px">
                    <span style="font:400 12.5px 'Plus Jakarta Sans';color:#64626e">
                      « Programme »
                    <span style="font:600 15px 'Plus Jakarta Sans';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                      « {{ dd_progD.val }} »
                  [icône SVG] <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64626e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none;transform:{{ dd_progD.rot }};transition:transform .2s"><path d="M6 9l6 6 6-6"></path></svg>
                <sc-if value="{{ dd_progD.open }}">
                  <div role="listbox" style="position:absolute;left:0;right:0;top:58px;z-index:5;padding:6px;border-radius:14px;background:#fff;box-shadow:0 14px 34px rgba(22,18,40,.16),0 0 0 1px rgba(22,18,40,.06);display:flex;flex-direction:column">
                    <sc-for list="{{ dd_progD.opts }}" as="o" hint-placeholder-count="4">
                      <button type="button" onClick="{{ o.pick }}" style="cursor:pointer;border:0;min-height:44px;padding:0 10px;border-radius:9px;display:flex;align-items:center;gap:8px;text-align:left;font:500 14px 'Plus Jakarta Sans';background:{{ o.bg }};color:{{ o.c }}">
                        <span style="width:7px;height:7px;flex:none;border-radius:50%;background:{{ o.dot }}">
                        <span style="flex:1;white-space:nowrap">
                          « {{ o.l }} »
                        <span style="font:500 12.5px 'Plus Jakarta Sans';color:#8b8996">
                          « {{ o.n }} »
            <label style="width:320px;height:52px;border-radius:12px;padding:0 12px;border-radius:11px;box-shadow:inset 0 0 0 1px rgba(22,18,40,.12);display:flex;align-items:center;gap:8px;color:#64626e">
              [icône SVG] <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3"></path></svg>
              <input value="{{ q }}" onChange="{{ setQ }}" placeholder="Rechercher un sportif" style="flex:1;min-width:0;border:0;outline:0;background:transparent;font:400 14px 'Plus Jakarta Sans';color:#17151d">
        <sc-if value="{{ hasSel }}">
          <div style="margin:0 16px 10px;padding:0 8px 0 16px;height:46px;border-radius:12px;background:#17151d;color:#fff;display:flex;align-items:center;gap:8px;font:500 13.5px 'Plus Jakarta Sans'">
            <span style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
              « {{ selLabel }} »
            <span style="flex:none;white-space:nowrap;height:32px;padding:0 12px;border-radius:8px;display:flex;align-items:center;background:rgba(255,255,255,.1)">
              « Changer le statut »
            <span style="flex:none;white-space:nowrap;height:32px;padding:0 12px;border-radius:8px;display:flex;align-items:center;background:rgba(255,255,255,.1)">
              « Changer le programme »
            <span style="flex:none;white-space:nowrap;height:32px;padding:0 12px;border-radius:8px;display:flex;align-items:center;background:rgba(255,255,255,.1)">
              « Inviter »
            <button type="button" onClick="{{ clearSel }}" style="cursor:pointer;border:0;height:32px;padding:0 12px;border-radius:8px;background:transparent;color:#c9c7d1;font:500 13.5px 'Plus Jakarta Sans'">
              « Annuler »
        <div style="display:grid;grid-template-columns:20px minmax(0,1.7fr) minmax(0,.8fr) minmax(0,1fr) minmax(0,1.6fr) 150px;gap:16px;align-items:center;padding:10px 24px;border-top:1px solid rgba(22,18,40,.07);border-bottom:1px solid rgba(22,18,40,.07);background:#faf9fc;font:500 12.5px 'Plus Jakarta Sans';color:#64626e">
          <button type="button" onClick="{{ toggleAll }}" aria-label="Tout sélectionner" style="cursor:pointer;width:18px;height:18px;padding:0;border:0;border-radius:6px;box-shadow:inset 0 0 0 1.5px {{ allBd }};background:{{ allBg }};color:#fff;font:700 11px/18px 'Plus Jakarta Sans'">
            « {{ allMark }} »
          <button type="button" onClick="{{ sort_name.on }}" style="cursor:pointer;border:0;background:transparent;padding:0;display:flex;align-items:center;gap:5px;font:500 12.5px 'Plus Jakarta Sans';color:{{ sort_name.c }};white-space:nowrap">
            « Sportif »
            <span style="font:600 11px 'Plus Jakarta Sans';color:{{ sort_name.ac }}">
              « {{ sort_name.arrow }} »
          <button type="button" onClick="{{ sort_st.on }}" style="cursor:pointer;border:0;background:transparent;padding:0;display:flex;align-items:center;gap:5px;font:500 12.5px 'Plus Jakarta Sans';color:{{ sort_st.c }};white-space:nowrap">
            « Statut »
            <span style="font:600 11px 'Plus Jakarta Sans';color:{{ sort_st.ac }}">
              « {{ sort_st.arrow }} »
          <button type="button" onClick="{{ sort_prog.on }}" style="cursor:pointer;border:0;background:transparent;padding:0;display:flex;align-items:center;gap:5px;font:500 12.5px 'Plus Jakarta Sans';color:{{ sort_prog.c }};white-space:nowrap">
            « Programme »
            <span style="font:600 11px 'Plus Jakarta Sans';color:{{ sort_prog.ac }}">
              « {{ sort_prog.arrow }} »
          <button type="button" onClick="{{ sort_obj.on }}" style="cursor:pointer;border:0;background:transparent;padding:0;display:flex;align-items:center;gap:5px;font:500 12.5px 'Plus Jakarta Sans';color:{{ sort_obj.c }};white-space:nowrap">
            « Objectif »
            <span style="font:600 11px 'Plus Jakarta Sans';color:{{ sort_obj.ac }}">
              « {{ sort_obj.arrow }} »
          <span style="text-align:right">
            « Actions »
        <sc-for list="{{ rows }}" as="r" hint-placeholder-count="10">
          <div style="display:grid;grid-template-columns:20px minmax(0,1.7fr) minmax(0,.8fr) minmax(0,1fr) minmax(0,1.6fr) 150px;gap:16px;align-items:center;min-height:68px;padding:10px 24px;border-bottom:1px solid rgba(22,18,40,.06);background:{{ r.rowBg }};cursor:pointer" style-hover="background:#faf9fc">
            <button type="button" onClick="{{ r.toggle }}" aria-label="Sélectionner" style="cursor:pointer;width:18px;height:18px;padding:0;border:0;border-radius:6px;box-shadow:inset 0 0 0 1.5px {{ r.ckBd }};background:{{ r.ckBg }};color:#fff;font:700 11px/18px 'Plus Jakarta Sans'">
              « {{ r.mark }} »
            <div style="display:flex;align-items:center;gap:12px;min-width:0">
              <span style="width:40px;height:40px;flex:none;border-radius:50%;background:{{ r.av }};display:flex;align-items:center;justify-content:center;font:600 13px 'Plus Jakarta Sans';color:#2a2733">
                « {{ r.ini }} »
              <div style="min-width:0;display:flex;flex-direction:column;gap:2px">
                <span style="display:flex;align-items:center;gap:6px;min-width:0">
                  <span style="font:600 14.5px 'Plus Jakarta Sans';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                    « {{ r.name }} »
                  <span style="flex:none;font:500 12px 'Plus Jakarta Sans';color:{{ r.sexC }}">
                    « {{ r.sex }} »
                <span style="font:400 13px 'Plus Jakarta Sans';color:{{ r.lvlC }};white-space:nowrap">
                  « {{ r.lvl }} »
            <span style="display:flex;align-items:center;gap:7px;font:400 13.5px 'Plus Jakarta Sans';color:#17151d;white-space:nowrap">
              <span style="width:7px;height:7px;border-radius:50%;background:{{ r.stC }}">
              « {{ r.st }} »
            <div>
              <sc-if value="{{ r.hasProg }}">
                <span style="display:inline-flex;align-items:center;gap:7px;font:500 13.5px 'Plus Jakarta Sans';color:#17151d;white-space:nowrap">
                  <span style="width:8px;height:8px;border-radius:50%;background:{{ r.dC }}">
                  « {{ r.disc }} »
              <sc-if value="{{ r.noProg }}">
                <span style="display:inline-flex;align-items:center;height:30px;padding:0 12px;border-radius:9px;box-shadow:inset 0 0 0 1px rgba(22,18,40,.16);border:0;font:500 13px 'Plus Jakarta Sans';color:#4a4855;background-image:none;outline:1px dashed rgba(22,18,40,.22);outline-offset:-1px">
                  « Choisir »
            <div style="display:flex;align-items:center;gap:12px;min-width:0">
              <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px">
                <span style="font:500 14px 'Plus Jakarta Sans';color:{{ r.d1C }};white-space:nowrap">
                  « {{ r.d1 }} »
                <span style="font:400 13px 'Plus Jakarta Sans';color:#64626e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                  « {{ r.goal }} »
            <div style="display:flex;align-items:center;justify-content:flex-end;gap:6px">
              <sc-if value="{{ r.inv }}">
                <span style="height:32px;padding:0 12px;border-radius:9px;box-shadow:inset 0 0 0 1px rgba(22,18,40,.14);display:flex;align-items:center;font:500 13px 'Plus Jakarta Sans'">
                  « Inviter »
              <sc-if value="{{ r.pend }}">
                <span style="height:32px;padding:0 10px;display:flex;align-items:center;gap:6px;font:400 12.5px 'Plus Jakarta Sans';color:#64626e;white-space:nowrap">
                  [icône SVG] <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM3 7l9 6 9-6"></path></svg>
                  « Invité »
              <sc-if value="{{ r.msg }}">
                <span aria-label="Écrire" style="width:32px;height:32px;border-radius:9px;box-shadow:inset 0 0 0 1px rgba(22,18,40,.14);display:flex;align-items:center;justify-content:center">
                  [icône SVG] <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8.5 8.5 0 0 1-12.4 7.5L3 21l1.5-5.6A8.5 8.5 0 1 1 21 12z"></path></svg>
              <span aria-label="Plus d'actions" style="width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;font:700 14px 'Plus Jakarta Sans';color:#4a4855" style-hover="background:#efeef4">
                « ··· »
        <sc-if value="{{ empty }}">
          <div style="padding:48px 24px;display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center">
            <span style="font:600 15px 'Plus Jakarta Sans'">
              « Aucun sportif trouvé »
            <span style="font:400 13.5px 'Plus Jakarta Sans';color:#64626e">
              « Essaie un autre filtre ou une autre recherche. »
        <div style="padding:14px 24px;display:flex;justify-content:space-between;font:400 13px 'Plus Jakarta Sans';color:#64626e">
          <span>
            « {{ footer }} »
          <span>
            « {{ sortLabel }} »
<div id="1b" style="display:flex;flex-direction:column;gap:14px">
  <div style="display:flex;align-items:center;gap:10px">
    <span style="font:600 12px 'Plus Jakarta Sans';padding:4px 9px;border-radius:8px;background:#17151d;color:#fff">
      « 1b »
    <span style="font:600 16px 'Plus Jakarta Sans';white-space:nowrap">
      « Mobile · 390 »
  <div data-screen-label="Sportifs mobile" style="box-shadow:0 0 0 1px rgba(22,18,40,.16),0 24px 60px -24px rgba(22,18,40,.28);position:relative;width:390px;min-height:844px;background:#f3f2f7;border-radius:36px;overflow:hidden">
    <div style="display:flex;align-items:center;gap:10px;padding:10px 12px 0">
      <span style="width:44px;height:44px;border-radius:14px;background:#fff;display:flex;align-items:center;justify-content:center">
        [icône SVG] <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"></path></svg>
      <span style="flex:1;display:flex;align-items:center;gap:9px;padding-left:4px;font:500 16px 'Plus Jakarta Sans';letter-spacing:-.01em;white-space:nowrap">
        [icône SVG] <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6a3ee0" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"></path></svg>
        « Sportifs »
      <span style="display:flex;gap:4px;padding:4px;border-radius:16px;background:#fff">
        <span style="width:40px;height:40px;border-radius:12px;background:#8b5cf6;display:flex;align-items:center;justify-content:center">
          [icône SVG] <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M12 2l2.2 6.1L20 10l-5.8 2L12 18l-2.2-6L4 10l5.8-1.9z"></path></svg>
        <span style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center">
          [icône SVG] <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0"></path></svg>
          <span style="position:absolute;top:4px;right:4px;width:15px;height:15px;border-radius:50%;background:#8b5cf6;color:#fff;font:600 9px/15px 'Plus Jakarta Sans';text-align:center">
            « 4 »
        <span aria-label="Nouveau sportif" style="width:40px;height:40px;border-radius:12px;background:#17151d;color:#fff;display:flex;align-items:center;justify-content:center">
          [icône SVG] <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"></path></svg>
    <div style="padding:18px 14px 28px;display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;flex-direction:column;gap:4px;padding:0 4px 4px">
        <span style="font:400 14px 'Plus Jakarta Sans';color:#4a4855;white-space:nowrap">
          « {{ summary }} »
      <label style="height:48px;padding:0 14px;border-radius:14px;background:#fff;box-shadow:inset 0 0 0 1px rgba(22,18,40,.05);display:flex;align-items:center;gap:10px;color:#64626e">
        [icône SVG] <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3"></path></svg>
        <input value="{{ q }}" onChange="{{ setQ }}" placeholder="Rechercher un sportif" style="flex:1;min-width:0;border:0;outline:0;background:transparent;font:400 16px 'Plus Jakarta Sans';color:#17151d">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div style="position:relative;min-width:0">
          <button type="button" onClick="{{ dd_st.toggle }}" aria-expanded="{{ dd_st.exp }}" style="cursor:pointer;width:100%;min-height:60px;padding:10px 14px;border:0;border-radius:16px;background:#fff;box-shadow:{{ dd_st.ring }};display:flex;align-items:center;gap:8px;text-align:left;color:#17151d">
            <span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px">
              <span style="font:400 12.5px 'Plus Jakarta Sans';color:#64626e">
                « Statut »
              <span style="font:600 15px 'Plus Jakarta Sans';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                « {{ dd_st.val }} »
            [icône SVG] <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64626e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none;transform:{{ dd_st.rot }};transition:transform .2s"><path d="M6 9l6 6 6-6"></path></svg>
          <sc-if value="{{ dd_st.open }}">
            <div role="listbox" style="position:absolute;left:0;right:0;top:66px;z-index:5;padding:6px;border-radius:14px;background:#fff;box-shadow:0 14px 34px rgba(22,18,40,.16),0 0 0 1px rgba(22,18,40,.06);display:flex;flex-direction:column">
              <sc-for list="{{ dd_st.opts }}" as="o" hint-placeholder-count="4">
                <button type="button" onClick="{{ o.pick }}" style="cursor:pointer;border:0;min-height:44px;padding:0 10px;border-radius:9px;display:flex;align-items:center;gap:8px;text-align:left;font:500 14px 'Plus Jakarta Sans';background:{{ o.bg }};color:{{ o.c }}">
                  <span style="width:7px;height:7px;flex:none;border-radius:50%;background:{{ o.dot }}">
                  <span style="flex:1;white-space:nowrap">
                    « {{ o.l }} »
                  <span style="font:500 12.5px 'Plus Jakarta Sans';color:#8b8996">
                    « {{ o.n }} »
        <div style="position:relative;min-width:0">
          <button type="button" onClick="{{ dd_prog.toggle }}" aria-expanded="{{ dd_prog.exp }}" style="cursor:pointer;width:100%;min-height:60px;padding:10px 14px;border:0;border-radius:16px;background:#fff;box-shadow:{{ dd_prog.ring }};display:flex;align-items:center;gap:8px;text-align:left;color:#17151d">
            <span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px">
              <span style="font:400 12.5px 'Plus Jakarta Sans';color:#64626e">
                « Programme »
              <span style="font:600 15px 'Plus Jakarta Sans';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                « {{ dd_prog.val }} »
            [icône SVG] <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64626e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none;transform:{{ dd_prog.rot }};transition:transform .2s"><path d="M6 9l6 6 6-6"></path></svg>
          <sc-if value="{{ dd_prog.open }}">
            <div role="listbox" style="position:absolute;left:0;right:0;top:66px;z-index:5;padding:6px;border-radius:14px;background:#fff;box-shadow:0 14px 34px rgba(22,18,40,.16),0 0 0 1px rgba(22,18,40,.06);display:flex;flex-direction:column">
              <sc-for list="{{ dd_prog.opts }}" as="o" hint-placeholder-count="4">
                <button type="button" onClick="{{ o.pick }}" style="cursor:pointer;border:0;min-height:44px;padding:0 10px;border-radius:9px;display:flex;align-items:center;gap:8px;text-align:left;font:500 14px 'Plus Jakarta Sans';background:{{ o.bg }};color:{{ o.c }}">
                  <span style="width:7px;height:7px;flex:none;border-radius:50%;background:{{ o.dot }}">
                  <span style="flex:1;white-space:nowrap">
                    « {{ o.l }} »
                  <span style="font:500 12.5px 'Plus Jakarta Sans';color:#8b8996">
                    « {{ o.n }} »
      <section style="border-radius:20px;background:#fff;box-shadow:inset 0 0 0 1px rgba(22,18,40,.05);overflow:hidden">
        <div style="display:flex;align-items:center;gap:12px;min-height:56px;padding:0 14px 0 16px;border-bottom:1px solid rgba(22,18,40,.07);background:#faf9fc">
          <button type="button" onClick="{{ toggleAll }}" aria-label="Tout sélectionner" style="cursor:pointer;flex:none;width:44px;height:44px;margin:-10px -8px -10px -12px;padding:0;border:0;background:transparent;display:flex;align-items:center;justify-content:center">
            <span style="width:22px;height:22px;border-radius:7px;box-shadow:inset 0 0 0 1.5px {{ allBd }};background:{{ allBg }};color:#fff;display:flex;align-items:center;justify-content:center;font:700 12px 'Plus Jakarta Sans'">
              « {{ allMark }} »
          <span style="flex:1;font:500 14px 'Plus Jakarta Sans';color:#4a4855">
            « {{ selHead }} »
        <sc-if value="{{ hasSel }}">
          <div style="display:flex;gap:8px;padding:10px 14px;border-bottom:1px solid rgba(22,18,40,.07);overflow-x:auto;scrollbar-width:none">
            <span style="flex:none;height:40px;padding:0 14px;border-radius:11px;background:#17151d;color:#fff;display:flex;align-items:center;font:500 13.5px 'Plus Jakarta Sans';white-space:nowrap">
              « Changer le statut »
            <span style="flex:none;height:40px;padding:0 14px;border-radius:11px;background:#17151d;color:#fff;display:flex;align-items:center;font:500 13.5px 'Plus Jakarta Sans';white-space:nowrap">
              « Changer le programme »
            <button type="button" onClick="{{ clearSel }}" style="flex:none;cursor:pointer;border:0;height:40px;padding:0 12px;border-radius:11px;background:transparent;font:500 13.5px 'Plus Jakarta Sans';color:#64626e">
              « Annuler »
        <sc-for list="{{ rows }}" as="r" hint-placeholder-count="8">
          <div style="display:flex;flex-direction:column;gap:12px;padding:16px 14px 16px 16px;border-bottom:1px solid rgba(22,18,40,.07);background:{{ r.rowBg }}">
            <div style="display:flex;align-items:center;gap:12px">
              <button type="button" onClick="{{ r.toggle }}" aria-label="Sélectionner" style="cursor:pointer;flex:none;width:44px;height:44px;margin:-10px -8px -10px -12px;padding:0;border:0;background:transparent;display:flex;align-items:center;justify-content:center">
                <span style="width:22px;height:22px;border-radius:7px;box-shadow:inset 0 0 0 1.5px {{ r.ckBd }};background:{{ r.ckBg }};color:#fff;display:flex;align-items:center;justify-content:center;font:700 12px 'Plus Jakarta Sans'">
                  « {{ r.mark }} »
              <span style="width:44px;height:44px;flex:none;border-radius:50%;background:{{ r.av }};display:flex;align-items:center;justify-content:center;font:600 13.5px 'Plus Jakarta Sans';color:#2a2733">
                « {{ r.ini }} »
              <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px">
                <span style="display:flex;align-items:center;gap:6px;min-width:0">
                  <span style="font:600 15.5px 'Plus Jakarta Sans';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                    « {{ r.name }} »
                  <span style="flex:none;font:500 12px 'Plus Jakarta Sans';color:{{ r.sexC }}">
                    « {{ r.sex }} »
                <span style="display:flex;align-items:center;gap:8px;font:400 13px 'Plus Jakarta Sans';color:#4a4855;white-space:nowrap">
                  <span style="display:flex;align-items:center;gap:5px">
                    <span style="width:6px;height:6px;border-radius:50%;background:{{ r.stC }}">
                    « {{ r.st }} »
                  <span style="color:#c9c7d1">
                    « · »
                  <span style="display:flex;align-items:center;gap:5px;color:#4a4855">
                    <span style="width:6px;height:6px;border-radius:50%;background:{{ r.dCm }}">
                    « {{ r.discM }} »
              <span aria-label="Actions" style="flex:none;width:40px;height:40px;border-radius:11px;box-shadow:inset 0 0 0 1px rgba(22,18,40,.12);display:flex;align-items:center;justify-content:center;font:700 14px 'Plus Jakarta Sans';color:#17151d">
                « ··· »
            <sc-if value="{{ r.hasGoal }}">
              <div style="margin-left:46px;margin-right:52px;display:flex;align-items:center;gap:10px;padding:9px 12px 9px 9px;border-radius:12px;background:#f6f5fa">
                <span style="width:30px;height:30px;flex:none;border-radius:9px;background:rgba(139,92,246,.10);display:flex;align-items:center;justify-content:center">
                  [icône SVG] <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6a3ee0" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"></path></svg>
                <span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:1px">
                  <span style="font:500 13.5px 'Plus Jakarta Sans';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                    « {{ r.goal }} »
                  <span style="font:400 12.5px 'Plus Jakarta Sans';color:#64626e;white-space:nowrap">
                    « {{ r.dShort }} »
            <sc-if value="{{ r.noGoal }}">
              <span style="margin-left:46px;font:400 13px 'Plus Jakarta Sans';color:#8b8996">
                « Aucun objectif »
        <sc-if value="{{ empty }}">
          <div style="padding:40px 20px;display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center">
            <span style="font:600 15px 'Plus Jakarta Sans'">
              « Aucun sportif trouvé »
            <span style="font:400 13.5px 'Plus Jakarta Sans';color:#64626e">
              « Essaie un autre filtre ou une autre recherche. »
```
