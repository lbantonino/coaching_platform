class Component extends DCLogic {
  state = { chart: 'pie', period: 'month', month: 11, tab: 'pay', filter: 'all', showAll: false, table: false, empty: false, sheet: false };
  renderVals() {
    const s = this.state;
    const eur = (n, sign) => { const a = Math.abs(n).toFixed(2).split('.'); const v = a[0].replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f') + ',' + a[1] + '\u00a0€'; return (sign && n > 0 ? '+' : n < 0 ? '\u2212' : '') + v; };
    const dash = n => n ? eur(n) : '–';
    const M = MONTHS, cm = M[s.month];
    const week = { label: 'Cette semaine', g: 2691.98, d: 0, gs: '5 paiements · 3\u202f257,30\u00a0€ reçus TVAC', ds: 'Aucune dépense', v: 1657.30, b: 1500, e: 100 };
    const year = M.reduce((a, m) => ({ g: a.g + m.g, d: a.d + m.d, v: a.v + m.v, b: a.b + m.b, e: a.e + m.e }), { g: 0, d: 0, v: 0, b: 0, e: 0 });
    const P = s.period === 'week' ? Object.assign({}, week, { s1: '5 paiements', s2: '3\u202f257,30\u00a0€ TVAC', t1: 'Aucune dépense', t2: '\u00a0' }) : s.period === 'year' ? Object.assign({ label: '12 derniers mois', s1: '100 paiements', s2: '8\u202f699,85\u00a0€ TVAC', t1: 'TVA récupérable', t2: '492,78\u00a0€' }, year) : { label: cm.full, g: cm.g, d: cm.d, s1: cm.s1, s2: cm.s2, t1: cm.t1, t2: cm.t2, v: cm.v, b: cm.b, e: cm.e };
    const res = P.g - P.d;
    const tot = P.v + P.b + P.e;
    const modes = [['Virement', P.v, '#8b5cf6'], ['Bancontact', P.b, '#7776FF'], ['Espèces', P.e, '#26CBB8'], ['Autre', 0, '#d9d7e2']];
    const PAY = PAYMENTS.filter(p => s.filter === 'all' || (s.filter === 'bank' ? p.m !== 'Espèces' : p.m === 'Espèces'));
    const lists = { pay: PAY.map(p => ({ d: p.d, n: p.n, s: p.m + ' · ' + p.s, v: eur(p.v), vc: '#17151d' })), dep: DEPENSES.map(p => ({ d: p.d, n: p.n, s: p.s, v: eur(-p.v), vc: '#17151d' })), due: DUE.map(p => ({ d: p.d, n: p.n, s: p.s, v: eur(p.v), vc: '#9a5b0a' })) };
    const LIMIT = 5, all = lists[s.tab], total = s.tab === 'pay' ? (s.filter === 'all' ? 100 : all.length) : all.length;
    const rows = s.showAll ? all : all.slice(0, LIMIT);
    const mx = Math.max.apply(null, M.map(m => Math.max(m.g, m.d))); const nice = Math.ceil(mx / 500) * 500;
    const nonEmpty = M.map((m, i) => Object.assign({ i }, m)).filter(m => m.g || m.d).reverse();
    const shown = s.empty ? M.map((m, i) => Object.assign({ i }, m)).reverse() : nonEmpty;
    const ttot = M.reduce((a, m) => ({ v: a.v + m.v, b: a.b + m.b, e: a.e + m.e, g: a.g + m.g, d: a.d + m.d }), { v: 0, b: 0, e: 0, g: 0, d: 0 });
    return {
      nav1: N1.filter(([l]) => l !== 'Facturation').map(([l, d]) => ({ l, d, bg: l === 'Comptabilité' ? 'rgba(139,92,246,.12)' : 'transparent', c: l === 'Comptabilité' ? '#17151d' : '#4a4855' })),
      nav2: N2.map(([l, d, b]) => ({ l, d, b: b || '', bg: 'transparent', c: '#4a4855' })),
      periods: [['week', 'Semaine'], ['month', 'Mois'], ['year', 'Année']].map(([k, l]) => { const on = s.period === k; return { l, sel: on ? 'true' : 'false', pick: () => this.setState({ period: k }), bg: on ? '#fff' : 'transparent', bgM: on ? '#ece9f7' : 'transparent', c: on ? '#17151d' : '#64626e', sh: on ? '0 1px 2px rgba(22,18,40,.08)' : 'none', shM: 'none' }; }),
      cur: { label: P.label, res: eur(res, true), resC: res >= 0 ? '#17151d' : '#c0213d' },
      heroStats: [['Gagné HTVA', P.g, P.s1, P.s2, '#8b5cf6', ''], ['Dépensé HTVA', P.d, P.t1, P.t2, '#FEC14F', ''], ['Gagné cette semaine', week.g, '5 paiements', 'Résultat ' + eur(week.g, true), '#d9d7e2', 'grid-column:1 / -1;']].map(k => ({ l: k[0], v: eur(k[1]), s1: k[2], s2: k[3], c: k[4], mspan: k[5] })),
      cs: { label: P.label, items: [['Gagné', eur(P.g), '#17151d'], ['Dépensé', eur(P.d), '#17151d'], ['Résultat', eur(res, true), res >= 0 ? '#11867a' : '#c0213d']].map(([l, v, vc]) => ({ l, v, vc })) },
      yTicks: [0, 0.5, 1].map(f => ({ b: (f * 100) + '%', l: f ? (f * nice / 1000).toString().replace('.', ',') + ' k' : '0', line: f ? 'rgba(22,18,40,.06)' : 'transparent' })),
      bars: M.map((m, i) => { const on = s.period === 'month' && s.month === i; return { m: m.s, ms: m.s.slice(0, 1).toUpperCase(), aria: m.full, sel: on ? 'true' : 'false', g: (m.g / nice * 100) + '%', d: (m.d / nice * 100) + '%', gc: on || s.period !== 'month' ? '#8b5cf6' : '#cbbcf7', dc: on || s.period !== 'month' ? '#FEC14F' : '#fde2a6', bg: on ? '#f5f2fe' : 'transparent', lc: on ? '#17151d' : '#8b8996', pick: () => this.setState({ month: i, period: 'month' }) }; }),
      isBar: s.chart === 'bar', isPie: s.chart === 'pie',
      chartTypes: [['pie', 'Graphique circulaire', 'M21.2 15.9A10 10 0 1 1 8 2.8M22 12A10 10 0 0 0 12 2v10z'], ['bar', 'Graphique en barre', 'M3 6h18M3 12h12M3 18h7']].map(([k, l, d]) => { const on = s.chart === k; return { l, d, sel: on ? 'true' : 'false', pick: () => this.setState({ chart: k }), bg: on ? '#fff' : 'transparent', c: on ? '#17151d' : '#8b8996', sh: on ? '0 1px 2px rgba(22,18,40,.08)' : 'none' }; }),
      rep: { sub: P.label + ' · montants TVA comprise', total: eur(tot), arcs: (() => { const C = 2 * Math.PI * 72, out = []; let acc = 0; modes.filter(m => m[1] > 0).forEach(([l, v, c], i, arr) => { const len = tot ? v / tot * C : 0, gap = arr.length > 1 ? 3 : 0; out.push({ c, da: Math.max(0, len - gap) + ' ' + C, off: String(-acc) }); acc += len; }); return out; })(), rows: modes.map(([l, v, c]) => ({ l, c, w: tot ? (v / tot * 100) + '%' : '0%', p: tot ? Math.round(v / tot * 100) + ' %' : '0 %', v: eur(v), vc: v ? '#17151d' : '#8b8996' })) },
      mvTabs: [['pay', 'Paiements'], ['dep', 'Dépenses'], ['due', 'À encaisser']].map(([k, l]) => { const on = s.tab === k; return { l, sel: on ? 'true' : 'false', pick: () => this.setState({ tab: k, showAll: false }), bg: on ? '#fff' : 'transparent', c: on ? '#17151d' : '#64626e', sh: on ? '0 1px 2px rgba(22,18,40,.08)' : 'none' }; }),
      mvFilters: [['all', 'Tous'], ['bank', 'Compte bancaire'], ['cash', 'Espèces et autres']].map(([k, l]) => { const on = s.filter === k; return { l, sel: on ? 'true' : 'false', pick: () => this.setState({ filter: k, showAll: false }), bg: on ? '#17151d' : '#fff', c: on ? '#fff' : '#17151d', bd: on ? '#17151d' : 'rgba(22,18,40,.12)' }; }),
      mv: { sub: s.tab === 'pay' ? '100 paiements · montants TVA comprise' : s.tab === 'dep' ? DEPENSES.length + ' dépenses · montants TVA comprise' : DUE.length + ' paiement à encaisser', hasFilters: s.tab === 'pay', rows, more: all.length > LIMIT, moreL: s.showAll ? 'Afficher moins' : 'Voir les ' + total + ' ' + (s.tab === 'pay' ? 'paiements' : 'mouvements'), rot: s.showAll ? 'rotate(180deg)' : 'none' },
      toggleAll: () => this.setState({ showAll: !s.showAll }),
      tableOpen: s.table, tableExp: s.table ? 'true' : 'false', tableBtn: s.table ? 'Masquer' : 'Afficher', tableRot: s.table ? 'rotate(180deg)' : 'none',
      tableSub: '12 mois · reçu par mode, gagné, dépensé et résultat HTVA', toggleTable: () => this.setState({ table: !s.table }),
      tRows: shown.map(m => ({ m: m.full, v: dash(m.v), b: dash(m.b), e: dash(m.e), g: dash(m.g), d: dash(m.d), r: (m.g || m.d) ? eur(m.g - m.d, true) : '–', rc: m.g - m.d < 0 ? '#c0213d' : (m.g - m.d > 0 ? '#11867a' : '#8b8996'), bg: s.period === 'month' && m.i === s.month ? '#f5f2fe' : 'transparent' })),
      emptyHidden: true, emptyL: s.empty ? 'Masquer les mois sans activité' : 'Afficher les ' + (M.length - nonEmpty.length) + ' mois sans activité', toggleEmpty: () => this.setState({ empty: !s.empty }),
      tTot: { v: eur(ttot.v), b: eur(ttot.b), e: eur(ttot.e), g: eur(ttot.g), d: eur(ttot.d), r: eur(ttot.g - ttot.d, true) },
      sheetOpen: s.sheet, sheetExp: s.sheet ? 'true' : 'false', fabRot: s.sheet ? 'rotate(45deg)' : 'none', fabLabel: s.sheet ? 'Fermer' : 'Ajouter un paiement ou une dépense',
      toggleSheet: () => this.setState({ sheet: !s.sheet }), closeSheet: () => this.setState({ sheet: false }),
      sheetItems: [['Nouveau paiement', 'Un sportif t\u2019a payé', 'M12 5v14M5 12h14', '#ede6ff', '#6a3ee0'], ['Nouvelle dépense', 'Salle, matériel, abonnement…', 'M5 12h14', '#fff3d6', '#9a5b0a']].map(x => ({ l: x[0], s: x[1], d: x[2], bg: x[3], c: x[4] }))
    };
  }
}
const N1 = [['Tableau de bord', 'M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z'], ['Agenda', 'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM16 2v4M8 2v4M3 10h18'], ['Sportifs', 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8'], ['Programmes', 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5'], ['Facturation', 'M5 3h14v18H5zM12 7v10M15 9.5c0-1.4-1.3-2-3-2s-3 .8-3 2 1.3 1.7 3 2 3 .8 3 2-1.3 2-3 2-3-.6-3-2'], ['Comptabilité', 'M5 2h14v20H5zM8 6h8M8 10h2M12 10h2M8 14h2M12 14h2M8 18h2M12 18h2'], ['Bibliothèque', 'M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2zM22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z']];
const N2 = [['Assistant IA', 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z'], ['Messages', 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', '3'], ['Tâches', 'M3 5l2 2 3-3M3 12l2 2 3-3M3 19l2 2 3-3M12 6h9M12 13h9M12 20h9'], ['Documents', 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'], ['Notifications', 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0', '9']];

const MONTHS = ['déc.|Décembre 2025', 'janv.|Janvier 2026', 'févr.|Février 2026', 'mars|Mars 2026', 'avr.|Avril 2026', 'mai|Mai 2026', 'juin|Juin 2026', 'juil.|Juillet 2026', 'août|Août 2026', 'sept.|Septembre 2026', 'oct.|Octobre 2026', 'nov.|Novembre 2026'].map(x => { const [s, full] = x.split('|'); return { s, full, g: 0, d: 0, v: 0, b: 0, e: 0, s1: 'Aucun paiement', s2: '\u00a0', t1: 'Aucune dépense', t2: '\u00a0' }; });
Object.assign(MONTHS[8], { d: 500, t1: 'TVA récupérable', t2: '105,00\u00a0€' });
Object.assign(MONTHS[9], { g: 3021.16, d: 740, v: 3460.60, e: 195, s1: '24 paiements', s2: '3\u202f655,60\u00a0€ TVAC', t1: 'TVA récupérable', t2: '155,40\u00a0€' });
Object.assign(MONTHS[10], { g: 3175.17, d: 606.61, v: 3581.95, e: 260, s1: '27 paiements', s2: '3\u202f841,95\u00a0€ TVAC', t1: 'TVA récupérable', t2: '127,38\u00a0€' });
Object.assign(MONTHS[11], { g: 2691.98, d: 500, v: 1657.30, b: 1500, e: 100, s1: '5 paiements', s2: '3\u202f257,30\u00a0€ TVAC', t1: 'TVA récupérable', t2: '105,00\u00a0€' });
const PAYMENTS = [
  { d: '3 nov.', n: 'Chloé Martin', m: 'Virement', s: 'Forfait du mois', v: 1500 },
  { d: '3 nov.', n: 'Inès Benali', m: 'Bancontact', s: 'Forfait du mois', v: 1500 },
  { d: '2 nov.', n: 'Nadia El Amrani', m: 'Espèces', s: '82,64 € HTVA', v: 100 },
  { d: '2 nov.', n: 'Nadia El Amrani', m: 'Virement', s: '65,00 € HTVA', v: 78.65 },
  { d: '2 nov.', n: 'Yanis Khelifi', m: 'Virement', s: '65,00 € HTVA', v: 78.65 },
  { d: '30 oct.', n: 'Thomas Peeters', m: 'Virement', s: 'Forfait du mois', v: 200 },
  { d: '27 oct.', n: 'Antoine Maes', m: 'Virement', s: '65,00 € HTVA', v: 78.65 },
  { d: '20 oct.', n: 'Chloé Martin', m: 'Virement', s: '65,00 € HTVA', v: 78.65 },
  { d: '19 oct.', n: 'Manon', m: 'Virement', s: '65,00 € HTVA', v: 78.65 },
  { d: '16 oct.', n: 'Mobilité & gainage · collectif', m: 'Espèces', s: '53,72 € HTVA', v: 65 },
  { d: '15 oct.', n: 'Sophie Lambert', m: 'Virement', s: '65,00 € HTVA', v: 78.65 }
];
const DEPENSES = [
  { d: '1 nov.', n: 'Location de la salle', s: 'Novembre · 400,00 € HTVA', v: 484 },
  { d: '1 nov.', n: 'Matériel · kettlebells', s: '100,00 € HTVA', v: 121 }
];
const DUE = [
  { d: '31 oct.', n: 'Sophie Lambert', s: 'Facture d\u2019octobre · en retard', v: 150 }
];
