# 10 · Nouveau sportif — contenu (textes)

> Extraction automatique du fichier source. **Statiques** = textes du gabarit (libellés d’interface, à reprendre tels quels). **Données de démo** = valeurs du fichier `logic.js` (noms, montants, dates, listes) : elles illustrent la maquette et doivent être remplacées par les données réelles de COORY.

## Textes statiques du gabarit

- body{margin:0;background:#dcdbe3}*{box-sizing:border-box}a{color:#6a3ee0;text-decoration:none}a:hover{color:#8b5cf6}input::placeholder,textarea::placeholder{color:#8b8996}
- 10a
- Desktop · 1280
- GL
- Gianluca Lo Bianco
- Coach
- Sportifs
- Nouveau sportif
- Rechercher dans Coory
- Assistant IA
- Le sportif m’a donné son accord explicite pour noter ses blessures et points d’attention.
- Ex. : douleur genou droit en descente
- Données de santé
- Les blessures ne se notent qu’avec l’accord explicite du sportif. Il peut le retirer à tout moment : ce qui a été noté est alors effacé.
- Enregistrer le sportif
- Seul le prénom est obligatoire.
- 10b
- Mobile
- 9:41
- 5G ▮
- Accord explicite du sportif

## Placeholders

- (aucun)

## Libellés d’accessibilité (aria-label)

- Coory
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
- input
-  }, o || {});
const SECS = [
  [
- , { opt: 
- , caret: 1, ph: 1 })]],
  [
- , help: 
- , { caret: 1, ph: 1 })]],
  [
- , { caret: 1, ph: 1 }), I(
- , { caret: 1, ph: 1 }), { k: 
- , full: 1 }, { k: 
- ], full: 1 }, { k: 
- ], full: 1 }]],
  [
- , caret: 1, ph: 1 }), I(
- , ph: 1, full: 1, help: 
- , full: 1 }]],
  [
- , full: 1, help: 
- , opt: 
-  }]]
];
class Component extends DCLogic {
  state = { lieux: { 
- : 1 }, jours: {}, statut: 
-  ? s.statut === o : !!(s[f.id] || {})[o];
      return { l: f.l, opt: f.opt || 
- , caret: !!f.caret, help: f.help || 
- , span: f.full ? 
- ,
        isInput: f.k === 
- , isArea: f.k === 
- , isChips: f.k === 
- , isSeg: f.k === 
- , isConsent: f.k === 
- ,
        opts: (f.o || []).map(o => ({ l: o, on: f.k === 
-  ? () => this.setState({ statut: o }) : tog(f.id, o), mark: on(o) ? 
- , sbg: on(o) ? 
- , ssh: on(o) ? 
-  })) };
    }) }));
    return {
      sections, toc: SECS.map(([t], i) => ({ n: i + 1, t, bg: i === 0 ? 
-  })),
      consent: s.consent, consentAria: s.consent ? 
- , consentJ: s.consent ? 
- , consentBg: s.consent ? 
- , toggleConsent: () => this.setState({ consent: !s.consent }),
      nav1: NAV1.map(n => ({ l: n[0], d: n[1], bg: n[0] === 
