# 07 · Messages — contenu (textes)

> Extraction automatique du fichier source. **Statiques** = textes du gabarit (libellés d’interface, à reprendre tels quels). **Données de démo** = valeurs du fichier `logic.js` (noms, montants, dates, listes) : elles illustrent la maquette et doivent être remplacées par les données réelles de COORY.

## Textes statiques du gabarit

- body{margin:0;background:#dcdbe3}*{box-sizing:border-box}a{color:#6a3ee0;text-decoration:none}a:hover{color:#8b5cf6}input::placeholder{color:#8b8996}
- 1a
- Desktop · 1280 · Messages
- GL
- Gianluca Lo Bianco
- Coach
- Messages
- Rechercher dans Coory
- ⌘K
- Assistant IA
- 9
- Nouveau message
- Nouvelle conversation
- Écrire à un sportif
- Nouveau groupe
- Cours collectif, small group
- Conversations
- Rechercher une conversation
- Aucune conversation
- Essaie un autre filtre.
- Aujourd’hui
- 1b
- Mobile · Conversations
- 9:41
- 5G ▮
- Rechercher
- 1c
- Mobile · Conversation de groupe
- Small group Hyrox
- 8 membres · Voir les membres
- Prochaine séance · jeu. 19:00
- Behybrid Box · 8 inscrits
- Écrire au groupe…
- 2a
- Desktop · Nouveau groupe
- Pour un cours collectif ou un small group. Chaque membre voit les messages du groupe.
- Nom du groupe
- Séance collective liée
- (facultatif)
- Small group Hyrox · lun. et jeu. 19:00
- Les inscrits à cette séance sont proposés automatiquement.
- Membres
- Annuler
- 2b
- Mobile · Après tap sur +
- Rechercher un sportif
- Créer un groupe
- SPORTIFS
- 2c
- Mobile · Nouveau groupe
- Small group Hyrox · lun., jeu.

## Placeholders

- Écrire un message…

## Libellés d’accessibilité (aria-label)

- Coory
- Nouveau message
- Actions
- Joindre un fichier
- Envoyer
- Fermer
- Retour

## Chaînes de la logique (libellés dynamiques + données de démo)

- Tableau de bord
- Agenda
- Sportifs
- Programmes
- Comptabilité
- Bibliothèque
- Assistant IA
- Messages
- Tâches
- Documents
- Notifications
- Thomas Peeters
- , time: 
- , last: 
- , ini: 
- , u: 0 }
];
const MSG = {
  tp: [[
- ]]
};
const SC = { 
-  };
const GC = { y: [
- ] };
const ATH = [[
- ]];

class Component extends DCLogic {
  state = { sel: 
- , filter: 
- , draft: 
- , menu: false, extra: {}, gName: 
- , extra: Object.assign({}, s.extra, { [id]: (s.extra[id] || []).concat([[0, t, 
- ]]) }) })); }
  bubbles(list, isGroup) {
    return list.map((m, i) => { const mine = m[0] === 0, prev = list[i - 1], same = prev && prev[0] === m[0];
      return { t: m[1], time: m[2], align: mine ? 
- , bg: mine ? 
- , c: mine ? 
- , r: mine ? 
- , mt: i && !same ? 
- , sender: isGroup && !mine && !same ? m[0] : 
-  }; });
  }
  renderVals() {
    const s = this.state;
    const row = (c, mob) => { const on = !mob && c.id === s.sel, grp = !!c.g;
      return { pick: () => this.setState({ sel: c.id, menu: false }), href: grp ? 
- , isPerson: !grp, isGroup: grp, name: c.n, ini: c.ini, sx: c.sx === 
- , sxBg: c.sx === 
- , sxC: c.sx === 
- ,
        gBg: grp ? GC[c.g][0] : 
- , gC: grp ? GC[c.g][1] : 
- , time: c.time, last: c.last, unread: on ? 0 : c.u, bg: on ? 
-  }; };
    const pass = c => s.filter === 
-  || (s.filter === 
-  ? c.u : s.filter === 
-  ? c.g : !c.g);
    const list = CONV.filter(pass);
    const c = CONV.find(x => x.id === s.sel) || CONV[0], grp = !!c.g;
    const cur = Object.assign(row(c, true), { sub: grp ? 
- , cta: grp ? 
- ,
      note: grp ? 
-  });
    const nU = CONV.filter(x => x.u).length;
    const gN = Object.keys(s.gm).filter(k => s.gm[k]).length;
    return {
      nav1: NAV1, nav2: NAV2.map(n => ({ l: n[0], d: n[1], b: n[2], bg: n[0] === 
-  })),
      menuOpen: s.menu, toggleMenu: () => this.setState(p => ({ menu: !p.menu })),
      filters: [[
- ]].map(([k, l]) => { const on = s.filter === k;
        return { l, on: () => this.setState({ filter: k }), bg: on ? 
- ) { e.preventDefault(); this.send(); } }, send: () => this.send(), sendBg: s.draft.trim() ? 
- ,
      gName: s.gName, setGName: e => this.setState({ gName: e.target.value }),
      gList: ATH.map(a => { const on = !!s.gm[a[0]]; return { ini: a[1], n: a[2], s: a[3], on, mark: on ? 
- ,
        toggle: () => this.setState(p => ({ gm: Object.assign({}, p.gm, { [a[0]]: !p.gm[a[0]] }) })) }; }),
      gCount: gN + 
- ), gCta: 
