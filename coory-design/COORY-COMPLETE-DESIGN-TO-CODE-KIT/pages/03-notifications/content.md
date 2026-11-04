# 03 · Notifications — contenu (textes)

> Extraction automatique du fichier source. **Statiques** = textes du gabarit (libellés d’interface, à reprendre tels quels). **Données de démo** = valeurs du fichier `logic.js` (noms, montants, dates, listes) : elles illustrent la maquette et doivent être remplacées par les données réelles de COORY.

## Textes statiques du gabarit

- body{margin:0;background:#dcdbe3}*{box-sizing:border-box}a{color:#6a3ee0;text-decoration:none}a:hover{color:#8b5cf6}
- 1a
- Desktop · 1280 · Notifications
- GL
- Gianluca Lo Bianco
- Coach
- Notifications
- Rechercher dans Coory
- ⌘K
- Assistant IA
- Ce qui demande ton attention aujourd’hui
- Sélectionner
- Tout marquer comme lu
- Marquer comme lu
- Masquer
- Supprimer
- Annuler
- Rien à signaler.
- 1b
- Mobile · Notifications
- 9:41
- 5G ▮
- Lu

## Placeholders

- (aucun)

## Libellés d’accessibilité (aria-label)

- Coory
- Actions
- Tout marquer comme lu
- Sélectionner

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
- msg
- , tag: 
- , sec: 
- , ini: 
- , amt: 1 },
  { id: 
- , tag2: 
-  }
];
const SECS = { msg: [
- ], pay: [
- ], task: [
- ], fiche: [
- ], comp: [
- ] };
const COLS = [[
- ]];
const ORDER = [
- ];
class Component extends DCLogic {
  state = { read: {}, hidden: {}, del: {}, tab: 
- , menu: 
- , sel: null, toast: 
- , where: 
- , prev, toast: msg || 
- , where: where || 
-  }, patch)); if (msg) this.tt = setTimeout(() => this.setState({ toast: 
-  ? s.hidden[i.id] : !s.hidden[i.id] && (s.tab !== 
- , sxBg: i.sx === 
- , sxC: i.sx === 
- ,
        tag: un ? (i.sec === 
-  ? i.tag : i.tag) : (i.sec === 
-  : i.tag), tag2: i.tag2, dot: un ? 
- ,
        rf: i.amt ? "600 14px 
- ", rfM: i.amt ? "600 14px 
- ", rc: i.amt ? 
- ,
        bg: sel ? 
- , menu: s.menu === mk, mBg: s.menu === mk ? 
- ,
        onMenu: () => this.setState(p => ({ menu: p.menu === mk ? 
-  : mk })),
        readLabel: s.read[i.id] ? 
- , hideLabel: s.hidden[i.id] ? 
- ,
        onRead: () => this.act(this.setFor(
- , [i.id], !s.read[i.id])),
        onHide: () => this.act(this.setFor(
- , [i.id], !s.hidden[i.id]), s.hidden[i.id] ? 
- , where),
        onDel: () => this.act(this.setFor(
- , [i.id], true), 
- , where),
        selMode, sel: !!sel, selMark: sel ? 
- , selBg: sel ? 
- , selBd: sel ? 
- , unread || 
- , alive.filter(i => s.hidden[i.id]).length || 
- ]].map(([k, l, n]) => { const on = s.tab === k;
      return { l, n, on: () => this.setState({ tab: k, menu: 
- , mbg: on ? 
-  }; });
    const n = selIds.length;
    return {
      nav1: NAV1, nav2: NAV2.map(x => ({ l: x[0], d: x[1], b: x[0] === 
-  ? unread : x[0] === 
-  })),
      unread, headline: unread ? unread + 
-  + (unread > 1 ? 
- , tabs,
      raBg: unread ? 
- , raC: unread ? 
- , raMC: unread ? 
- ,
      readAll: () => unread && this.act(this.setFor(
- , alive.map(i => i.id), true), 
- ),
      notSel: !selMode, selMode, startSel: () => this.setState({ sel: {}, menu: 
-  }), endSel: () => this.setState({ sel: null }),
      selLabel: n ? n + 
- ,
      allSelMark: allSel ? 
- , allSelBg: n ? 
- , allSelBd: n ? 
- ,
      toggleAllSel: () => this.setState({ sel: allSel ? {} : Object.fromEntries(shown.map(i => [i.id, true])) }),
      selRead: () => n && this.act(Object.assign(this.setFor(
- , selIds, true), { sel: null })),
      selHide: () => n && this.act(Object.assign(this.setFor(
- , selIds, true), { sel: null }), n + 
- )),
      selDel: () => n && this.act(Object.assign(this.setFor(
- )),
      cols: COLS.map(c => ({ secs: c.map(k => sec(k, 
- )).filter(x => s.tab === 
-  || x.has) })),
      secsM: ORDER.map(k => sec(k, 
- )).filter(x => x.has || (s.tab === 
-  && x.empty)).sort((a, b) => a.empty - b.empty),
      toast: s.toast && s.where === 
-  ? s.toast : 
- , toastM: !!s.toast && s.where === 
-  && !selMode, toastTxt: s.toast,
      undo: () => { clearTimeout(this.tt); this.setState(Object.assign({ toast: 
