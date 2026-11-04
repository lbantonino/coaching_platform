# 04 · Comptabilité — contenu (textes)

> Extraction automatique du fichier source. **Statiques** = textes du gabarit (libellés d’interface, à reprendre tels quels). **Données de démo** = valeurs du fichier `logic.js` (noms, montants, dates, listes) : elles illustrent la maquette et doivent être remplacées par les données réelles de COORY.

## Textes statiques du gabarit

- body{margin:0;background:#dcdbe3}*{box-sizing:border-box}a{color:#6a3ee0;text-decoration:none}a:hover{color:#8b5cf6}
- 1a
- Desktop · 1280
- GL
- Gianluca Lo Bianco
- Coach
- Comptabilité
- Rechercher dans Coory
- ⌘K
- Assistant IA
- 9
- Nouvelle dépense
- Nouveau paiement
- Résultat · {{ cur.label }}
- Gagné HTVA − dépensé HTVA
- Gagné et dépensé
- Gagné
- Dépensé
- Reçu par mode de paiement
- Total reçu
- Mouvements
- Tableau de comptabilité
- PÉRIODE
- VIREMENT
- BANCONTACT
- ESPÈCES
- GAGNÉ HTVA
- DÉPENSÉ HTVA
- RÉSULTAT
- Total
- Aperçu de ton activité, pas une comptabilité officielle : tes factures et tes déclarations se font avec ton logiciel de facturation ou ton comptable.
- 1b
- Mobile · 390
- Touche le « + » pour ajouter un paiement ou une dépense
- 16
- Virement {{ r.v }} · Bancontact {{ r.b }} · Espèces {{ r.e }}

## Placeholders

- (aucun)

## Libellés d’accessibilité (aria-label)

- Coory
- Période
- {{ b.aria }}
- Type de graphique
- {{ c.l }}
- Actions
- {{ fabLabel }}

## Chaînes de la logique (libellés dynamiques + données de démo)

- pie
- month
- pay
- ); const v = a[0].replace(/\B(?=(\d{3})+(?!\d))/g, 
- ; return (sign && n > 0 ? 
- ) + v; };
    const dash = n => n ? eur(n) : 
- ;
    const M = MONTHS, cm = M[s.month];
    const week = { label: 
- , v: 1657.30, b: 1500, e: 100 };
    const year = M.reduce((a, m) => ({ g: a.g + m.g, d: a.d + m.d, v: a.v + m.v, b: a.b + m.b, e: a.e + m.e }), { g: 0, d: 0, v: 0, b: 0, e: 0 });
    const P = s.period === 
-  ? Object.assign({}, week, { s1: 
-  }) : s.period === 
-  ? Object.assign({ label: 
-  }, year) : { label: cm.full, g: cm.g, d: cm.d, s1: cm.s1, s2: cm.s2, t1: cm.t1, t2: cm.t2, v: cm.v, b: cm.b, e: cm.e };
    const res = P.g - P.d;
    const tot = P.v + P.b + P.e;
    const modes = [[
- ]];
    const PAY = PAYMENTS.filter(p => s.filter === 
-  || (s.filter === 
- ));
    const lists = { pay: PAY.map(p => ({ d: p.d, n: p.n, s: p.m + 
-  + p.s, v: eur(p.v), vc: 
-  })), dep: DEPENSES.map(p => ({ d: p.d, n: p.n, s: p.s, v: eur(-p.v), vc: 
-  })), due: DUE.map(p => ({ d: p.d, n: p.n, s: p.s, v: eur(p.v), vc: 
-  })) };
    const LIMIT = 5, all = lists[s.tab], total = s.tab === 
-  ? (s.filter === 
- ).map(([l, d]) => ({ l, d, bg: l === 
-  })),
      nav2: N2.map(([l, d, b]) => ({ l, d, b: b || 
-  })),
      periods: [[
- ]].map(([k, l]) => { const on = s.period === k; return { l, sel: on ? 
- , pick: () => this.setState({ period: k }), bg: on ? 
- , bgM: on ? 
- , shM: 
-  }; }),
      cur: { label: P.label, res: eur(res, true), resC: res >= 0 ? 
-  },
      heroStats: [[
- , week.g, 
-  + eur(week.g, true), 
- ]].map(k => ({ l: k[0], v: eur(k[1]), s1: k[2], s2: k[3], c: k[4], mspan: k[5] })),
      cs: { label: P.label, items: [[
- , eur(P.g), 
- , eur(P.d), 
- , eur(res, true), res >= 0 ? 
- ]].map(([l, v, vc]) => ({ l, v, vc })) },
      yTicks: [0, 0.5, 1].map(f => ({ b: (f * 100) + 
- , l: f ? (f * nice / 1000).toString().replace(
- , line: f ? 
-  })),
      bars: M.map((m, i) => { const on = s.period === 
-  && s.month === i; return { m: m.s, ms: m.s.slice(0, 1).toUpperCase(), aria: m.full, sel: on ? 
- , g: (m.g / nice * 100) + 
- , d: (m.d / nice * 100) + 
- , gc: on || s.period !== 
- , dc: on || s.period !== 
- , pick: () => this.setState({ month: i, period: 
-  }) }; }),
      isBar: s.chart === 
- , isPie: s.chart === 
- ,
      chartTypes: [[
- ]].map(([k, l, d]) => { const on = s.chart === k; return { l, d, sel: on ? 
- , pick: () => this.setState({ chart: k }), bg: on ? 
-  }; }),
      rep: { sub: P.label + 
-  + C, off: String(-acc) }); acc += len; }); return out; })(), rows: modes.map(([l, v, c]) => ({ l, c, w: tot ? (v / tot * 100) + 
- , p: tot ? Math.round(v / tot * 100) + 
- , v: eur(v), vc: v ? 
-  })) },
      mvTabs: [[
- ]].map(([k, l]) => { const on = s.tab === k; return { l, sel: on ? 
- , pick: () => this.setState({ tab: k, showAll: false }), bg: on ? 
-  }; }),
      mvFilters: [[
- ]].map(([k, l]) => { const on = s.filter === k; return { l, sel: on ? 
- , pick: () => this.setState({ filter: k, showAll: false }), bg: on ? 
-  }; }),
      mv: { sub: s.tab === 
-  : s.tab === 
-  ? DEPENSES.length + 
-  : DUE.length + 
- , hasFilters: s.tab === 
- , rows, more: all.length > LIMIT, moreL: s.showAll ? 
-  + total + 
-  + (s.tab === 
- ), rot: s.showAll ? 
-  },
      toggleAll: () => this.setState({ showAll: !s.showAll }),
      tableOpen: s.table, tableExp: s.table ? 
- , tableBtn: s.table ? 
- , tableRot: s.table ? 
- ,
      tableSub: 
- , toggleTable: () => this.setState({ table: !s.table }),
      tRows: shown.map(m => ({ m: m.full, v: dash(m.v), b: dash(m.b), e: dash(m.e), g: dash(m.g), d: dash(m.d), r: (m.g || m.d) ? eur(m.g - m.d, true) : 
- ), bg: s.period === 
-  && m.i === s.month ? 
-  })),
      emptyHidden: true, emptyL: s.empty ? 
-  + (M.length - nonEmpty.length) + 
- , fabRot: s.sheet ? 
- , fabLabel: s.sheet ? 
- ,
      toggleSheet: () => this.setState({ sheet: !s.sheet }), closeSheet: () => this.setState({ sheet: false }),
      sheetItems: [[
- ]].map(x => ({ l: x[0], s: x[1], d: x[2], bg: x[3], c: x[4] }))
    };
  }
}
const N1 = [[
- ]];
const N2 = [[
- ]];

const MONTHS = [
- ].map(x => { const [s, full] = x.split(
- ); return { s, full, g: 0, d: 0, v: 0, b: 0, e: 0, s1: 
-  }; });
Object.assign(MONTHS[8], { d: 500, t1: 
-  });
Object.assign(MONTHS[9], { g: 3021.16, d: 740, v: 3460.60, e: 195, s1: 
-  });
Object.assign(MONTHS[10], { g: 3175.17, d: 606.61, v: 3581.95, e: 260, s1: 
-  });
Object.assign(MONTHS[11], { g: 2691.98, d: 500, v: 1657.30, b: 1500, e: 100, s1: 
-  });
const PAYMENTS = [
  { d: 
- , v: 78.65 }
];
const DEPENSES = [
  { d: 
- , v: 121 }
];
const DUE = [
  { d: 
