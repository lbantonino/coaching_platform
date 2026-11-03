# Extrait source exact — Coque des fiches (sidebar desktop, header desktop, barre mobile) — commune à 2a→2k

Généré automatiquement depuis `Coory Sportifs.dc.html` (source de vérité visuelle). Chaque ligne = un élément, indentation = imbrication. Les styles sont **exacts** (valeurs CSS inline des maquettes). Les `{{ … }}` sont des valeurs dynamiques calculées dans la logique (voir `reference/source/`). `<sc-for>` = boucle, `<sc-if>` = affichage conditionnel, `<dc-import>` = sous-composant.

```html
<section style="display:flex;flex-direction:column;gap:64px">
  <div style="display:flex;flex-direction:column;gap:8px">
    <span style="font:600 13px 'Plus Jakarta Sans';letter-spacing:.09em;color:#8b8996">
      « FICHE SPORTIF »
    <h2 style="margin:0;font:600 34px 'Plus Jakarta Sans';letter-spacing:-.025em">
      « Inès Benali · onglets et détail d’une séance, desktop et mobile »
    <span style="font:400 15px 'Plus Jakarta Sans';color:#4a4855">
      « Chaque ligne ouvre un onglet ; les onglets restent cliquables dans chaque écran. Le contenu de l’onglet Programme n’a pas été redessiné. »
  <sc-for list="{{ fiches }}" as="f" hint-placeholder-count="2">
    <div id="{{ f.id }}" style="display:flex;flex-direction:column;gap:14px">
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font:600 12px 'Plus Jakarta Sans';padding:4px 9px;border-radius:8px;background:#17151d;color:#fff">
          « {{ f.id }} »
        <span style="font:600 16px 'Plus Jakarta Sans';white-space:nowrap">
          « Fiche · {{ f.label }} »
      <div style="display:flex;gap:48px;align-items:flex-start">
        <div data-screen-label="Fiche {{ f.label }} desktop" style="box-shadow:0 0 0 1px rgba(22,18,40,.16),0 24px 60px -24px rgba(22,18,40,.28);width:1280px;background:#f3f2f7;border-radius:18px;padding:14px;display:flex;gap:20px;align-items:stretch">
          <aside style="width:236px;flex:none;min-height:740px;border-radius:20px;background:#fff;padding:24px 14px 16px;display:flex;flex-direction:column;gap:2px;">
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
              <span style="flex:1">
                <span style="display:flex;align-items:center;gap:6px;font:400 14px 'Plus Jakarta Sans';color:#4a4855;white-space:nowrap">
                  [icône SVG] <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"></path></svg>
                  « {{ f.back }} »
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
              <sc-if value="{{ f.notSeance }}" hint-placeholder-val="{{ true }}">
                <span style="height:32px;padding:0 14px;border-radius:9px;background:#17151d;color:#fff;display:flex;align-items:center;gap:6px;font:500 12.5px 'Plus Jakarta Sans';white-space:nowrap">
                  [icône SVG] <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"></path></svg>
                  « Créer »
                <span style="width:32px;height:32px;border-radius:9px;box-shadow:inset 0 0 0 1px rgba(22,18,40,.12);display:flex;align-items:center;justify-content:center;font:700 14px 'Plus Jakarta Sans'">
                  « ··· »
            <sc-if value="{{ f.notSeance }}" hint-placeholder-val="{{ true }}">
              <div style="flex:1;display:grid;grid-template-rows:minmax(0,1fr);min-height:0">
                <dc-import name="CooryFicheSportif" tab="{{ f.key }}" hint-size="100%,900px">
            <sc-if value="{{ f.seance }}">
              <div style="flex:1;display:grid;grid-template-rows:minmax(0,1fr);min-height:0">
                <dc-import name="CooryFicheSeance" hint-size="100%,660px">
        <div data-screen-label="Fiche {{ f.label }} mobile" style="box-shadow:0 0 0 1px rgba(22,18,40,.16),0 24px 60px -24px rgba(22,18,40,.28);position:relative;width:390px;background:#f3f2f7;border-radius:36px;overflow:hidden">
          <div style="display:flex;align-items:center;gap:10px;padding:10px 12px 0">
            <span style="width:44px;height:44px;border-radius:14px;background:#fff;display:flex;align-items:center;justify-content:center">
              [icône SVG] <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"></path></svg>
            <span style="flex:1;display:flex;align-items:center;gap:7px;padding-left:4px;font:500 15px 'Plus Jakarta Sans';color:#64626e;white-space:nowrap">
              [icône SVG] <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"></path></svg>
              « {{ f.back }} »
            <span style="display:flex;gap:4px;padding:4px;border-radius:16px;background:#fff">
              <span style="width:40px;height:40px;border-radius:12px;background:#8b5cf6;display:flex;align-items:center;justify-content:center">
                [icône SVG] <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M12 2l2.2 6.1L20 10l-5.8 2L12 18l-2.2-6L4 10l5.8-1.9z"></path></svg>
              <span style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center">
                [icône SVG] <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0"></path></svg>
                <span style="position:absolute;top:4px;right:4px;width:15px;height:15px;border-radius:50%;background:#8b5cf6;color:#fff;font:600 9px/15px 'Plus Jakarta Sans';text-align:center">
                  « 4 »
              <sc-if value="{{ f.notSeance }}" hint-placeholder-val="{{ true }}">
                <span aria-label="Créer" style="width:40px;height:40px;border-radius:12px;background:#17151d;color:#fff;display:flex;align-items:center;justify-content:center">
                  [icône SVG] <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"></path></svg>
          <div style="padding:16px 14px 28px;display:flex;flex-direction:column;gap:12px">
            <sc-if value="{{ f.notSeance }}" hint-placeholder-val="{{ true }}">
              <dc-import name="CooryFicheSportif" tab="{{ f.key }}" mobile="{{ true }}" hint-size="100%,900px">
            <sc-if value="{{ f.seance }}">
              <dc-import name="CooryFicheSeance" mobile="{{ true }}" hint-size="100%,900px">
```
