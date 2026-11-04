const NAV1 = [['Tableau de bord','M3 10.5 12 3l9 7.5V21H3z'],['Agenda','M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z'],['Sportifs','M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],['Programmes','M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5'],['Comptabilité','M5 2h14v20H5zM8 6h8M8 10h2M14 10h2M8 14h2M14 14h2'],['Bibliothèque','M2 4h7a3 3 0 0 1 3 3v14a2 2 0 0 0-2-2H2zM22 4h-7a3 3 0 0 0-3 3v14a2 2 0 0 1 2-2h8z']].map(n => ({ l: n[0], d: n[1] }));
const NAV2 = [['Assistant IA','M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z',0],['Messages','M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',4],['Tâches','M3 6l2 2 3-3M3 13l2 2 3-3M12 7h9M12 14h9M12 20h9',0],['Documents','M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',0],['Notifications','M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0',9]];
const CONV = [
  { id: 'tp', n: 'Thomas Peeters', ini: 'TP', sx: 'm', time: '10:49', last: 'Salut coach, je peux décaler le test VMA de mercredi à jeudi matin ?', u: 1 },
  { id: 'hy', n: 'Small group Hyrox', g: 'y', time: '09:30', last: 'Karim : Mes épaules s’en souviennent encore', u: 3 },
  { id: 'ib', n: 'Inès Benali', ini: 'IB', sx: 'f', time: '08:14', last: 'Circuit de samedi bouclé, je suis passée sous les 22 min', u: 1 },
  { id: 'na', n: 'Nadia El Amrani', ini: 'NA', sx: 'f', time: 'Hier', last: 'Je confirme pour mardi 18 h 30, j’arrive 10 min avant', u: 1 },
  { id: 'cx', n: 'Cours collectif Cross-training', g: 'v', time: 'Hier', last: 'Toi : Pensez à vos gourdes samedi', u: 0 },
  { id: 'lj', n: 'Lucas Janssens', ini: 'LJ', sx: 'm', time: 'Lun.', last: 'Merci pour le programme, je commence demain', u: 0 }
];
const MSG = {
  tp: [['Thomas', 'Salut coach, je peux décaler le test VMA de mercredi à jeudi matin ?', '10:49']],
  hy: [['Léa', 'Je serai là jeudi, je peux venir avec une amie ?', '09:12'], [0, 'Avec plaisir, il reste 2 places.', '09:20'], ['Karim', 'On refait le WOD wall balls cette semaine ?', '09:24'], ['Karim', 'Mes épaules s’en souviennent encore', '09:24'], [0, 'Oui, en version allégée pour ceux qui reprennent.', '09:30']],
  ib: [['Inès', 'Circuit de samedi bouclé, je suis passée sous les 22 min', '08:14']],
  na: [[0, 'On garde mardi pour la séance ?', 'Hier'], ['Nadia', 'Je confirme pour mardi 18 h 30, j’arrive 10 min avant', 'Hier']],
  cx: [[0, 'Pensez à vos gourdes samedi', 'Hier']],
  lj: [[0, 'Ton programme de 8 semaines est en ligne.', 'Lun.'], ['Lucas', 'Merci pour le programme, je commence demain', 'Lun.']]
};
const SC = { 'Léa': '#be185d', 'Karim': '#1d6fb8' };
const GC = { y: ['rgba(254,193,79,.22)', '#8a5a00'], v: ['rgba(139,92,246,.12)', '#6a3ee0'] };
const ATH = [['ib', 'IB', 'Inès Benali', 'Small group Hyrox'], ['km', 'KM', 'Karim Mansouri', 'Small group Hyrox'], ['ld', 'LD', 'Léa Dubois', 'Small group Hyrox'], ['lj', 'LJ', 'Lucas Janssens', 'Suivi individuel'], ['na', 'NA', 'Nadia El Amrani', 'Cours collectif'], ['tp', 'TP', 'Thomas Peeters', 'Suivi individuel']];

class Component extends DCLogic {
  state = { sel: 'tp', filter: 'all', draft: '', menu: false, extra: {}, gName: 'Small group Hyrox', gm: { ib: 1, km: 1, ld: 1 } };
  threadRef = React.createRef();
  componentDidUpdate() { const el = this.threadRef.current; if (el) el.scrollTop = el.scrollHeight; }
  send() { const t = this.state.draft.trim(); if (!t) return; const id = this.state.sel; this.setState(s => ({ draft: '', extra: Object.assign({}, s.extra, { [id]: (s.extra[id] || []).concat([[0, t, 'À l’instant']]) }) })); }
  bubbles(list, isGroup) {
    return list.map((m, i) => { const mine = m[0] === 0, prev = list[i - 1], same = prev && prev[0] === m[0];
      return { t: m[1], time: m[2], align: mine ? 'flex-end' : 'flex-start', bg: mine ? '#17151d' : '#f3f2f7', c: mine ? '#fff' : '#17151d', r: mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px', mt: i && !same ? '10px' : '0', sender: isGroup && !mine && !same ? m[0] : '', sc: SC[m[0]] || '#6a3ee0' }; });
  }
  renderVals() {
    const s = this.state;
    const row = (c, mob) => { const on = !mob && c.id === s.sel, grp = !!c.g;
      return { pick: () => this.setState({ sel: c.id, menu: false }), href: grp ? '#1c' : '#1b', isPerson: !grp, isGroup: grp, name: c.n, ini: c.ini, sx: c.sx === 'f' ? '♀' : '♂', sxBg: c.sx === 'f' ? '#fce7f1' : '#e0f0fb', sxC: c.sx === 'f' ? '#be185d' : '#1d6fb8',
        gBg: grp ? GC[c.g][0] : '', gC: grp ? GC[c.g][1] : '', time: c.time, last: c.last, unread: on ? 0 : c.u, bg: on ? 'rgba(139,92,246,.09)' : 'transparent', tc: c.u && !on ? '#6a3ee0' : '#8b8996', lc: c.u && !on ? '#17151d' : '#64626e' }; };
    const pass = c => s.filter === 'all' || (s.filter === 'unread' ? c.u : s.filter === 'grp' ? c.g : !c.g);
    const list = CONV.filter(pass);
    const c = CONV.find(x => x.id === s.sel) || CONV[0], grp = !!c.g;
    const cur = Object.assign(row(c, true), { sub: grp ? '8 membres · Voir les membres' : 'Voir la fiche', cta: grp ? 'Voir la séance' : 'Planifier',
      note: grp ? 'Tous les membres du groupe voient ce message.' : 'Le sportif ne voit pas encore ce fil : sa messagerie arrive avec son espace. Aucun e-mail ni WhatsApp n’est envoyé.' });
    const nU = CONV.filter(x => x.u).length;
    const gN = Object.keys(s.gm).filter(k => s.gm[k]).length;
    return {
      nav1: NAV1, nav2: NAV2.map(n => ({ l: n[0], d: n[1], b: n[2], bg: n[0] === 'Messages' ? 'rgba(139,92,246,.1)' : 'transparent', c: n[0] === 'Messages' ? '#6a3ee0' : '#4a4855' })),
      menuOpen: s.menu, toggleMenu: () => this.setState(p => ({ menu: !p.menu })),
      filters: [['all', 'Toutes'], ['unread', 'Non lues (' + nU + ')'], ['ath', 'Sportifs'], ['grp', 'Groupes']].map(([k, l]) => { const on = s.filter === k;
        return { l, on: () => this.setState({ filter: k }), bg: on ? '#17151d' : '#fff', c: on ? '#fff' : '#4a4855', sh: on ? 'none' : 'inset 0 0 0 1px rgba(22,18,40,.12)' }; }),
      convs: list.map(x => row(x, false)), convsM: CONV.map(x => row(x, true)), noConv: list.length === 0,
      cur, msgs: this.bubbles((MSG[c.id] || []).concat(s.extra[c.id] || []), grp), grpMsgs: this.bubbles(MSG.hy, true),
      threadRef: this.threadRef, draft: s.draft, setDraft: e => this.setState({ draft: e.target.value }),
      onKey: e => { if (e.key === 'Enter') { e.preventDefault(); this.send(); } }, send: () => this.send(), sendBg: s.draft.trim() ? '#17151d' : '#c9c7d1',
      gName: s.gName, setGName: e => this.setState({ gName: e.target.value }),
      gList: ATH.map(a => { const on = !!s.gm[a[0]]; return { ini: a[1], n: a[2], s: a[3], on, mark: on ? '✓' : '', bg: on ? '#8b5cf6' : '#fff', bd: on ? 'none' : 'inset 0 0 0 1.5px rgba(22,18,40,.22)',
        toggle: () => this.setState(p => ({ gm: Object.assign({}, p.gm, { [a[0]]: !p.gm[a[0]] }) })) }; }),
      gCount: gN + ' sélectionné' + (gN > 1 ? 's' : ''), gCta: 'Créer le groupe (' + gN + ')'
    };
  }
}
