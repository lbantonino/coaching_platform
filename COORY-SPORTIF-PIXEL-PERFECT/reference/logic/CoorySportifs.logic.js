class Component extends DCLogic {
  state = { st: 'all', disc: 'all', q: '', sel: {}, sk: 'name', sd: 1, dd: null };
  dd(id, opts, cur, pick) {
    const open = this.state.dd === id, sel = opts.find(o => o[0] === cur) || opts[0];
    return { open, exp: open ? 'true' : 'false', rot: open ? 'rotate(180deg)' : 'none', ring: open ? 'inset 0 0 0 1.5px rgba(139,92,246,.55)' : 'inset 0 0 0 1px rgba(22,18,40,.06)',
      val: sel[1] + (sel[2] ? ' (' + sel[2] + ')' : ''), toggle: () => this.setState(p => ({ dd: p.dd === id ? null : id })),
      opts: opts.map(([k, l, n, dot]) => ({ l, n, dot, pick: () => pick(k), bg: k === cur ? 'rgba(139,92,246,.10)' : 'transparent', c: k === cur ? '#6a3ee0' : '#17151d' })) };
  }
  renderVals() {
    const s = this.state;
    const today = new Date(2026, 10, 3);
    const M = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    const DC = { run: ['Running', '#7776FF'], mus: ['Musculation', '#DD2D4A'], hyr: ['Hyrox', '#FEC14F'], hyb: ['Hybride', '#26CBB8'] };
    const ST = { act: ['Actif', '#15803d'], pause: ['En pause', '#d08a1c'], arch: ['Archivé', '#a3a1ad'] };
    const AV = ['#f2d9df', '#dfddf6', '#d6ebe5', '#f0e5d6'];
    const q = s.q.trim().toLowerCase();
    const list = DATA.filter(a => (s.st === 'all' || a.st === s.st) && (s.disc === 'all' || a.d === s.disc) && (!q || a.n.toLowerCase().includes(q)));
    const SO = { st: { act: 0, pause: 1, arch: 2 }, prog: { run: 0, mus: 1, hyr: 2, hyb: 3, '': 9 } };
    const okey = a => a.dt ? new Date(a.dt[2], a.dt[1], a.dt[0]).getTime() : (a.g ? 9e15 : 9.9e15);
    const kf = { name: a => a.n, st: a => SO.st[a.st], prog: a => SO.prog[a.d || ''], obj: okey }[s.sk];
    list.sort((x, y) => { const a = kf(x), b = kf(y); return (a < b ? -1 : a > b ? 1 : x.n.localeCompare(y.n)) * s.sd; });
    const rows = list.map(a => {
      const id = a.n, on = !!s.sel[id];
      let d1 = a.g ? 'Sans date' : 'Aucun objectif', jx = '', jBg = '', jC = '';
      if (a.dt) {
        const dt = new Date(a.dt[2], a.dt[1], a.dt[0]);
        const days = Math.round((dt - today) / 864e5);
        d1 = a.dt[0] + ' ' + M[a.dt[1]] + (a.dt[2] > 2026 ? ' ' + a.dt[2] : '');
        jx = 'J-' + days;
        const soon = days <= 60;
        jBg = soon ? 'rgba(139,92,246,.12)' : '#f3f2f7'; jC = soon ? '#6a3ee0' : '#4a4855';
      }
      const dc = DC[a.d], st = ST[a.st];
      return {
        name: a.n, ini: a.n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(), av: AV[a.av],
        sex: a.sx === 'f' ? '♀' : a.sx === 'm' ? '♂' : '', sexC: a.sx === 'f' ? '#c2266b' : '#2f6fbf',
        lvl: a.l || 'Fiche à compléter', lvlC: a.l ? '#64626e' : '#a86410',
        hasProg: !!dc, noProg: !dc, disc: dc ? dc[0] : '', dC: dc ? dc[1] : '#8b8996',
        discM: dc ? dc[0] : 'Programme à choisir', dCm: dc ? dc[1] : '#8b8996',
        st: st[0], stC: st[1],
        d1, d1C: a.dt ? '#17151d' : '#8b8996', goal: a.g || '', jx, jBg, jC,
        hasGoal: !!a.g, noGoal: !a.g, dShort: a.dt ? d1 : 'Sans date',
        objM: a.dt ? d1 + ' · ' + a.g : (a.g ? a.g : 'Aucun objectif'),
        inv: a.inv === 'no' && a.st !== 'arch', pend: a.inv === 'pend', msg: a.inv === 'yes',
        mark: on ? '✓' : '', ckBg: on ? '#8b5cf6' : '#fff', ckBd: on ? '#8b5cf6' : '#cfcdd8', rowBg: on ? 'rgba(139,92,246,.05)' : '#fff',
        toggle: e => { e.stopPropagation(); this.setState(p => ({ sel: Object.assign({}, p.sel, { [id]: !p.sel[id] }) })); }
      };
    });
    const nSel = Object.keys(s.sel).filter(k => s.sel[k]).length;
    const allOn = list.length > 0 && list.every(a => s.sel[a.n]);
    const cnt = k => k === 'all' ? DATA.length : DATA.filter(a => a.st === k).length;
    const stDef = [['all', 'Tous'], ['act', 'Actifs'], ['pause', 'En pause'], ['arch', 'Archivés']];
    const mkSt = (lbl) => stDef.map(([k, l], i) => { const on = s.st === k; return { l: lbl ? lbl[i] : l, n: String(cnt(k)), sel: on ? 'true' : 'false', on: () => this.setState({ st: k }), bg: on ? '#fff' : 'transparent', c: on ? '#17151d' : '#64626e', sh: on ? '0 1px 3px rgba(22,18,40,.08)' : 'none' }; });
    return {
      q: s.q, setQ: e => this.setState({ q: e.target.value }),
      summary: DATA.length + ' sportifs · ' + cnt('act') + ' actifs · 9 compétitions à venir',
      footer: rows.length + (rows.length > 1 ? ' sportifs affichés' : ' sportif affiché'),
      stTabs: mkSt(), stTabsM: mkSt(['Tous', 'Actifs', 'Pause', 'Archivés']),
      dTabs: [['all', 'Tous', '#17151d'], ['run', 'Running'], ['mus', 'Musculation'], ['hyr', 'Hyrox'], ['hyb', 'Hybride']].map(([k, l, dot]) => { const on = s.disc === k; return { l, dot: dot || DC[k][1], on: () => this.setState({ disc: k }), bg: on ? 'rgba(139,92,246,.10)' : '#fff', bgM: on ? 'rgba(139,92,246,.12)' : '#fff', c: on ? '#6a3ee0' : '#17151d', sh: on ? 'inset 0 0 0 1px rgba(139,92,246,.35)' : 'inset 0 0 0 1px rgba(22,18,40,.10)' }; }),
      rows, empty: rows.length === 0,
      selHead: nSel ? nSel + (nSel > 1 ? ' sélectionnés' : ' sélectionné') : 'Tout sélectionner',
      dd_stD: this.dd('stD', stDef.map(([k, l]) => [k, l, String(cnt(k)), { all: '#17151d', act: '#15803d', pause: '#d08a1c', arch: '#a3a1ad' }[k]]), s.st, v => this.setState({ st: v, dd: null })),
      dd_progD: this.dd('progD', [['all', 'Tous', '', '#17151d']].concat(Object.keys(DC).map(k => [k, DC[k][0], String(DATA.filter(a => a.d === k).length), DC[k][1]])), s.disc, v => this.setState({ disc: v, dd: null })),
      dd_st: this.dd('st', stDef.map(([k, l]) => [k, l, String(cnt(k)), { all: '#17151d', act: '#15803d', pause: '#d08a1c', arch: '#a3a1ad' }[k]]), s.st, v => this.setState({ st: v, dd: null })),
      dd_prog: this.dd('prog', [['all', 'Tous', '', '#17151d']].concat(Object.keys(DC).map(k => [k, DC[k][0], String(DATA.filter(a => a.d === k).length), DC[k][1]])), s.disc, v => this.setState({ disc: v, dd: null })),
      sortLabel: 'Trié par ' + { name: 'nom', st: 'statut', prog: 'programme', obj: 'objectif (date)' }[s.sk] + (s.sd > 0 ? ', croissant' : ', décroissant'),
      ...Object.fromEntries(['name', 'st', 'prog', 'obj'].map(k => { const on = s.sk === k; return ['sort_' + k, { on: () => this.setState(p => p.sk === k ? { sd: -p.sd } : { sk: k, sd: 1 }), arrow: on ? (s.sd > 0 ? '↑' : '↓') : '↕', c: on ? '#17151d' : '#64626e', ac: on ? '#6a3ee0' : '#b4b2bd' }]; })),
      hasSel: nSel > 0, selLabel: nSel + (nSel > 1 ? ' sportifs sélectionnés' : ' sportif sélectionné'),
      clearSel: () => this.setState({ sel: {} }),
      allMark: allOn ? '✓' : '', allBg: allOn ? '#8b5cf6' : '#fff', allBd: allOn ? '#8b5cf6' : '#cfcdd8',
      toggleAll: () => this.setState(p => { const sel = Object.assign({}, p.sel); list.forEach(a => { sel[a.n] = !allOn; }); return { sel }; }),
      fiches: [['overview','Vue d’ensemble'],['profil','Profil'],['agenda','Agenda'],['seance','Détail d’une séance'],['programme','Programme'],['objectifs','Objectifs'],['reperes','Repères'],['dispos','Disponibilités'],['notes','Notes'],['documents','Documents'],['historique','Historique']].map(([key, label], i) => ({ key, label, id: '2' + 'abcdefghijk'[i], seance: key === 'seance', notSeance: key !== 'seance', back: key === 'seance' ? 'Inès Benali' : 'Sportifs' })),
      nav1: N1.map(([l, d], i) => ({ l, d, bg: i === 2 ? 'rgba(139,92,246,.12)' : 'transparent', c: i === 2 ? '#17151d' : '#4a4855' })),
      nav2: N2.map(([l, d, b]) => ({ l, d, b: b || '' }))
    };
  }
}
const DATA = [
  { n: 'Antoine Maes', sx: 'm', l: 'Intermédiaire', st: 'act', d: 'mus', g: 'Composition corporelle', inv: 'no', av: 0 },
  { n: 'Camille Renard', sx: 'f', l: 'Débutant', st: 'act', d: 'run', dt: [20, 11, 2026], g: 'Corrida de Noël', inv: 'no', av: 1 },
  { n: 'Chloé Martin', sx: 'f', l: 'Débutant', st: 'act', d: 'mus', dt: [28, 1, 2027], g: 'Remise en forme / santé', inv: 'no', av: 0 },
  { n: 'Emma Laurent', sx: 'f', l: 'Intermédiaire', st: 'act', d: 'run', dt: [28, 2, 2027], g: '10 km de printemps', inv: 'no', av: 1 },
  { n: 'Inès Benali', sx: 'f', l: 'Confirmé', st: 'act', d: 'hyr', dt: [20, 2, 2027], g: 'Hyrox Bruxelles', inv: 'yes', av: 3 },
  { n: 'Julie Willems', sx: 'f', l: 'Intermédiaire', st: 'act', d: 'hyb', g: 'Remise en forme / santé', inv: 'no', av: 2 },
  { n: 'Julien Dubois', sx: 'm', l: 'Débutant', st: 'pause', d: 'mus', g: 'Remise en forme / santé', inv: 'no', av: 1 },
  { n: 'Kevin Mertens', sx: 'm', l: 'Intermédiaire', st: 'arch', d: 'run', inv: 'no', av: 3 },
  { n: 'Laura Claes', sx: 'f', l: 'Débutant', st: 'act', d: 'mus', g: 'Remise en forme / santé', inv: 'no', av: 0 },
  { n: 'Léa Vandenberghe', sx: 'f', l: 'Confirmé', st: 'act', d: 'hyr', dt: [12, 11, 2026], g: 'Hyrox Gent', inv: 'no', av: 3 },
  { n: 'Lucas Janssens', sx: 'm', l: 'Intermédiaire', st: 'act', d: 'hyb', dt: [15, 4, 2027], g: 'Premier Hyrox', inv: 'pend', av: 2 },
  { n: 'Manon', sx: '', l: '', st: 'act', d: '', inv: 'no', av: 0 },
  { n: 'Maxime Leroy', sx: 'm', l: 'Intermédiaire', st: 'act', d: 'hyb', dt: [20, 2, 2027], g: 'Hyrox Bruxelles', inv: 'no', av: 2 },
  { n: 'Mehdi Ouali', sx: 'm', l: 'Confirmé', st: 'act', d: 'hyr', dt: [12, 11, 2026], g: 'Hyrox Gent', inv: 'no', av: 3 },
  { n: 'Nadia El Amrani', sx: 'f', l: 'Compétiteur', st: 'act', d: 'mus', dt: [6, 1, 2027], g: 'Championnat régional', inv: 'yes', av: 1 },
  { n: 'Sophie Lambert', sx: 'f', l: 'Débutant', st: 'act', d: 'mus', dt: [31, 0, 2027], g: 'Remise en forme / santé', inv: 'no', av: 0 },
  { n: 'Thomas Peeters', sx: 'm', l: 'Intermédiaire', st: 'act', d: 'run', dt: [11, 3, 2027], g: 'Semi-marathon de printemps', inv: 'yes', av: 2 },
  { n: 'Yanis Khelifi', sx: 'm', l: 'Confirmé', st: 'act', d: 'mus', g: 'Force', inv: 'no', av: 0 }
];
const N1 = [['Tableau de bord', 'M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z'], ['Agenda', 'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM16 2v4M8 2v4M3 10h18'], ['Sportifs', 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8'], ['Programmes', 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5'], ['Facturation', 'M5 3h14v18H5zM12 7v10M15 9.5c0-1.4-1.3-2-3-2s-3 .8-3 2 1.3 1.7 3 2 3 .8 3 2-1.3 2-3 2-3-.6-3-2'], ['Comptabilité', 'M5 2h14v20H5zM8 6h8M8 10h2M12 10h2M8 14h2M12 14h2M8 18h2M12 18h2'], ['Bibliothèque', 'M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2zM22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z']];
const N2 = [['Assistant IA', 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z'], ['Messages', 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', '3'], ['Tâches', 'M3 5l2 2 3-3M3 12l2 2 3-3M3 19l2 2 3-3M12 6h9M12 13h9M12 20h9'], ['Documents', 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'], ['Notifications', 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0', '6']];