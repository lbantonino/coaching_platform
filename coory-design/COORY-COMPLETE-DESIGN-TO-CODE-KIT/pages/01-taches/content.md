# 01 · Tâches — contenu (textes)

> Extraction automatique du fichier source. **Statiques** = textes du gabarit (libellés d’interface, à reprendre tels quels). **Données de démo** = valeurs du fichier `logic.js` (noms, montants, dates, listes) : elles illustrent la maquette et doivent être remplacées par les données réelles de COORY.

## Textes statiques du gabarit

- body{margin:0;background:#dcdbe3}*{box-sizing:border-box}a{color:#6a3ee0;text-decoration:none}a:hover{color:#8b5cf6}input::placeholder{color:#8b8996}
- NOTE
- À reporter dans le brief Claude Code
- NOUVELLE FONCTIONNALITÉ
- Ce ne sont pas des changements de design : Claude Code doit les
- . Elles demandent un modèle de données (listes : nom, couleur, ordre ; chaque tâche liée à une liste), la création, le renommage et la suppression d'une liste, et le filtrage des vues automatiques.
- Ces fonctionnalités n'existent pas encore dans l'app.
- développer en plus
- Le coach range ses tâches dans des listes (Programmes, Facturation, Fiches sportifs, Bibliothèque…) et peut en créer d'autres avec « Nouvelle liste ». Quatre vues automatiques regroupent toutes les listes : Aujourd'hui, À venir, Toutes, Terminées. Dans ces vues, chaque tâche affiche le nom de sa liste.
- Listes de tâches, comme Rappels et Google Tasks.
- Le coach n'est pas obligé d'appuyer sur « + ». Toucher la zone vide sous la liste crée directement une tâche dans la liste ouverte :
- Création rapide, comme Rappels.
- une ligne vide apparaît à la fin, curseur prêt ; sur mobile, le clavier s'ouvre ;
- enregistre et ouvre une nouvelle ligne ;
- Entrée
- quitter le champ enregistre ; un champ vide est annulé ;
- le « + » (mobile) et « Nouvelle tâche » (desktop) font la même chose.
- Essaie sur les maquettes : choisis une liste, puis touche la zone vide sous les tâches.
- 1a
- Desktop · 1280
- GL
- Gianluca Lo Bianco
- Coach
- Tâches
- Rechercher dans Coory
- ⌘K
- Assistant IA
- 9
- Nouvelle tâche
- MES LISTES
- Nouvelle liste
- Haute
- 1b
- Mobile · 390 · listes
- Mes listes
- 1c
- Mobile · 390 · liste ouverte
- Listes

## Placeholders

- Nom de la liste
- Nouvelle tâche

## Libellés d’accessibilité (aria-label)

- Coory
- Nom de la liste
- Marquer comme terminée
- Nouvelle tâche
- Listes

## Chaînes de la logique (libellés dynamiques + données de démo)

- prog
- , draft: 
- , extra: [], lists: LISTS, newList: 
- , listDraft: 
-  ? this.inM : this.inD).current; if (el) el.focus(); }, 30);
    if (s.newList && s.newList !== ps.newList) setTimeout(() => { const el = (s.newList === 
- ], next: [
- ], all: [
- ], done: [
- ] };
    const match = (t, sel) => sel === 
-  ? t.done : !t.done && (sel === 
-  || (sel === 
-  && t.when === 
- ) || (sel === 
-  && t.when !== 
- ] }[sel] : [
- ];
      return { title: isSmart ? SM[sel][0] : (L[sel] ? L[sel].l : 
- ), tc: isSmart ? 
-  : (L[sel] ? L[sel].tc : 
- ), count: vis.length + (vis.length > 1 ? 
- ),
        isEmpty: vis.length === 0 && s.add !== mode, emptyT: E[0], emptyS: E[1],
        rows: vis.map(t => { const l = L[t.list]; return { title: t.title, who: t.who || 
- , ini: t.ini || 
- , hasWho: !!t.who, due: t.due || 
- , hasDue: !!t.due, high: !!t.high && !t.done, dc: t.when === 
-  && !t.done ? 
- , showList: isSmart && !!l, ln: l ? l.l : 
- , ck: t.done ? 
- , ring: t.done ? 
- , fill: t.done ? 
- , op: t.done ? 1 : 0, tc: t.done ? 
- , dec: t.done ? 
- , toggle: () => this.setState(p => ({ done: Object.assign({}, p.done, { [t.i]: !p.done[t.i] }) })) }; }) };
    };
    const sel = s.add === 
-  ? s.selM : s.selD;
    const mk = v => { const isSmart = !!SM[sel]; return { title: v, list: isSmart ? (sel === 
-  || sel === 
-  ? s.lists[0].k : s.lists[0].k) : sel, when: sel === 
- , due: sel === 
-  }; };
    const commit = () => { const v = s.draft.trim(); this.setState(p => ({ extra: v ? p.extra.concat([mk(v)]) : p.extra, draft: 
- , add: 
-  })); };
    const smartTiles = (cur, set) => [
- ].map(k => { const on = cur === k; return { l: SM[k][0], c: SM[k][1], d: SM[k][2], n: cnt(k), sel: on ? 
- , pick: set(k), bg: on ? 
-  }; });
    const COLORS = [
- ];
    const nextColor = COLORS[s.lists.length % COLORS.length];
    const commitList = () => { const v = s.listDraft.trim(); if (v) { const k = 
-  + Date.now(); const c = nextColor; this.setState(p => ({ lists: p.lists.concat([{ k, l: v, c, tc: c === 
-  : c }]), listDraft: 
- , newList: 
- , selD: p.newList === 
-  ? k : p.selD, selM: p.newList === 
-  ? k : p.selM })); } else this.setState({ newList: 
-  }); };
    return {
      nav1: N1.map(([l, d]) => ({ l, d, bg: 
-  })),
      nav2: N2.map(([l, d, b]) => ({ l, d, b: b || 
-  })),
      smartD: smartTiles(s.selD, k => () => this.setState({ selD: k, add: 
-  })),
      smartM: smartTiles(null, k => () => { this.setState({ selM: k, add: 
-  }); location.hash = 
- ; }),
      listsD: s.lists.map(l => { const on = s.selD === l.k; return { l: l.l, c: l.c, n: cnt(l.k), sel: on ? 
- , line: 
- , pick: () => this.setState({ selD: l.k, add: 
-  }) }; }),
      listsM: s.lists.map((l, i) => ({ l: l.l, c: l.c, n: cnt(l.k), sel: 
- , line: i ? 
- , pick: () => { this.setState({ selM: l.k, add: 
- ; } })),
      chipsM: [
- ].map(k => ({ k, l: SM[k][0], c: SM[k][1] })).concat(s.lists.map(l => ({ k: l.k, l: l.l, c: l.c }))).map(c => { const on = s.selM === c.k; return { l: c.l, c: on ? 
-  : c.c, sel: on ? 
- , pick: () => this.setState({ selM: c.k, add: 
-  }) }; }),
      vD: view(s.selD, 
- ), vM: view(s.selM, 
- ),
      addD: s.add === 
- , addM: s.add === 
- , ghostD: s.add !== 
-  && s.selD !== 
- , draft: s.draft, inD: this.inD, inM: this.inM,
      tapD: () => { if (s.add !== 
- ) this.setState({ add: 
- , selD: s.selD === 
-  : s.selD }); },
      tapM: () => { if (s.add !== 
- , selM: s.selM === 
-  : s.selM }); },
      fabHome: () => { this.setState({ add: 
- , selM: s.lists[0].k }); location.hash = 
- ; },
      setDraft: e => this.setState({ draft: e.target.value }),
      onKey: e => { if (e.key === 
- ) { const v = s.draft.trim(); if (v) this.setState(p => ({ extra: p.extra.concat([mk(v)]), draft: 
-  })); } else if (e.key === 
-  }); },
      commit,
      newListOn: !!s.newList, nextColor, listDraft: s.listDraft, inLD: this.inLD, inLM: this.inLM,
      newListD: () => this.setState({ newList: 
-  }), newListM: () => this.setState({ newList: 
-  }),
      setListDraft: e => this.setState({ listDraft: e.target.value }),
      onListKey: e => { if (e.key === 
- ) commitList(); else if (e.key === 
- ) this.setState({ newList: 
-  }); },
      commitList
    };
  }
}
const N1 = [[
- ]];
const N2 = [[
- ]];

const LISTS = [
  { k: 
-  }
];
const TASKS = [
  { list: 
- , title: 
- , who: 
- , ini: 
- , due: 
- , when: 
- , high: true },
  { list: 
-  },
  { list: 
