const NAV1 = [['Tableau de bord','M3 10.5 12 3l9 7.5V21H3z'],['Agenda','M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z'],['Sportifs','M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],['Programmes','M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5'],['Comptabilité','M5 2h14v20H5zM8 6h8M8 10h2M14 10h2M8 14h2M14 14h2'],['Bibliothèque','M2 4h7a3 3 0 0 1 3 3v14a2 2 0 0 0-2-2H2zM22 4h-7a3 3 0 0 0-3 3v14a2 2 0 0 1 2-2h8z']];
const NAV2 = [['Assistant IA','M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z',0],['Messages','M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',3],['Tâches','M3 6l2 2 3-3M3 13l2 2 3-3M12 7h9M12 14h9M12 20h9',0],['Documents','M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',0],['Notifications','M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0',9]];
const ATH = ['Antoine Maes','Camille Renard','Chloé Martin','Emma Laurent','Inès Benali','Julie Willems','Julien Dubois','Laura Claes','Léa Vandenberghe','Lucas Janssens','Manon','Maxime Leroy','Mehdi Ouali','Nadia El Amrani','Sophie Lambert','Thomas Peeters','Yanis Khelifi'];
const AVC = ['#8b5cf6','#26CBB8','#FEC14F','#7776FF','#f472b6'];
const KIND = { ind: { kindL: 'SÉANCE INDIVIDUELLE', title: 'Coaching force', disc: 'Musculation', lieu: 'Salle de sport', date: 'lun. 7 sept. 2026', hour: '08:15', dur: '60', priceL: 'Prix de la séance', price: '65', who: 'Yanis Khelifi', whoS: 'Séance individuelle' }, coll: { kindL: 'SÉANCE COLLECTIVE', title: 'Circuit Hyrox du samedi', disc: 'Hyrox', lieu: 'Box Hyrox', date: 'sam. 5 sept. 2026', hour: '10:00', dur: '75', priceL: 'Prix pour toute la séance', price: '', who: 'Séance collective', whoS: '' } };
const eur = n => n.toLocaleString('fr-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
class Component extends DCLogic {
  state = { kind: 'coll', title: KIND.coll.title, rec: true, pay: 'Virement', tva: true, price: '', ins: { 'Inès Benali': 1, 'Julie Willems': 1, 'Léa Vandenberghe': 1, 'Mehdi Ouali': 1 } };
  renderVals() {
    const s = this.state, p = parseFloat(String(s.price).replace(',', '.')) || 0;
    const ht = s.tva ? p / 1.21 : p, ttc = s.tva ? p : p * 1.21;
    const K = Object.assign({}, KIND[s.kind], { ind: s.kind === 'ind', coll: s.kind === 'coll' }); const sel = ATH.filter(a => s.ins[a]); const nIns = sel.length + ' inscrit' + (sel.length > 1 ? 's' : ''); if (K.coll) K.whoS = nIns;
    const priceLine = p && K.coll && sel.length ? eur(ttc) + ' TTC pour la séance, soit ' + eur(ttc / sel.length) + ' par inscrit.' : p ? eur(ht) + ' HTVA : le sportif paie ' + eur(ttc) + ', TVA de 21 % comprise.' : (K.coll ? 'Sans prix, la séance ne compte pas dans l’encaissé.' : 'Aucun prix : la séance ne sera pas facturée.');
    return {
      k: K, nIns, clearIns: () => this.setState({ ins: {} }),
      ath: ATH.map(a => { const on = !!s.ins[a]; return { l: a, on: () => this.setState(x => ({ ins: Object.assign({}, x.ins, { [a]: !x.ins[a] }) })), mark: on ? '✓ ' : '', bg: on ? '#ede6ff' : '#fff', c: on ? '#5b30d6' : '#17151d', sh: on ? 'none' : 'inset 0 0 0 1px rgba(22,18,40,.14)' }; }),
      insAv: sel.slice(0, 6).map((a, i) => ({ i: a.split(' ').map(w => w[0]).join('').slice(0, 2), bg: AVC[i % 5] })),
      kinds: [['ind', 'Individuelle'], ['coll', 'Collective']].map(([key, l]) => ({ l, on: () => this.setState({ kind: key, title: KIND[key].title, price: KIND[key].price, tva: key === 'coll' }), bg: s.kind === key ? '#17151d' : 'transparent', c: s.kind === key ? '#fff' : '#64626e' })),
      nav1: NAV1.map(n => ({ l: n[0], d: n[1], bg: n[0] === 'Agenda' ? 'rgba(139,92,246,.1)' : 'transparent', c: n[0] === 'Agenda' ? '#6a3ee0' : '#4a4855' })),
      nav2: NAV2.map(n => ({ l: n[0], d: n[1], b: n[2] })),
      title: s.title, setTitle: e => this.setState({ title: e.target.value }),
      rec: s.rec, toggleRec: () => this.setState(x => ({ rec: !x.rec })), recBg: s.rec ? 'rgba(139,92,246,.08)' : '#f8f7fb', swBg: s.rec ? '#8b5cf6' : '#d6d4de', swJ: s.rec ? 'flex-end' : 'flex-start',
      pays: ['Virement', 'Espèces'].map(l => { const on = s.pay === l; return { l, on: () => this.setState({ pay: l }), bg: on ? '#fff' : 'transparent', c: on ? '#17151d' : '#64626e', sh: on ? '0 1px 3px rgba(22,18,40,.12)' : 'none' }; }),
      tva: s.tva, toggleTva: () => this.setState(x => ({ tva: !x.tva })), tvaBg: s.tva ? '#8b5cf6' : '#fff', tvaBd: s.tva ? 'none' : 'inset 0 0 0 1.5px rgba(22,18,40,.25)', tvaMark: s.tva ? '✓' : '',
      price: s.price, setPrice: e => this.setState({ price: e.target.value }), priceLine,
      recap: [{ k: 'Quand', v: (s.rec ? 'Chaque ' : '') + K.date.split(' ')[0].replace('.', '') + ', ' + K.hour }, { k: 'Durée', v: K.dur + ' min' }, { k: 'Jusqu’au', v: s.rec ? '17 janv. 2027' : '—' }, { k: 'Prix', v: p ? eur(ttc) + ' TTC' : '—' }, { k: 'Paiement', v: s.pay }]
    };
  }
}
