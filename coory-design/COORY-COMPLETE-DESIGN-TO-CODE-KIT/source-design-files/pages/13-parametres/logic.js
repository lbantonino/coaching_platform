const TABS = [
  ['profil', 'Profil', 'Nom, photo', 'Ton nom et ta photo', 'M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10z'],
  ['pref', 'Préférences', 'Thème, agenda, alertes', 'Thème, valeurs par défaut, agenda, notifications', 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6'],
  ['tva', 'Pays, devise et TVA', 'Belgique · EUR · 21 %', 'Ta devise et ton taux de TVA', 'M3 21h18M5 21V10M19 21V10M9 21v-7M15 21v-7M12 3 2 9h20z'],
  ['secu', 'Sécurité', 'E-mail, mot de passe', 'E-mail, mot de passe, appareils', 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'],
  ['data', 'Données', 'Exporter', 'Exporter toutes tes données', 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3']
];
const F = (l, v, o) => Object.assign({ l, v: v || '' }, o || {});
const NOTIF = [['Messages non lus', 'Les messages des sportifs que tu n’as pas encore ouverts.'], ['Tâches du jour et en retard', 'Tes tâches à faire aujourd’hui ou déjà dépassées.'], ['Séances à encaisser', 'Les séances avec un prix, toujours pas payées une semaine après.'], ['Compétitions dans les 7 jours', 'Les compétitions proches de tes sportifs.'], ['Fiches à compléter', 'Les sportifs sans nom de famille ou sans contact.']];
class Component extends DCLogic {
  state = { mOpen: false, tab: 'pref', theme: 'Clair', pay: 'Virement', tvaOn: true, notif: [1, 1, 1, 1, 1] };
  seg(opts, cur, set, l) { return { isSeg: true, l: l || '', opts: opts.map(o => ({ l: o, on: () => set(o), bg: cur === o ? '#fff' : 'transparent', c: cur === o ? '#17151d' : '#64626e', sh: cur === o ? '0 1px 3px rgba(22,18,40,.12)' : 'none' })) }; }
  fields(cols, fs) { return { isFields: true, cols, fields: fs.map(f => Object.assign({ opt: '', suf: '', help: '', caret: false, box: !f.plain, vc: f.ph ? '#8b8996' : '#17151d' }, f)) }; }
  btns(bs) { return { isBtns: true, btns: bs.map(([l, k]) => ({ l, bg: k === 'p' ? '#17151d' : '#fff', c: k === 'p' ? '#fff' : k === 'd' ? '#c0213d' : '#17151d', sh: k === 'p' ? 'none' : 'inset 0 0 0 1px rgba(22,18,40,.14)' })) }; }
  renderVals() {
    const s = this.state;
    const tgl = (rows, arr, set) => ({ isToggles: true, rows: rows.map(([l, d], i) => ({ l, d, aria: arr[i] ? 'true' : 'false', on: () => set(i), bg: arr[i] ? '#8b5cf6' : '#d6d4de', j: arr[i] ? 'flex-end' : 'flex-start', bt: i ? '1px solid rgba(22,18,40,.07)' : 'none' })) });
    const C = {
      profil: [{ t: 'Profil', d: '', items: [this.fields('1fr 1fr', [F('Prénom', 'Gianluca'), F('Nom', 'Lo Bianco')])] }],
      pref: [
        { t: 'Thème', d: '« Système » suit le réglage de ton téléphone ou de ton ordinateur. Retenu sur cet appareil.', items: [this.seg(['Clair', 'Sombre', 'Système'], s.theme, v => this.setState({ theme: v }))] },
        { t: 'Valeurs par défaut', d: 'La fenêtre « Nouvelle séance » se remplit avec ces valeurs. Tu peux toujours les changer.', items: [this.fields('1fr 1fr', [F('Durée', '60', { suf: 'min' }), F('Lieu', 'Ex. : Salle de sport', { opt: 'facultatif', ph: 1 }), F('Prix', 'Ex. : 65', { opt: 'facultatif', ph: 1, suf: '€', help: 'Par virement : prix hors TVA, la TVA de 21 % s’ajoute.' })]), this.seg(['Virement', 'Espèces'], s.pay, v => this.setState({ pay: v }), 'Paiement')] },
        { t: 'Heures de l’agenda', d: 'Heures visibles à l’ouverture de la grille ; elle défile de 00:00 à 24:00.', items: [this.fields('1fr 1fr', [F('À partir de', '06:00', { caret: 1 }), F('Jusqu’à', '22:00', { caret: 1 })])] },
        { t: 'Notifications', d: 'Ce qui compte dans la cloche et s’affiche dans Notifications. Rien n’est envoyé par e-mail ou WhatsApp pour l’instant.', items: [tgl(NOTIF, s.notif, i => this.setState(x => { const n = x.notif.slice(); n[i] = n[i] ? 0 : 1; return { notif: n }; }))] }
      ],
      tva: [
        { t: 'Pays et devise', d: '', items: [this.fields('1fr 1fr', [F('Pays', 'Belgique', { caret: 1, help: 'Proposé pour les adresses ; nomme les moyens de paiement de ton pays.' }), F('Devise', 'Euro (EUR)', { plain: 1, help: 'Tes nouveaux montants sont dans cette devise.' })]), this.btns([['⇄  Changer de devise', 's']])] },
        { t: 'TVA', d: 'Pour le prix de tes séances et ton résultat hors TVA dans la Comptabilité. Tes factures se font dans ton logiciel de facturation ou chez ton comptable.', items: [tgl([['Je facture la TVA', 'Sinon, tes prix et tes gains s’affichent sans TVA.']], [s.tvaOn], () => this.setState(x => ({ tvaOn: !x.tvaOn })))].concat(s.tvaOn ? [this.fields('220px', [F('Taux de TVA', '21', { suf: '%', help: 'Pour tes prochains paiements ; ceux déjà notés gardent leur taux.' })])] : []) }
      ],
      secu: [
        { t: 'Adresse e-mail', d: 'Adresse actuelle : coach-a@example.test', items: [this.fields('1fr', [F('Nouvelle adresse e-mail', '', { help: 'Un lien de confirmation part à la nouvelle adresse ; rien ne change avant ton clic.' })]), this.btns([['Changer d’adresse', 'p']])] },
        { t: 'Mot de passe', d: '', items: [this.fields('1fr 1fr', [F('Mot de passe actuel', '••••••••••', { suf: 'Afficher' }), F('', '', { plain: 1 }), F('Nouveau mot de passe', '', { help: 'Au moins 10 caractères.' }), F('Confirmer le nouveau', '')]), this.btns([['Changer le mot de passe', 'p']])] },
        { t: 'Appareils connectés', d: 'Un téléphone perdu, un ordinateur partagé : déconnecte tous tes appareils d’un coup, celui-ci compris.', items: [this.btns([['Déconnecter partout', 'd'], ['Se déconnecter', 's']])] }
      ],
      data: [{ t: 'Exporter mes données', d: 'Un fichier JSON avec tout ce que contient ton organisation : sportifs, objectifs, séances, programmes, paiements, factures, tâches, messages, notes et structures. Utile pour une sauvegarde ou pour changer d’outil.', items: [this.btns([['↓  Télécharger mes données', 'p']]), { isNote: true, l: 'Il contient des données de santé (blessures notées avec l’accord des sportifs) : garde-le en lieu sûr.' }] }]
    };
    const t = TABS.find(x => x[0] === s.tab);
    return {
      tabs: TABS.map(([k, l, sub, , d]) => { const on = s.tab === k; return { l, s: sub, d, on: () => this.setState({ tab: k }), mon: () => this.setState({ tab: k, mOpen: false }), check: on ? '✓' : '', bg: on ? '#fff' : 'transparent', sh: on ? '0 1px 3px rgba(22,18,40,.08)' : 'none', ibg: on ? '#ede6ff' : '#fff', ic: on ? '#6a3ee0' : '#64626e', sbg: on ? '#17151d' : 'transparent', sc: on ? '#fff' : '#64626e', mbg: on ? '#17151d' : '#fff', mc: on ? '#fff' : '#17151d' }; }),
      mOpen: s.mOpen, mAria: s.mOpen ? 'true' : 'false', mRot: s.mOpen ? 'rotate(180deg)' : 'none', toggleM: () => this.setState({ mOpen: !s.mOpen }),
      cur: { l: t[1], sub: t[3], s: t[2], d: t[4], save: s.tab === 'pref' || s.tab === 'tva' || s.tab === 'profil' },
      cards: C[s.tab].map(c => Object.assign({}, c, { items: c.items.map(it => Object.assign({ isFields: false, isSeg: false, isToggles: false, isBtns: false, isNote: false }, it)) }))
    };
  }
}
