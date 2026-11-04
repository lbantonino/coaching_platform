const NAV1 = [['Tableau de bord','M3 10.5 12 3l9 7.5V21H3z'],['Agenda','M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z'],['Sportifs','M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],['Programmes','M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5'],['Comptabilité','M5 2h14v20H5zM8 6h8M8 10h2M14 10h2M8 14h2M14 14h2'],['Bibliothèque','M2 4h7a3 3 0 0 1 3 3v14a2 2 0 0 0-2-2H2zM22 4h-7a3 3 0 0 0-3 3v14a2 2 0 0 1 2-2h8z']];
const NAV2 = [['Assistant IA','M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z',0],['Messages','M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',3],['Tâches','M3 6l2 2 3-3M3 13l2 2 3-3M12 7h9M12 14h9M12 20h9',0],['Documents','M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',0],['Notifications','M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0',9]];
const RUBS = ['Musculation', 'Cardio', 'Hyrox', 'Mobilité'];
const GROUPS = ['Pectoraux', 'Dos', 'Épaules', 'Biceps', 'Triceps', 'Avant-bras', 'Abdominaux', 'Lombaires', 'Fessiers', 'Hanches et adducteurs', 'Quadriceps', 'Ischio-jambiers', 'Mollets'];
const PRESET = { create: { name: '', rub: 'Musculation', g: {}, mat: 'Aucun : poids du corps' }, variant: { name: 'Sled push (ma variante)', rub: 'Hyrox', g: { Fessiers: 1, Quadriceps: 1, Mollets: 1 }, mat: 'Traîneau' } };
class Component extends DCLogic {
  state = Object.assign({ mode: 'create' }, PRESET.create);
  renderVals() {
    const s = this.state, isVar = s.mode === 'variant';
    const chip = (on, l, fn) => ({ l, on: fn, mark: on ? '✓ ' : '', bg: on ? '#ede6ff' : '#fff', c: on ? '#5b30d6' : '#17151d', sh: on ? 'none' : 'inset 0 0 0 1px rgba(22,18,40,.14)' });
    const sel = GROUPS.filter(g => s.g[g]);
    return {
      modes: [['create', 'Créer un exercice'], ['variant', 'Créer ma variante']].map(([k, l]) => ({ l, on: () => this.setState(Object.assign({ mode: k }, PRESET[k])), bg: s.mode === k ? '#17151d' : 'transparent', c: s.mode === k ? '#fff' : '#64626e' })),
      nav1: NAV1.map(n => ({ l: n[0], d: n[1], bg: n[0] === 'Bibliothèque' ? 'rgba(139,92,246,.1)' : 'transparent', c: n[0] === 'Bibliothèque' ? '#6a3ee0' : '#4a4855' })),
      nav2: NAV2.map(n => ({ l: n[0], d: n[1], b: n[2] })),
      isVar, title: isVar ? 'Créer ma variante' : 'Créer un exercice', crumb: isVar ? 'Bibliothèque · Sled push' : 'Bibliothèque', cta: isVar ? 'Enregistrer ma variante' : 'Créer l’exercice',
      name: s.name, setName: e => this.setState({ name: e.target.value }), nameShown: s.name || 'Nouvel exercice',
      rub: s.rub, rubs: RUBS.map(r => chip(s.rub === r, r, () => this.setState({ rub: r }))),
      groups: GROUPS.map(g => chip(!!s.g[g], g, () => this.setState(p => ({ g: Object.assign({}, p.g, { [g]: !p.g[g] }) })))),
      gCount: sel.length ? sel.length + ' sélectionné' + (sel.length > 1 ? 's' : '') : 'Plusieurs choix possibles', gList: sel.length ? sel.join(', ') : '—', mat: s.mat
    };
  }
}
