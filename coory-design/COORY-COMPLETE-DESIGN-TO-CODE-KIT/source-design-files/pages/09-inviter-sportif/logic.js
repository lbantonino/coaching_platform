const NAV1 = [['Tableau de bord','M3 10.5 12 3l9 7.5V21H3z'],['Agenda','M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z'],['Sportifs','M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],['Programmes','M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5'],['Comptabilité','M5 2h14v20H5zM8 6h8M8 10h2M14 10h2M8 14h2M14 14h2'],['Bibliothèque','M2 4h7a3 3 0 0 1 3 3v14a2 2 0 0 0-2-2H2zM22 4h-7a3 3 0 0 0-3 3v14a2 2 0 0 1 2-2h8z']];
const NAV2 = [['Assistant IA','M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z',0],['Messages','M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',3],['Tâches','M3 6l2 2 3-3M3 13l2 2 3-3M12 7h9M12 14h9M12 20h9',0],['Documents','M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',0],['Notifications','M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0',9]];
const ST = {
  none: { label: 'Pas encore invité', name: 'Sophie Lambert', ini: 'SL', avBg: '#8b5cf6', email: 'sophie.lambert@example.test', pill: 'Pas encore invitée', pBg: '#f1f0f5', pC: '#64626e', text: 'Génère un lien personnel et envoie-le toi-même. Sophie l’ouvrira pour créer son accès avec son adresse e-mail.', primary: 'Générer le lien d’invitation', mPrimary: 'Générer le lien d’invitation', showRules: true },
  link: { label: 'Lien généré', name: 'Sophie Lambert', ini: 'SL', avBg: '#8b5cf6', email: 'sophie.lambert@example.test', pill: 'Lien prêt', pBg: '#ede6ff', pC: '#5b30d6', text: 'Copie le lien maintenant : pour ta sécurité, il ne sera plus affiché ensuite.', isLink: true, mPrimary: 'Copier le lien', showRules: true },
  wait: { label: 'Invitation en attente', name: 'Lucas Janssens', ini: 'LJ', avBg: '#26CBB8', email: 'lucas.janssens@example.test', pill: 'En attente · jusqu’au 10 nov.', pBg: '#fff3d6', pC: '#9a5b0a', text: 'Un lien est valable jusqu’au 10 novembre 2026 à 14:32. Il ne peut pas être réaffiché : génère un nouveau lien si Lucas l’a perdu.', primary: 'Générer un nouveau lien', mPrimary: 'Générer un nouveau lien', second: 'Révoquer ce lien', secC: '#c0213d', showRules: true },
  done: { label: 'Compte déjà activé', name: 'Thomas Peeters', ini: 'TP', avBg: '#FEC14F', email: 'thomas.peeters@example.test', pill: 'Compte activé', pBg: '#e3f6f1', pC: '#11867a', text: 'Thomas a déjà activé son compte. Il se connecte avec son adresse e-mail : aucune invitation à envoyer.', primary: 'Voir la fiche', mPrimary: 'Voir la fiche', second: 'Envoyer un message', secC: '#17151d' }
};
class Component extends DCLogic {
  state = { s: 'none' };
  renderVals() {
    const st = Object.assign({}, ST[this.state.s]); st.first = st.name.split(' ')[0];
    return {
      states: Object.keys(ST).map(k => ({ l: ST[k].label, on: () => this.setState({ s: k }), bg: this.state.s === k ? '#17151d' : 'transparent', c: this.state.s === k ? '#fff' : '#64626e' })),
      st, shares: ['WhatsApp', 'E-mail', 'SMS'],
      rules: [['M12 8v4l3 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'Valable 7 jours'], ['M20 6 9 17l-5-5', 'Utilisable une seule fois'], ['M18 6 6 18M6 6l12 12', 'Rien n’est envoyé automatiquement']].map(([d, l]) => ({ d, l })),
      nav1: NAV1.map(n => ({ l: n[0], d: n[1], bg: n[0] === 'Sportifs' ? 'rgba(139,92,246,.1)' : 'transparent', c: n[0] === 'Sportifs' ? '#6a3ee0' : '#4a4855' })),
      nav2: NAV2.map(n => ({ l: n[0], d: n[1], b: n[2] }))
    };
  }
}
