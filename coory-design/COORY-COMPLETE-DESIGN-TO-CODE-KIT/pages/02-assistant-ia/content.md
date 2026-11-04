# 02 · Assistant IA — contenu (textes)

> Extraction automatique du fichier source. **Statiques** = textes du gabarit (libellés d’interface, à reprendre tels quels). **Données de démo** = valeurs du fichier `logic.js` (noms, montants, dates, listes) : elles illustrent la maquette et doivent être remplacées par les données réelles de COORY.

## Textes statiques du gabarit

- body{margin:0;background:#dcdbe3}*{box-sizing:border-box}a{color:#6a3ee0;text-decoration:none}a:hover{color:#8b5cf6}textarea::placeholder{color:#8b8996}::-webkit-scrollbar{display:none}
- NOTE
- À reporter dans le brief Claude Code
- NOUVELLE FONCTIONNALITÉ
- : ouvre une boîte de dialogue par-dessus n’importe quelle page. Desktop : panneau centré sur l’écran (marges gauche et droite égales), juste sous la barre du haut ; une petite pointe le relie au bouton, qui reste allumé. Mobile : panneau clair qui descend juste sous le bouton (petite pointe vers le bouton, qui reste allumé), détaché des bords. Les raccourcis sont dans le « + ». La page derrière s’assombrit ; toucher le fond ou Échap ferme.
- Bouton « Assistant IA » de la barre du haut
- : ouvre la page complète, avec l’historique des conversations.
- « Assistant IA » dans le menu de gauche
- « Plein écran » dans la boîte fait passer la conversation en cours sur la page complète.
- L’assistant ne fait jamais rien seul : il propose des actions à cocher, le coach valide.
- 1a
- Boîte de dialogue · desktop
- Ouvert depuis le bouton du haut, par-dessus le tableau de bord
- GL
- Gianluca Lo Bianco
- Coach
- Tableau de bord
- Rechercher dans Coory
- ⌘K
- Assistant IA
- 9
- Mercredi 4 novembre
- Bonjour Gianluca
- Aujourd’hui
- Tâches
- Plein écran
- ACTIONS PROPOSÉES
- Que veux-tu faire, Gianluca ?
- Je prépare, tu valides. Rien n’est modifié sans ton accord.
- Entrée pour envoyer · Échap pour fermer
- 1b
- Boîte de dialogue · mobile
- Coory IA
- Je prépare, tu valides.
- 1c
- Page Assistant IA · desktop
- Ouverte depuis « Assistant IA » dans le menu de gauche
- Nouvelle conversation
- Bonjour Gianluca.
- Comment puis-je t’aider ?
- Je prépare tes programmes, ton agenda et ton admin. Tu valides.
- 1d
- Page Assistant IA · mobile

## Placeholders

- Demande à ton assistant…
- Demande à Coory…
- Répondre…

## Libellés d’accessibilité (aria-label)

- Coory
- Assistant IA
- Fermer
- Message à l’assistant
- Joindre un fichier
- Dicter
- Envoyer
- Plein écran
- Plus d’options
- Historique
- Nouvelle conversation

## Chaînes de la logique (libellés dynamiques + données de démo)

- , dlgM: 
- , pageD: 
- , pageM: 
-  } };
  iaBtnRef = React.createRef();
  componentDidUpdate() { this.measure(); }
  measure() { const b = this.iaBtnRef.current; if (!b) return; const fr = b.closest(
- ); const d = fr && fr.querySelector(
- ); if (!d) return; const br = b.getBoundingClientRect(), dr = d.getBoundingClientRect(), sc = dr.width / d.offsetWidth || 1; const v = Math.round((dr.right - (br.left + br.width / 2)) / sc - 8) + 
- ) this.setState({ dlgD: false, dlgM: false }); }; window.addEventListener(
- , this.onEsc); }
  componentWillUnmount() { window.removeEventListener(
- , this.onEsc); }
  reply(text) {
    const t = text.toLowerCase();
    const R = /résum|resum|inès|ines/.test(t) ? [
- ]]
      : /séance|seance|planifi|agenda/.test(t) ? [
- ]]
      : /paiement|factur|relanc|€/.test(t) ? [
- ]]
      : /programme|bloc/.test(t) ? [
-  + text.slice(0, 48) + 
-  }) }));
  }
  chat(k) {
    const s = this.state, msgs = s.chats[k], d = s.drafts[k];
    return {
      ref: this.refs[k], draft: d, cantSend: !d.trim(), sendBg: d.trim() ? 
- , sendBgD: d.trim() ? 
- ,
      setDraft: e => { const v = e.target.value; this.setState(p => ({ drafts: Object.assign({}, p.drafts, { [k]: v }) })); },
      onKey: e => { if (e.key === 
- , mark: a.ck ? 
- , bd: m.done ? (a.ck ? 
- ), bg: a.ck ? (m.done ? 
- , tc: m.done && !a.ck ? 
- , dec: m.done && !a.ck ? 
- , toggle: () => { if (!m.done) upd(x => { x.actions = x.actions.map((y, yi) => yi === ai ? Object.assign({}, y, { ck: !y.ck }) : y); return x; }); } })) : [],
          note: m.done ? n + (n > 1 ? 
- , canValidate: m.ai && !m.done, btn: n ? 
-  }) }));
    return {
      nav1: N1.filter(([l]) => l !== 
- ).map(([l, d]) => ({ l, d, bg: 
-  })),
      nav2: N2.map(([l, d, b]) => ({ l, d, b: b || 
-  })),
      nav1Dash: N1.filter(([l]) => l !== 
- ).map(([l, d], i) => ({ l, d, bg: i === 0 ? 
-  })),
      nav2Dash: N2.map(([l, d, b]) => ({ l, d, b: b || 
-  })),
      dlgDOpen: s.dlgD, dlgMOpen: s.dlgM, dlgDExp: s.dlgD ? 
- , dlgMExp: s.dlgM ? 
- , btnZ: s.dlgD ? 12 : 1, btnShD: s.dlgD ? 
- , iaBtnRef: this.iaBtnRef, notchD: s.notchD || 
- , plusMBgD: s.plusM ? 
- , plusMCD: s.plusM ? 
- , greetM: s.chats.dlgM.length === 0 && !s.plusM, plusMExp: s.plusM ? 
- , plusMBg: s.plusM ? 
- , plusMC: s.plusM ? 
- , plusMRot: s.plusM ? 
- ,
      togglePlusM: () => this.setState({ plusM: !s.plusM }),
      plusItems: [[
- , null]].concat(SUGG).map(([l, d, q], i) => ({ l, d, sep: i === 1 ? 
- , sepD: i === 1 ? 
- , bgD: i ? 
- , pick: () => { this.setState({ plusM: false }); if (q) this.send(
- , q); } })),
      c_dlgD: this.chat(
- ), c_dlgM: this.chat(
- ), c_pageD: this.chat(
- ), c_pageM: this.chat(
- ),
      newChatD: reset(
- ), newChatM: reset(
- ),
      ctxChips: [[
- ]].map(([k, l, d]) => { const on = s.ctx === k; return { l: on ? 
-  : l, d, sel: on ? 
- , pick: () => this.setState({ ctx: on ? 
-  }; }),
      pageCards: [[
- ]].map(([t, sub, d, q]) => ({ t, s: sub, d, pickD: () => this.send(
- , q), pickM: () => this.send(
- , q) })),
      history: [[
- ]]].map(([g, items], gi) => ({ g, items: items.map((l, i) => ({ l, bg: gi === 0 && i === 0 && s.chats.pageD.length ? 
-  })) })),
      kpis: [[
- ]].map(([l, v]) => ({ l, v })),
      today: [[
- ]].map(([h, n, sub, bg]) => ({ h, n, s: sub, bg })),
      tasks: [
- ]
    };
  }
}
const N1 = [[
- ]];
const N2 = [[
- ]];

const SUGG = [[
