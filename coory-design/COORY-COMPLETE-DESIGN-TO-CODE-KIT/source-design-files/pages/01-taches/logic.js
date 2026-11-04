class Component extends DCLogic {
  state = { selD: 'all', selM: 'prog', done: {}, add: '', draft: '', extra: [], lists: LISTS, newList: '', listDraft: '' };
  inD = React.createRef(); inM = React.createRef(); inLD = React.createRef(); inLM = React.createRef();
  componentDidUpdate(pp, ps) {
    const s = this.state;
    if (s.add && s.add !== ps.add) setTimeout(() => { const el = (s.add === 'm' ? this.inM : this.inD).current; if (el) el.focus(); }, 30);
    if (s.newList && s.newList !== ps.newList) setTimeout(() => { const el = (s.newList === 'm' ? this.inLM : this.inLD).current; if (el) el.focus(); }, 30);
  }
  renderVals() {
    const s = this.state, L = {}; s.lists.forEach(l => L[l.k] = l);
    const all = TASKS.concat(s.extra).map((t, i) => Object.assign({}, t, { i, done: !!s.done[i] }));
    const SM = { today: ['Aujourd\u2019hui', '#8b5cf6', 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z'], next: ['À venir', '#17151d', 'M12 6v6l4 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z'], all: ['Toutes', '#4a4855', 'M3 5l2 2 3-3M3 12l2 2 3-3M3 19l2 2 3-3M12 6h9M12 13h9M12 20h9'], done: ['Terminées', '#8b8996', 'M20 6L9 17l-5-5'] };
    const match = (t, sel) => sel === 'done' ? t.done : !t.done && (sel === 'all' || (sel === 'today' && t.when === 'today') || (sel === 'next' && t.when !== 'today') || t.list === sel);
    const cnt = sel => all.filter(t => match(t, sel)).length;
    const smart = !!SM[sel0(s.selD)];
    function sel0(x) { return x; }
    const view = (sel, mode) => {
      const isSmart = !!SM[sel], vis = all.filter(t => match(t, sel));
      const E = isSmart ? { today: ['Rien pour aujourd\u2019hui', 'Profite, ou ajoute une tâche.'], next: ['Rien à venir', 'Touche l\u2019écran pour ajouter une tâche.'], all: ['Tout est fait', 'Touche l\u2019écran pour ajouter une tâche.'], done: ['Aucune tâche terminée', 'Coche une tâche pour la voir ici.'] }[sel] : ['Liste vide', 'Touche l\u2019écran pour ajouter une tâche.'];
      return { title: isSmart ? SM[sel][0] : (L[sel] ? L[sel].l : ''), tc: isSmart ? '#17151d' : (L[sel] ? L[sel].tc : '#17151d'), count: vis.length + (vis.length > 1 ? ' tâches' : ' tâche'),
        isEmpty: vis.length === 0 && s.add !== mode, emptyT: E[0], emptyS: E[1],
        rows: vis.map(t => { const l = L[t.list]; return { title: t.title, who: t.who || '', ini: t.ini || '', hasWho: !!t.who, due: t.due || '', hasDue: !!t.due, high: !!t.high && !t.done, dc: t.when === 'today' && !t.done ? '#6a3ee0' : '#64626e', showList: isSmart && !!l, ln: l ? l.l : '', lc: l ? l.c : 'transparent', ck: t.done ? 'true' : 'false', ring: t.done ? '#8b5cf6' : 'rgba(22,18,40,.22)', fill: t.done ? '#8b5cf6' : 'transparent', op: t.done ? 1 : 0, tc: t.done ? '#8b8996' : '#17151d', dec: t.done ? 'line-through' : 'none', toggle: () => this.setState(p => ({ done: Object.assign({}, p.done, { [t.i]: !p.done[t.i] }) })) }; }) };
    };
    const sel = s.add === 'm' ? s.selM : s.selD;
    const mk = v => { const isSmart = !!SM[sel]; return { title: v, list: isSmart ? (sel === 'today' || sel === 'next' || sel === 'all' ? s.lists[0].k : s.lists[0].k) : sel, when: sel === 'today' ? 'today' : 'later', due: sel === 'today' ? 'Aujourd\u2019hui' : '' }; };
    const commit = () => { const v = s.draft.trim(); this.setState(p => ({ extra: v ? p.extra.concat([mk(v)]) : p.extra, draft: '', add: '' })); };
    const smartTiles = (cur, set) => ['today', 'next', 'all', 'done'].map(k => { const on = cur === k; return { l: SM[k][0], c: SM[k][1], d: SM[k][2], n: cnt(k), sel: on ? 'true' : 'false', pick: set(k), bg: on ? '#f1edfc' : '#fff', bw: on ? '1.5px' : '1px', bd: on ? '#8b5cf6' : 'rgba(22,18,40,.07)' }; });
    const COLORS = ['#7776FF', '#FEC14F', '#26CBB8', '#DD2D4A', '#8b5cf6', '#17151d'];
    const nextColor = COLORS[s.lists.length % COLORS.length];
    const commitList = () => { const v = s.listDraft.trim(); if (v) { const k = 'l' + Date.now(); const c = nextColor; this.setState(p => ({ lists: p.lists.concat([{ k, l: v, c, tc: c === '#FEC14F' ? '#9a6a00' : c }]), listDraft: '', newList: '', selD: p.newList === 'd' ? k : p.selD, selM: p.newList === 'm' ? k : p.selM })); } else this.setState({ newList: '', listDraft: '' }); };
    return {
      nav1: N1.map(([l, d]) => ({ l, d, bg: 'transparent', c: '#4a4855' })),
      nav2: N2.map(([l, d, b]) => ({ l, d, b: b || '', bg: l === 'Tâches' ? 'rgba(139,92,246,.12)' : 'transparent', c: l === 'Tâches' ? '#17151d' : '#4a4855' })),
      smartD: smartTiles(s.selD, k => () => this.setState({ selD: k, add: '' })),
      smartM: smartTiles(null, k => () => { this.setState({ selM: k, add: '' }); location.hash = '1c'; }),
      listsD: s.lists.map(l => { const on = s.selD === l.k; return { l: l.l, c: l.c, n: cnt(l.k), sel: on ? 'true' : 'false', bg: on ? 'rgba(139,92,246,.10)' : 'transparent', line: 'transparent', pick: () => this.setState({ selD: l.k, add: '' }) }; }),
      listsM: s.lists.map((l, i) => ({ l: l.l, c: l.c, n: cnt(l.k), sel: 'false', bg: '#fff', line: i ? 'rgba(22,18,40,.06)' : 'transparent', pick: () => { this.setState({ selM: l.k, add: '' }); location.hash = '1c'; } })),
      chipsM: ['today', 'all'].map(k => ({ k, l: SM[k][0], c: SM[k][1] })).concat(s.lists.map(l => ({ k: l.k, l: l.l, c: l.c }))).map(c => { const on = s.selM === c.k; return { l: c.l, c: on ? '#fff' : c.c, sel: on ? 'true' : 'false', bg: on ? '#17151d' : '#fff', fc: on ? '#fff' : '#17151d', pick: () => this.setState({ selM: c.k, add: '' }) }; }),
      vD: view(s.selD, 'd'), vM: view(s.selM, 'm'),
      addD: s.add === 'd', addM: s.add === 'm', ghostD: s.add !== 'd' && s.selD !== 'done', draft: s.draft, inD: this.inD, inM: this.inM,
      tapD: () => { if (s.add !== 'd') this.setState({ add: 'd', draft: '', selD: s.selD === 'done' ? 'all' : s.selD }); },
      tapM: () => { if (s.add !== 'm') this.setState({ add: 'm', draft: '', selM: s.selM === 'done' ? 'all' : s.selM }); },
      fabHome: () => { this.setState({ add: 'm', draft: '', selM: s.lists[0].k }); location.hash = '1c'; },
      setDraft: e => this.setState({ draft: e.target.value }),
      onKey: e => { if (e.key === 'Enter') { const v = s.draft.trim(); if (v) this.setState(p => ({ extra: p.extra.concat([mk(v)]), draft: '' })); } else if (e.key === 'Escape') this.setState({ add: '', draft: '' }); },
      commit,
      newListOn: !!s.newList, nextColor, listDraft: s.listDraft, inLD: this.inLD, inLM: this.inLM,
      newListD: () => this.setState({ newList: 'd', listDraft: '' }), newListM: () => this.setState({ newList: 'm', listDraft: '' }),
      setListDraft: e => this.setState({ listDraft: e.target.value }),
      onListKey: e => { if (e.key === 'Enter') commitList(); else if (e.key === 'Escape') this.setState({ newList: '', listDraft: '' }); },
      commitList
    };
  }
}
const N1 = [['Tableau de bord', 'M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z'], ['Agenda', 'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM16 2v4M8 2v4M3 10h18'], ['Sportifs', 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8'], ['Programmes', 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5'], ['Facturation', 'M5 3h14v18H5zM12 7v10M15 9.5c0-1.4-1.3-2-3-2s-3 .8-3 2 1.3 1.7 3 2 3 .8 3 2-1.3 2-3 2-3-.6-3-2'], ['Comptabilité', 'M5 2h14v20H5zM8 6h8M8 10h2M12 10h2M8 14h2M12 14h2M8 18h2M12 18h2'], ['Bibliothèque', 'M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2zM22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z']];
const N2 = [['Assistant IA', 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z'], ['Messages', 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', '3'], ['Tâches', 'M3 5l2 2 3-3M3 12l2 2 3-3M3 19l2 2 3-3M12 6h9M12 13h9M12 20h9'], ['Documents', 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'], ['Notifications', 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0', '6']];

const LISTS = [
  { k: 'prog', l: 'Programmes', c: '#7776FF', tc: '#5856e0' },
  { k: 'fact', l: 'Facturation', c: '#FEC14F', tc: '#9a6a00' },
  { k: 'fiche', l: 'Fiches sportifs', c: '#26CBB8', tc: '#11867a' },
  { k: 'biblio', l: 'Bibliothèque', c: '#DD2D4A', tc: '#c0213d' }
];
const TASKS = [
  { list: 'prog', title: 'Préparer le bloc 2 du programme de Lucas', who: 'Lucas Janssens', ini: 'LJ', due: 'Aujourd\u2019hui', when: 'today', high: true },
  { list: 'prog', title: 'Publier la semaine 7 d\u2019Inès', who: 'Inès Benali', ini: 'IB', due: 'Lun 9', when: 'later' },
  { list: 'prog', title: 'Adapter le programme de Chloé après sa blessure', who: 'Chloé Martin', ini: 'CM', due: 'Mar 10', when: 'later' },
  { list: 'fact', title: 'Relancer Sophie pour la facture d\u2019octobre', who: 'Sophie Lambert', ini: 'SL', due: 'Sam 7', when: 'later' },
  { list: 'fact', title: 'Envoyer les factures de novembre', due: 'Aujourd\u2019hui', when: 'today' },
  { list: 'fiche', title: 'Mettre à jour les repères de Thomas', who: 'Thomas Peeters', ini: 'TP', due: 'Aujourd\u2019hui', when: 'today' },
  { list: 'fiche', title: 'Ajouter l\u2019objectif Hyrox de Léa', who: 'Léa Vandenberghe', ini: 'LV', due: 'Jeu 12', when: 'later' },
  { list: 'biblio', title: 'Ajouter le Sled Push à la bibliothèque', due: 'Ven 13', when: 'later' },
  { list: 'biblio', title: 'Filmer la démo du Wall Ball', due: 'Mer 11', when: 'later' }
];
