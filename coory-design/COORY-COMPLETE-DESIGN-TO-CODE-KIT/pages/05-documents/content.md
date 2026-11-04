# 05 · Documents — contenu (textes)

> Extraction automatique du fichier source. **Statiques** = textes du gabarit (libellés d’interface, à reprendre tels quels). **Données de démo** = valeurs du fichier `logic.js` (noms, montants, dates, listes) : elles illustrent la maquette et doivent être remplacées par les données réelles de COORY.

## Textes statiques du gabarit

- body{margin:0;background:#dcdbe3}*{box-sizing:border-box}a{color:#6a3ee0;text-decoration:none}a:hover{color:#8b5cf6}input::placeholder{color:#8b8996}
- 1a
- Desktop · 1280 · Documents
- GL
- Gianluca Lo Bianco
- Coach
- Documents
- Rechercher dans Coory
- ⌘K
- Assistant IA
- 9
- Importer un fichier
- Tous les documents
- Tous les sportifs
- Catégorie
- Gérer les catégories
- Nom
- Sportif
- Taille
- Ajouté le
- Aucun document
- Change de filtre ou importe un fichier.
- PDF, images et documents Office · 10 Mo maximum par fichier
- 1b
- Mobile · Documents
- 9:41
- 5G ▮
- Gérer
- Aucun document pour ce filtre.

## Placeholders

- Rechercher un document, un sportif…
- Rechercher

## Libellés d’accessibilité (aria-label)

- Coory
- Actions
- Filtrer par sportif
- Importer un fichier

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
- Facture FAC-2026-014
- PDF
- Facture
- Lucas Janssens
- Programme Hyrox, bloc 1
- Programme
- Inès Benali
- Bilan de rentrée
- Bilan
- Thomas Peeters
- Contrat de coaching 2026
- Contrat
- Sophie Lambert
- Test VMA, résultats
- XLSX
- Facture FAC-2026-013
- Nadia El Amrani
- Plan nutrition prépa marathon
- Photo posture squat
- JPG
- Autre
- Contrat small group Hyrox
- , ini: 
- , size: 
- , date: 
- , ext: 
- , cat: 
- , ath: 
-  }
];
class Component extends DCLogic {
  state = { cat: 
- , quick: 
-  };
  renderVals() {
    const s = this.state, q = s.q.trim().toLowerCase();
    const base = DOCS.filter(d => (!q || (d.n + 
-  + d.ath).toLowerCase().includes(q)) && (s.quick !== 
-  || d.m) && (s.quick !== 
-  || d.ini) && (s.quick !== 
-  || !d.ini));
    const sk = s.sk || 
- ;
    const list = base.filter(d => s.cat === 
-  || d.cat === s.cat).slice().sort((a, b) => { const r = sk === 
-  ? a.cat.localeCompare(b.cat) || DOCS.indexOf(a) - DOCS.indexOf(b) : DOCS.indexOf(b) - DOCS.indexOf(a); return sd === 
-  ? r : -r; });
    const sorter = k => { const on = sk === k; return { c: on ? 
- ,
      on: () => this.setState(p => (p.sk || 
-  }) }; };
    const chip = (on) => ({ bg: on ? 
-  });
    const cats = [
- ].concat(Object.keys(CAT)).map(k => ({ l: k === 
-  ? base.length : base.filter(d => d.cat === k).length, dot: k === 
-  : CAT[k][1], mark: s.cat === k ? 
- , bg: s.cat === k ? 
- , on: () => this.setState({ cat: k, open: 
-  }) }));
    const quick = [[
- ]].map(([k, l]) => Object.assign({ l, on: () => this.setState(p => ({ quick: p.quick === k ? 
-  : k })) }, chip(s.quick === k)));
    const nav2 = NAV2.map(n => ({ l: n[0], d: n[1], b: n[2], bg: n[0] === 
-  }));
    return {
      nav1: NAV1, nav2, cats, sortCat: sorter(
- ), sortDate: sorter(
- ), catLabel: s.cat === 
-  : s.cat, catDot: s.cat === 
-  : CAT[s.cat][1],
      menuD: s.open === 
- , menuM: s.open === 
- , openD: () => this.setState(p => ({ open: p.open === 
-  })), openM: () => this.setState(p => ({ open: p.open === 
-  })), q: s.q, setQ: e => this.setState({ q: e.target.value }),
      summary: list.length + 
-  + (list.length > 1 ? 
- ,
      empty: list.length === 0,
      hasMore: list.length > 7, moreLabel: s.all ? 
-  + (list.length - 7) + 
- , moreRot: s.all ? 
- ,
      toggleMore: () => this.setState(p => ({ all: !p.all })),
      docs: (s.all ? list : list.slice(0, 7)).map(d => ({ n: d.n, ext: d.ext + 
-  + d.size, cat: d.cat, tbg: CAT[d.cat][0], tc: CAT[d.cat][1], ath: d.ath || 
- , ini: d.ini, ac: d.ini ? 
- , size: d.size, date: d.date, mob: d.cat + 
-  + (d.ath || 
