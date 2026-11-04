const NAV1 = [['Tableau de bord','M3 10.5 12 3l9 7.5V21H3z'],['Agenda','M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z'],['Sportifs','M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],['Programmes','M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5'],['Comptabilité','M5 2h14v20H5zM8 6h8M8 10h2M14 10h2M8 14h2M14 14h2'],['Bibliothèque','M2 4h7a3 3 0 0 1 3 3v14a2 2 0 0 0-2-2H2zM22 4h-7a3 3 0 0 0-3 3v14a2 2 0 0 1 2-2h8z']].map(n => ({ l: n[0], d: n[1] }));
const NAV2 = [['Assistant IA','M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z'],['Messages','M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'],['Tâches','M3 6l2 2 3-3M3 13l2 2 3-3M12 7h9M12 14h9M12 20h9'],['Documents','M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'],['Notifications','M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0']];
const ITEMS = [
  { id: 'm1', sec: 'msg', ini: 'TP', sx: 'm', t: 'Thomas Peeters', s: 'Salut coach, je peux décaler le test VMA de mercredi ?', r: '12:20', tag: '1 non lu' },
  { id: 'm2', sec: 'msg', ini: 'IB', sx: 'f', t: 'Inès Benali', s: 'Circuit de samedi bouclé, je suis prête pour la suite', r: '09:45', tag: '1 non lu' },
  { id: 'm3', sec: 'msg', ini: 'NA', sx: 'f', t: 'Nadia El Amrani', s: 'Je confirme pour mardi 18 h 30, j’apporte ma ceinture', r: 'Hier', tag: '1 non lu' },
  { id: 's1', sec: 'pay', ini: 'SL', sx: 'f', t: 'Sophie Lambert', s: 'Mar 27 · 17:15 · Remise en forme', r: '78,65 €', amt: 1 },
  { id: 's2', sec: 'pay', ini: 'NA', sx: 'f', t: 'Nadia El Amrani', s: 'Lun 26 · 07:00 · Coaching force', r: '78,65 €', amt: 1 },
  { id: 's3', sec: 'pay', ini: 'SL', sx: 'f', t: 'Sophie Lambert', s: 'Mar 20 · 17:15 · Remise en forme', r: '78,65 €', amt: 1 },
  { id: 's4', sec: 'pay', ini: 'NA', sx: 'f', t: 'Nadia El Amrani', s: 'Lun 19 · 07:00 · Coaching force', r: '78,65 €', amt: 1 },
  { id: 't1', sec: 'task', t: 'Préparer le bloc 2 du programme Hyrox', s: 'Lucas Janssens', tag: 'Haute', tag2: 'Aujourd’hui', r: '' },
  { id: 'f1', sec: 'fiche', ini: 'M', sx: 'f', t: 'Manon', s: 'Manque : nom de famille, e-mail ou téléphone', r: '' }
];
const SECS = { msg: ['Messages non lus', 'Ouvrir'], pay: ['Séances à encaisser', 'Comptabilité'], task: ['Tâches du jour ou en retard', 'Tâches'], fiche: ['Fiches à compléter', 'Sportifs'], comp: ['Compétitions dans les 7 jours', ''] };
const COLS = [['msg', 'task', 'fiche'], ['pay', 'comp']];
const ORDER = ['msg', 'pay', 'task', 'fiche', 'comp'];
class Component extends DCLogic {
  state = { read: {}, hidden: {}, del: {}, tab: 'all', menu: '', sel: null, toast: '', where: '', prev: null };
  componentWillUnmount() { clearTimeout(this.tt); }
  snap() { const { read, hidden, del } = this.state; return { read, hidden, del }; }
  act(patch, msg, where) { const prev = this.snap(); clearTimeout(this.tt); this.setState(Object.assign({ menu: '', prev, toast: msg || '', where: where || 'd' }, patch)); if (msg) this.tt = setTimeout(() => this.setState({ toast: '' }), 5000); }
  setFor(key, ids, v) { const o = Object.assign({}, this.state[key]); ids.forEach(i => o[i] = v); return { [key]: o }; }
  renderVals() {
    const s = this.state;
    const alive = ITEMS.filter(i => !s.del[i.id]);
    const isUnread = i => !s.read[i.id] && !s.hidden[i.id];
    const visible = i => s.tab === 'hidden' ? s.hidden[i.id] : !s.hidden[i.id] && (s.tab !== 'unread' || !s.read[i.id]);
    const unread = alive.filter(isUnread).length;
    const selMode = !!s.sel;
    const item = (i, where) => { const un = isUnread(i), mk = where + i.id, sel = selMode && s.sel[i.id];
      return { t: i.t, s: i.s, sM: i.s, r: i.r, ini: i.ini, av: !!i.ini, sx: i.sx ? (i.sx === 'f' ? '♀' : '♂') : '', sxBg: i.sx === 'f' ? '#fce7f1' : '#e0f0fb', sxC: i.sx === 'f' ? '#be185d' : '#1d6fb8',
        tag: un ? (i.sec === 'msg' ? i.tag : i.tag) : (i.sec === 'msg' ? '' : i.tag), tag2: i.tag2, dot: un ? '#8b5cf6' : 'transparent', tc: un ? '#17151d' : '#4a4855',
        rf: i.amt ? "600 14px 'Plus Jakarta Sans'" : "500 11.5px 'Plus Jakarta Sans'", rfM: i.amt ? "600 14px 'Plus Jakarta Sans'" : "500 12px 'Plus Jakarta Sans'", rc: i.amt ? '#17151d' : '#8b8996',
        bg: sel ? 'rgba(139,92,246,.07)' : 'transparent', menu: s.menu === mk, mBg: s.menu === mk ? '#f3f2f7' : 'transparent',
        onMenu: () => this.setState(p => ({ menu: p.menu === mk ? '' : mk })),
        readLabel: s.read[i.id] ? 'Marquer comme non lu' : 'Marquer comme lu', hideLabel: s.hidden[i.id] ? 'Afficher à nouveau' : 'Masquer',
        onRead: () => this.act(this.setFor('read', [i.id], !s.read[i.id])),
        onHide: () => this.act(this.setFor('hidden', [i.id], !s.hidden[i.id]), s.hidden[i.id] ? '' : 'Notification masquée', where),
        onDel: () => this.act(this.setFor('del', [i.id], true), 'Notification supprimée', where),
        selMode, sel: !!sel, selMark: sel ? '✓' : '', selBg: sel ? '#8b5cf6' : '#fff', selBd: sel ? 'none' : 'inset 0 0 0 1.5px rgba(22,18,40,.25)',
        onSel: () => this.setState(p => ({ sel: Object.assign({}, p.sel, { [i.id]: !p.sel[i.id] }) })) }; };
    const sec = (k, where) => { const its = alive.filter(i => i.sec === k && visible(i));
      return { t: SECS[k][0], link: SECS[k][1], n: alive.filter(i => i.sec === k && isUnread(i)).length, items: its.map(i => item(i, where)), empty: its.length === 0, has: its.length > 0 }; };
    const shown = alive.filter(visible);
    const selIds = selMode ? Object.keys(s.sel).filter(k => s.sel[k]) : [];
    const allSel = selMode && shown.length > 0 && selIds.length === shown.length;
    const tabs = [['all', 'Toutes', ''], ['unread', 'Non lues', unread || ''], ['hidden', 'Masquées', alive.filter(i => s.hidden[i.id]).length || '']].map(([k, l, n]) => { const on = s.tab === k;
      return { l, n, on: () => this.setState({ tab: k, menu: '' }), bg: on ? '#fff' : 'transparent', c: on ? '#17151d' : '#64626e', sh: on ? '0 1px 3px rgba(22,18,40,.12)' : 'none', mbg: on ? '#17151d' : 'transparent', mc: on ? '#fff' : '#64626e' }; });
    const n = selIds.length;
    return {
      nav1: NAV1, nav2: NAV2.map(x => ({ l: x[0], d: x[1], b: x[0] === 'Notifications' ? unread : x[0] === 'Messages' ? 3 : 0, bg: x[0] === 'Notifications' ? 'rgba(139,92,246,.1)' : 'transparent', c: x[0] === 'Notifications' ? '#6a3ee0' : '#4a4855' })),
      unread, headline: unread ? unread + ' notification' + (unread > 1 ? 's' : '') + ' non lue' + (unread > 1 ? 's' : '') : 'Tout est à jour', tabs,
      raBg: unread ? 'rgba(139,92,246,.1)' : '#f3f2f7', raC: unread ? '#6a3ee0' : '#8b8996', raMC: unread ? '#6a3ee0' : '#c9c7d1',
      readAll: () => unread && this.act(this.setFor('read', alive.map(i => i.id), true), 'Tout est marqué comme lu'),
      notSel: !selMode, selMode, startSel: () => this.setState({ sel: {}, menu: '' }), endSel: () => this.setState({ sel: null }),
      selLabel: n ? n + ' sélectionnée' + (n > 1 ? 's' : '') : 'Tout sélectionner',
      allSelMark: allSel ? '✓' : n ? '–' : '', allSelBg: n ? '#8b5cf6' : '#fff', allSelBd: n ? 'none' : 'inset 0 0 0 1.5px rgba(22,18,40,.25)',
      toggleAllSel: () => this.setState({ sel: allSel ? {} : Object.fromEntries(shown.map(i => [i.id, true])) }),
      selRead: () => n && this.act(Object.assign(this.setFor('read', selIds, true), { sel: null })),
      selHide: () => n && this.act(Object.assign(this.setFor('hidden', selIds, true), { sel: null }), n + ' masquée' + (n > 1 ? 's' : '')),
      selDel: () => n && this.act(Object.assign(this.setFor('del', selIds, true), { sel: null }), n + ' supprimée' + (n > 1 ? 's' : '')),
      cols: COLS.map(c => ({ secs: c.map(k => sec(k, 'd')).filter(x => s.tab === 'all' || x.has) })),
      secsM: ORDER.map(k => sec(k, 'm')).filter(x => x.has || (s.tab === 'all' && x.empty)).sort((a, b) => a.empty - b.empty),
      toast: s.toast && s.where === 'd' ? s.toast : '', toastM: !!s.toast && s.where === 'm' && !selMode, toastTxt: s.toast,
      undo: () => { clearTimeout(this.tt); this.setState(Object.assign({ toast: '' }, s.prev || {})); }
    };
  }
}
