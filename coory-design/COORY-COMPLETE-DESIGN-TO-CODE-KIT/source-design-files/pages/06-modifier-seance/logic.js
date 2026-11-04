const NAV1 = [['Tableau de bord','M3 10.5 12 3l9 7.5V21H3z'],['Agenda','M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z'],['Sportifs','M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],['Programmes','M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5'],['Comptabilité','M5 2h14v20H5zM8 6h8M8 10h2M14 10h2M8 14h2M14 14h2'],['Bibliothèque','M2 4h7a3 3 0 0 1 3 3v14a2 2 0 0 0-2-2H2zM22 4h-7a3 3 0 0 0-3 3v14a2 2 0 0 1 2-2h8z']];
const NAV2 = [['Assistant IA','M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z',0],['Messages','M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',3],['Tâches','M3 6l2 2 3-3M3 13l2 2 3-3M12 7h9M12 14h9M12 20h9',0],['Documents','M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',0],['Notifications','M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0',9]];
const eur = n => n.toLocaleString('fr-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
class Component extends DCLogic {
  state = { title: 'Coaching force', rec: true, pay: 'Virement', tva: false, price: '65' };
  renderVals() {
    const s = this.state, p = parseFloat(String(s.price).replace(',', '.')) || 0;
    const ht = s.tva ? p / 1.21 : p, ttc = s.tva ? p : p * 1.21;
    const priceLine = p ? eur(ht) + ' HTVA : le sportif paie ' + eur(ttc) + ', TVA de 21 % comprise.' : 'Aucun prix : la séance ne sera pas facturée.';
    return {
      nav1: NAV1.map(n => ({ l: n[0], d: n[1], bg: n[0] === 'Agenda' ? 'rgba(139,92,246,.1)' : 'transparent', c: n[0] === 'Agenda' ? '#6a3ee0' : '#4a4855' })),
      nav2: NAV2.map(n => ({ l: n[0], d: n[1], b: n[2] })),
      title: s.title, setTitle: e => this.setState({ title: e.target.value }),
      rec: s.rec, toggleRec: () => this.setState(x => ({ rec: !x.rec })), recBg: s.rec ? 'rgba(139,92,246,.08)' : '#f8f7fb', swBg: s.rec ? '#8b5cf6' : '#d6d4de', swJ: s.rec ? 'flex-end' : 'flex-start',
      pays: ['Virement', 'Espèces'].map(l => { const on = s.pay === l; return { l, on: () => this.setState({ pay: l }), bg: on ? '#fff' : 'transparent', c: on ? '#17151d' : '#64626e', sh: on ? '0 1px 3px rgba(22,18,40,.12)' : 'none' }; }),
      tva: s.tva, toggleTva: () => this.setState(x => ({ tva: !x.tva })), tvaBg: s.tva ? '#8b5cf6' : '#fff', tvaBd: s.tva ? 'none' : 'inset 0 0 0 1.5px rgba(22,18,40,.25)', tvaMark: s.tva ? '✓' : '',
      price: s.price, setPrice: e => this.setState({ price: e.target.value }), priceLine,
      recap: [{ k: 'Quand', v: s.rec ? 'Chaque jeudi, 07:00' : 'Jeu. 10 sept., 07:00' }, { k: 'Durée', v: '60 min' }, { k: 'Jusqu’au', v: s.rec ? '17 janv. 2027' : '—' }, { k: 'Prix', v: p ? eur(ttc) + ' TTC' : '—' }, { k: 'Paiement', v: s.pay }]
    };
  }
}
