class Component extends DCLogic {
  state = { plusM: false, dlgD: true, dlgM: true, ctx: 'none', chats: { dlgD: [], dlgM: [], pageD: [], pageM: [] }, drafts: { dlgD: '', dlgM: '', pageD: '', pageM: '' } };
  iaBtnRef = React.createRef();
  componentDidUpdate() { this.measure(); }
  measure() { const b = this.iaBtnRef.current; if (!b) return; const fr = b.closest('[data-screen-label]'); const d = fr && fr.querySelector('[role=dialog]'); if (!d) return; const br = b.getBoundingClientRect(), dr = d.getBoundingClientRect(), sc = dr.width / d.offsetWidth || 1; const v = Math.round((dr.right - (br.left + br.width / 2)) / sc - 8) + 'px'; if (v !== this.state.notchD) this.setState({ notchD: v }); }
  refs = { dlgD: React.createRef(), dlgM: React.createRef(), pageD: React.createRef(), pageM: React.createRef() };
  componentDidMount() { setTimeout(() => this.measure(), 80); this.onEsc = e => { if (e.key === 'Escape') this.setState({ dlgD: false, dlgM: false }); }; window.addEventListener('keydown', this.onEsc); }
  componentWillUnmount() { window.removeEventListener('keydown', this.onEsc); }
  reply(text) {
    const t = text.toLowerCase();
    const R = /résum|resum|inès|ines/.test(t) ? ['Inès a fait 4 séances sur 5 cette semaine, ressenti moyen 7/10. Sa séance de mercredi est passée.', ['Lui envoyer un message d’encouragement', 'Décaler la séance manquée à samedi', 'Ajouter une note sur sa fiche']]
      : /séance|seance|planifi|agenda/.test(t) ? ['Voici une proposition pour ta semaine. Les créneaux sont libres dans ton agenda.', ['Planifier Inès mardi à 07:00', 'Planifier Thomas jeudi à 12:15', 'Envoyer une notification aux deux sportifs']]
      : /paiement|factur|relanc|€/.test(t) ? ['Sophie Lambert a une facture d’octobre en attente : 150,00 €.', ['Envoyer un rappel poli à Sophie', 'Créer une tâche « Vérifier le paiement » pour vendredi']]
      : /programme|bloc/.test(t) ? ['J’ai préparé le bloc 2 du programme de Lucas à partir de son bloc 1 et de ses retours.', ['Créer le bloc 2 (4 semaines) en brouillon', 'Augmenter les charges de 5 % sur les squats', 'Prévenir Lucas quand le bloc est publié']]
      : ['Voici ce que je propose. Rien n’est fait sans ta validation.', ['Créer une tâche « ' + text.slice(0, 48) + ' »', 'L’ajouter à la liste Programmes']];
    return { ai: true, text: R[0], actions: R[1].map(l => ({ l, ck: true })), done: false };
  }
  send(k, text) {
    const v = (text != null ? text : this.state.drafts[k]).trim(); if (!v) return;
    this.setState(p => ({ chats: Object.assign({}, p.chats, { [k]: p.chats[k].concat([{ ai: false, text: v }, this.reply(v)]) }), drafts: Object.assign({}, p.drafts, { [k]: '' }) }));
  }
  chat(k) {
    const s = this.state, msgs = s.chats[k], d = s.drafts[k];
    return {
      ref: this.refs[k], draft: d, cantSend: !d.trim(), sendBg: d.trim() ? '#8b5cf6' : '#cfc8e6', sendBgD: d.trim() ? '#8b5cf6' : '#d9d2f2',
      setDraft: e => { const v = e.target.value; this.setState(p => ({ drafts: Object.assign({}, p.drafts, { [k]: v }) })); },
      onKey: e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(k); } },
      send: () => this.send(k),
      empty: msgs.length === 0, hasMsgs: msgs.length > 0,
      sugg: SUGG.map(([l, d, q]) => ({ l, d, pick: () => this.send(k, q) })),
      msgs: msgs.map((m, mi) => {
        const n = m.ai ? m.actions.filter(a => a.ck).length : 0;
        const upd = fn => this.setState(p => { const arr = p.chats[k].slice(); arr[mi] = fn(Object.assign({}, arr[mi])); return { chats: Object.assign({}, p.chats, { [k]: arr }) }; });
        return { isUser: !m.ai, isAi: m.ai, text: m.text,
          actions: m.ai ? m.actions.map((a, ai) => ({ l: a.l, ck: a.ck ? 'true' : 'false', mark: a.ck ? '✓' : '', bd: m.done ? (a.ck ? '#15803d' : 'rgba(22,18,40,.2)') : (a.ck ? '#8b5cf6' : 'rgba(22,18,40,.25)'), bg: a.ck ? (m.done ? '#15803d' : '#8b5cf6') : 'transparent', tc: m.done && !a.ck ? '#8b8996' : '#17151d', dec: m.done && !a.ck ? 'line-through' : 'none', toggle: () => { if (!m.done) upd(x => { x.actions = x.actions.map((y, yi) => yi === ai ? Object.assign({}, y, { ck: !y.ck }) : y); return x; }); } })) : [],
          note: m.done ? n + (n > 1 ? ' actions faites ✓' : ' action faite ✓') : 'Coche ce que tu gardes', canValidate: m.ai && !m.done, btn: n ? 'Valider ' + n + (n > 1 ? ' actions' : ' action') : 'Rien à valider', validate: () => { if (n) upd(x => { x.done = true; return x; }); } };
      })
    };
  }
  renderVals() {
    const s = this.state;
    const reset = k => () => this.setState(p => ({ chats: Object.assign({}, p.chats, { [k]: [] }), drafts: Object.assign({}, p.drafts, { [k]: '' }) }));
    return {
      nav1: N1.filter(([l]) => l !== 'Facturation').map(([l, d]) => ({ l, d, bg: 'transparent', c: '#4a4855' })),
      nav2: N2.map(([l, d, b]) => ({ l, d, b: b || '', bg: l === 'Assistant IA' ? 'rgba(139,92,246,.12)' : 'transparent', c: l === 'Assistant IA' ? '#17151d' : '#4a4855' })),
      nav1Dash: N1.filter(([l]) => l !== 'Facturation').map(([l, d], i) => ({ l, d, bg: i === 0 ? 'rgba(139,92,246,.12)' : 'transparent', c: i === 0 ? '#17151d' : '#4a4855' })),
      nav2Dash: N2.map(([l, d, b]) => ({ l, d, b: b || '', bg: 'transparent', c: '#4a4855' })),
      dlgDOpen: s.dlgD, dlgMOpen: s.dlgM, dlgDExp: s.dlgD ? 'true' : 'false', dlgMExp: s.dlgM ? 'true' : 'false', btnZ: s.dlgD ? 12 : 1, btnShD: s.dlgD ? '0 0 0 3px #fff, 0 0 22px 4px rgba(139,92,246,.65)' : 'none', iaBtnRef: this.iaBtnRef, notchD: s.notchD || '96px',
      toggleDlgD: () => this.setState({ dlgD: !s.dlgD }), toggleDlgM: () => this.setState({ dlgM: !s.dlgM }),
      closeD: () => this.setState({ dlgD: false }), closeM: () => this.setState({ dlgM: false }),
      plusMOpen: s.plusM, btnZM: s.dlgM ? 12 : 1, btnShM: s.dlgM ? '0 0 0 4px rgba(255,255,255,.9), 0 0 24px 4px rgba(139,92,246,.7)' : 'none', plusMBgD: s.plusM ? '#17151d' : '#f3f2f7', plusMCD: s.plusM ? '#fff' : '#4a4855', greetM: s.chats.dlgM.length === 0 && !s.plusM, plusMExp: s.plusM ? 'true' : 'false', plusMBg: s.plusM ? '#17151d' : '#f3f2f7', plusMC: s.plusM ? '#fff' : '#4a4855', plusMRot: s.plusM ? 'rotate(45deg)' : 'none',
      togglePlusM: () => this.setState({ plusM: !s.plusM }),
      plusItems: [['Joindre un fichier', 'M21.4 11.1l-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5', null]].concat(SUGG).map(([l, d, q], i) => ({ l, d, sep: i === 1 ? '1px solid rgba(22,18,40,.06)' : '0', sepD: i === 1 ? '1px solid rgba(22,18,40,.06)' : '0', bgD: i ? '#ede6ff' : '#fff', cD: i ? '#6a3ee0' : '#4a4855', bg: i ? '#f1edfc' : '#f3f2f7', c: i ? '#6a3ee0' : '#4a4855', pick: () => { this.setState({ plusM: false }); if (q) this.send('dlgM', q); } })),
      c_dlgD: this.chat('dlgD'), c_dlgM: this.chat('dlgM'), c_pageD: this.chat('pageD'), c_pageM: this.chat('pageM'),
      newChatD: reset('pageD'), newChatM: reset('pageM'),
      ctxChips: [['ath', 'Sportif', 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0']].map(([k, l, d]) => { const on = s.ctx === k; return { l: on ? 'Inès Benali' : l, d, sel: on ? 'true' : 'false', pick: () => this.setState({ ctx: on ? 'none' : k }), bg: on ? '#f1edfc' : '#fff', c: on ? '#5b2fc9' : '#4a4855', bd: on ? '#c9b8fb' : 'rgba(22,18,40,.12)' }; }),
      pageCards: [['Programmer', 'Crée ou adapte un programme à partir des retours d’un sportif.', 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M9 13h6M9 17h6', 'Prépare le bloc 2 du programme de Lucas'], ['Analyser', 'Résume la semaine d’un sportif : séances, ressenti, progression.', 'M4 20V10M10 20V4M16 20v-8M22 20H2', 'Résume la semaine d’Inès'], ['Administratif', 'Relances de paiement, tâches et agenda, en un message.', 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', 'Relance les paiements en retard']].map(([t, sub, d, q]) => ({ t, s: sub, d, pickD: () => this.send('pageD', q), pickM: () => this.send('pageM', q) })),
      history: [['AUJOURD’HUI', ['Bloc 2 de Lucas', 'Planning de la semaine']], ['CETTE SEMAINE', ['Relance facture Sophie', 'Résumé de la semaine d’Inès', 'Idées de séances Hyrox', 'Programme de Chloé après blessure']]].map(([g, items], gi) => ({ g, items: items.map((l, i) => ({ l, bg: gi === 0 && i === 0 && s.chats.pageD.length ? '#f1edfc' : 'transparent' })) })),
      kpis: [['Séances aujourd’hui', '6'], ['Sportifs actifs', '18'], ['À valider', '3'], ['Ce mois-ci', '2\u202f691,98\u00a0€']].map(([l, v]) => ({ l, v })),
      today: [['07:00', 'Inès B.', 'Hyrox', '#fff3d6'], ['08:15', 'Chloé M.', 'Musculation', '#fbe1e6'], ['12:15', 'Thomas P.', 'Running', '#e7e6ff'], ['17:00', 'Maxime L.', 'Hybride', '#d8f4f0']].map(([h, n, sub, bg]) => ({ h, n, s: sub, bg })),
      tasks: ['Préparer le bloc 2 de Lucas', 'Relancer Sophie', 'Mettre à jour les repères de Thomas']
    };
  }
}
const N1 = [['Tableau de bord', 'M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z'], ['Agenda', 'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM16 2v4M8 2v4M3 10h18'], ['Sportifs', 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8'], ['Programmes', 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5'], ['Facturation', 'M5 3h14v18H5zM12 7v10M15 9.5c0-1.4-1.3-2-3-2s-3 .8-3 2 1.3 1.7 3 2 3 .8 3 2-1.3 2-3 2-3-.6-3-2'], ['Comptabilité', 'M5 2h14v20H5zM8 6h8M8 10h2M12 10h2M8 14h2M12 14h2M8 18h2M12 18h2'], ['Bibliothèque', 'M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2zM22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z']];
const N2 = [['Assistant IA', 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z'], ['Messages', 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', '3'], ['Tâches', 'M3 5l2 2 3-3M3 12l2 2 3-3M3 19l2 2 3-3M12 6h9M12 13h9M12 20h9'], ['Documents', 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'], ['Notifications', 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0', '9']];

const SUGG = [['Créer un programme', 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6', 'Prépare le bloc 2 du programme de Lucas'], ['Planifier une séance', 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', 'Planifie les séances de la semaine prochaine'], ['Résumer la semaine d’Inès', 'M4 20V10M10 20V4M16 20v-8M22 20H2', 'Résume la semaine d’Inès'], ['Relancer un paiement', 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6', 'Relance les paiements en retard'], ['Ajouter une tâche', 'M3 5l2 2 3-3M12 6h9M3 12l2 2 3-3M12 13h9', 'Ajoute une tâche : commander des kettlebells']];
