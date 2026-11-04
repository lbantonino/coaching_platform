const NAV1 = [['Tableau de bord','M3 10.5 12 3l9 7.5V21H3z'],['Agenda','M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z'],['Sportifs','M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],['Programmes','M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5'],['Comptabilité','M5 2h14v20H5zM8 6h8M8 10h2M14 10h2M8 14h2M14 14h2'],['Bibliothèque','M2 4h7a3 3 0 0 1 3 3v14a2 2 0 0 0-2-2H2zM22 4h-7a3 3 0 0 0-3 3v14a2 2 0 0 1 2-2h8z']].map(n => ({ l: n[0], d: n[1] }));
const NAV2 = [['Assistant IA','M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z',0],['Messages','M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',3],['Tâches','M3 6l2 2 3-3M3 13l2 2 3-3M12 7h9M12 14h9M12 20h9',0],['Documents','M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',0],['Notifications','M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0',9]];
const CAT = { Autre: ['#f1f0f4', '#64626e'], Bilan: ['#eef0fd', '#4f46e5'], Contrat: ['#fdeef1', '#be123c'], Facture: ['#f3eefe', '#7c3aed'], Programme: ['#ecf7ef', '#15803d'] };
const DOCS = [
  { n: 'Facture FAC-2026-014', ext: 'PDF', cat: 'Facture', ath: 'Lucas Janssens', ini: 'LJ', size: '741 o', date: '4 nov. 2026', m: 1 },
  { n: 'Programme Hyrox, bloc 1', ext: 'PDF', cat: 'Programme', ath: 'Inès Benali', ini: 'IB', size: '744 o', date: '4 nov. 2026', m: 1 },
  { n: 'Bilan de rentrée', ext: 'PDF', cat: 'Bilan', ath: 'Thomas Peeters', ini: 'TP', size: '737 o', date: '4 nov. 2026', m: 1 },
  { n: 'Contrat de coaching 2026', ext: 'PDF', cat: 'Contrat', ath: 'Sophie Lambert', ini: 'SL', size: '745 o', date: '4 nov. 2026', m: 1 },
  { n: 'Test VMA, résultats', ext: 'XLSX', cat: 'Bilan', ath: 'Thomas Peeters', ini: 'TP', size: '48 Ko', date: '2 nov. 2026', m: 1 },
  { n: 'Facture FAC-2026-013', ext: 'PDF', cat: 'Facture', ath: 'Nadia El Amrani', ini: 'NA', size: '62 Ko', date: '31 oct. 2026' },
  { n: 'Plan nutrition prépa marathon', ext: 'PDF', cat: 'Programme', ath: 'Lucas Janssens', ini: 'LJ', size: '1,2 Mo', date: '28 oct. 2026' },
  { n: 'Photo posture squat', ext: 'JPG', cat: 'Autre', ath: 'Inès Benali', ini: 'IB', size: '2,4 Mo', date: '27 oct. 2026' },
  { n: 'Contrat small group Hyrox', ext: 'PDF', cat: 'Contrat', ath: '', ini: '', size: '210 Ko', date: '24 oct. 2026' },
  { n: 'Bilan postural initial', ext: 'PDF', cat: 'Bilan', ath: 'Nadia El Amrani', ini: 'NA', size: '880 Ko', date: '20 oct. 2026' },
  { n: 'Programme renfo, semaines 1 à 4', ext: 'PDF', cat: 'Programme', ath: 'Sophie Lambert', ini: 'SL', size: '540 Ko', date: '15 oct. 2026' },
  { n: 'Facture FAC-2026-012', ext: 'PDF', cat: 'Facture', ath: 'Thomas Peeters', ini: 'TP', size: '61 Ko', date: '10 oct. 2026' },
  { n: 'Règlement intérieur cours collectifs', ext: 'DOCX', cat: 'Autre', ath: '', ini: '', size: '96 Ko', date: '2 oct. 2026' },
  { n: 'Questionnaire santé PAR-Q', ext: 'PDF', cat: 'Bilan', ath: 'Lucas Janssens', ini: 'LJ', size: '130 Ko', date: '28 sept. 2026' }
];
class Component extends DCLogic {
  state = { cat: 'Tous', quick: '', q: '' };
  renderVals() {
    const s = this.state, q = s.q.trim().toLowerCase();
    const base = DOCS.filter(d => (!q || (d.n + ' ' + d.ath).toLowerCase().includes(q)) && (s.quick !== 'm' || d.m) && (s.quick !== 'a' || d.ini) && (s.quick !== 'n' || !d.ini));
    const sk = s.sk || 'date', sd = s.sd || 'desc';
    const list = base.filter(d => s.cat === 'Tous' || d.cat === s.cat).slice().sort((a, b) => { const r = sk === 'cat' ? a.cat.localeCompare(b.cat) || DOCS.indexOf(a) - DOCS.indexOf(b) : DOCS.indexOf(b) - DOCS.indexOf(a); return sd === 'asc' ? r : -r; });
    const sorter = k => { const on = sk === k; return { c: on ? '#17151d' : '#8b8996', up: on && sd === 'asc' ? '#6a3ee0' : '#c9c7d1', dn: on && sd === 'desc' ? '#6a3ee0' : '#c9c7d1',
      on: () => this.setState(p => (p.sk || 'date') === k ? { sd: (p.sd || 'desc') === 'desc' ? 'asc' : 'desc' } : { sk: k, sd: k === 'cat' ? 'asc' : 'desc' }) }; };
    const chip = (on) => ({ bg: on ? '#17151d' : '#fff', c: on ? '#fff' : '#4a4855', sh: on ? 'none' : 'inset 0 0 0 1px rgba(22,18,40,.12)' });
    const cats = ['Tous'].concat(Object.keys(CAT)).map(k => ({ l: k === 'Tous' ? 'Toutes' : k, n: k === 'Tous' ? base.length : base.filter(d => d.cat === k).length, dot: k === 'Tous' ? 'transparent' : CAT[k][1], mark: s.cat === k ? '✓' : '', bg: s.cat === k ? 'rgba(139,92,246,.08)' : 'transparent', on: () => this.setState({ cat: k, open: '' }) }));
    const quick = [['m', 'Ajoutés ce mois-ci'], ['a', 'Liés à un sportif'], ['n', 'Sans sportif']].map(([k, l]) => Object.assign({ l, on: () => this.setState(p => ({ quick: p.quick === k ? '' : k })) }, chip(s.quick === k)));
    const nav2 = NAV2.map(n => ({ l: n[0], d: n[1], b: n[2], bg: n[0] === 'Documents' ? 'rgba(139,92,246,.1)' : 'transparent', c: n[0] === 'Documents' ? '#6a3ee0' : '#4a4855' }));
    return {
      nav1: NAV1, nav2, cats, sortCat: sorter('cat'), sortDate: sorter('date'), catLabel: s.cat === 'Tous' ? 'Toutes' : s.cat, catDot: s.cat === 'Tous' ? '' : CAT[s.cat][1],
      menuD: s.open === 'd', menuM: s.open === 'm', openD: () => this.setState(p => ({ open: p.open === 'd' ? '' : 'd' })), openM: () => this.setState(p => ({ open: p.open === 'm' ? '' : 'm' })), q: s.q, setQ: e => this.setState({ q: e.target.value }),
      summary: list.length + ' document' + (list.length > 1 ? 's' : '') + ' · 6,6 Mo utilisés',
      empty: list.length === 0,
      hasMore: list.length > 7, moreLabel: s.all ? 'Réduire' : 'Voir plus (' + (list.length - 7) + ')', moreRot: s.all ? 'rotate(180deg)' : 'none',
      toggleMore: () => this.setState(p => ({ all: !p.all })),
      docs: (s.all ? list : list.slice(0, 7)).map(d => ({ n: d.n, ext: d.ext + ' · ' + d.size, cat: d.cat, tbg: CAT[d.cat][0], tc: CAT[d.cat][1], ath: d.ath || 'Aucun sportif', ini: d.ini, ac: d.ini ? '#17151d' : '#8b8996', size: d.size, date: d.date, mob: d.cat + ' · ' + (d.ath || 'Aucun sportif') + ' · ' + d.date }))
    };
  }
}
