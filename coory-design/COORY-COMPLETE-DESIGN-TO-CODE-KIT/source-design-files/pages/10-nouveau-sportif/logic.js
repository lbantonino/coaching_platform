const NAV1 = [['Tableau de bord','M3 10.5 12 3l9 7.5V21H3z'],['Agenda','M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z'],['Sportifs','M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],['Programmes','M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5'],['Comptabilité','M5 2h14v20H5zM8 6h8M8 10h2M14 10h2M8 14h2M14 14h2'],['Bibliothèque','M2 4h7a3 3 0 0 1 3 3v14a2 2 0 0 0-2-2H2zM22 4h-7a3 3 0 0 0-3 3v14a2 2 0 0 1 2-2h8z']];
const NAV2 = [['Assistant IA','M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z',0],['Messages','M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',3],['Tâches','M3 6l2 2 3-3M3 13l2 2 3-3M12 7h9M12 14h9M12 20h9',0],['Documents','M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',0],['Notifications','M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0',9]];
const I = (l, v, o) => Object.assign({ k: 'input', l, v: v || '' }, o || {});
const SECS = [
  ['Identité', [I('Prénom'), I('Nom de famille', '', { opt: 'facultatif' }), I('Sexe', 'Non renseigné', { opt: 'facultatif', caret: 1, ph: 1 })]],
  ['Contact', [I('Adresse e-mail', '', { opt: 'facultatif', help: 'Elle servira à l’inviter dans son espace sportif.' }), I('Téléphone', '+32 …', { opt: 'facultatif', ph: 1 }), I('Canal de contact préféré', 'Non précisé', { caret: 1, ph: 1 })]],
  ['Profil sportif', [I('Niveau', 'Non précisé', { caret: 1, ph: 1 }), I('Type de programme', 'Non précisé', { caret: 1, ph: 1 }), { k: 'area', l: 'Expérience', v: 'Ex. : course depuis 3 ans, un Hyrox en Open, musculation régulière', full: 1 }, { k: 'chips', id: 'lieux', l: 'Lieux d’entraînement', o: ['Salle de sport', 'Extérieur (route, trail)', 'Piste d’athlétisme', 'Domicile', 'Box Hyrox / CrossFit'], full: 1 }, { k: 'area', l: 'Matériel disponible', v: 'Ex. : haltères jusqu’à 20 kg, kettlebell 16 kg, rameur', full: 1 }, { k: 'seg', id: 'statut', l: 'Statut', o: ['Actif', 'En pause', 'Archivé'], full: 1 }]],
  ['Objectif principal', [I('Type d’objectif', 'Pas encore défini', { opt: 'facultatif', caret: 1, ph: 1 }), I('Date visée', 'jj/mm/aaaa', { opt: 'facultatif', ph: 1 }), I('Prochaine compétition', 'Ex. : Hyrox Bruxelles', { opt: 'facultatif', ph: 1, full: 1, help: 'Avec un nom, l’objectif devient une compétition : indique alors sa date.' })]],
  ['Disponibilités', [I('Séances par semaine'), I('Durée maximale d’une séance (min)'), { k: 'chips', id: 'jours', l: 'Jours disponibles', o: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'], full: 1 }, { k: 'area', l: 'Contraintes d’organisation', v: 'Ex. : déplacements le jeudi ; séances avant 8 h en semaine', full: 1 }]],
  ['Notes', [{ k: 'consent', l: 'Blessures et points d’attention', full: 1, help: 'Sans accord, tu pourras le faire plus tard depuis sa fiche.' }, { k: 'area', l: 'Notes libres', opt: 'facultatif', v: 'Ex. : très motivée, préfère les séances du matin ; vient en vélo', full: 1, help: 'Visible seulement par les coachs. Pas de blessures ici.' }]]
];
class Component extends DCLogic {
  state = { lieux: { 'Salle de sport': 1 }, jours: {}, statut: 'Actif', consent: false };
  renderVals() {
    const s = this.state;
    const tog = (id, o) => () => this.setState(p => ({ [id]: Object.assign({}, p[id], { [o]: !p[id][o] }) }));
    const sections = SECS.map(([t, fs], i) => ({ n: i + 1, t, fields: fs.map(f => {
      const on = o => f.k === 'seg' ? s.statut === o : !!(s[f.id] || {})[o];
      return { l: f.l, opt: f.opt || '', v: f.v, vc: f.ph ? '#8b8996' : '#17151d', caret: !!f.caret, help: f.help || '', span: f.full ? '1 / -1' : 'auto',
        isInput: f.k === 'input', isArea: f.k === 'area', isChips: f.k === 'chips', isSeg: f.k === 'seg', isConsent: f.k === 'consent',
        opts: (f.o || []).map(o => ({ l: o, on: f.k === 'seg' ? () => this.setState({ statut: o }) : tog(f.id, o), mark: on(o) ? '✓ ' : '', bg: on(o) ? '#ede6ff' : '#fff', c: on(o) ? '#5b30d6' : '#17151d', sh: on(o) ? 'none' : 'inset 0 0 0 1px rgba(22,18,40,.14)', sbg: on(o) ? '#fff' : 'transparent', sc: on(o) ? '#17151d' : '#64626e', ssh: on(o) ? '0 1px 2px rgba(22,18,40,.1)' : 'none' })) };
    }) }));
    return {
      sections, toc: SECS.map(([t], i) => ({ n: i + 1, t, bg: i === 0 ? '#f5f2fe' : 'transparent', c: i === 0 ? '#5b30d6' : '#4a4855' })),
      consent: s.consent, consentAria: s.consent ? 'true' : 'false', consentJ: s.consent ? 'flex-end' : 'flex-start', consentBg: s.consent ? '#8b5cf6' : '#d9d7e2', toggleConsent: () => this.setState({ consent: !s.consent }),
      nav1: NAV1.map(n => ({ l: n[0], d: n[1], bg: n[0] === 'Sportifs' ? 'rgba(139,92,246,.1)' : 'transparent', c: n[0] === 'Sportifs' ? '#6a3ee0' : '#4a4855' })),
      nav2: NAV2.map(n => ({ l: n[0], d: n[1], b: n[2] }))
    };
  }
}
