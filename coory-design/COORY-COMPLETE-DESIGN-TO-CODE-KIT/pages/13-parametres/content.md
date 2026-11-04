# 13 · Paramètres — contenu (textes)

> Extraction automatique du fichier source. **Statiques** = textes du gabarit (libellés d’interface, à reprendre tels quels). **Données de démo** = valeurs du fichier `logic.js` (noms, montants, dates, listes) : elles illustrent la maquette et doivent être remplacées par les données réelles de COORY.

## Textes statiques du gabarit

- body{margin:0;background:#dcdbe3}*{box-sizing:border-box}a{color:#6a3ee0;text-decoration:none}a:hover{color:#8b5cf6}
- Rubrique affichée
- 13a
- Desktop · 1280 · {{ cur.l }}
- Paramètres
- Les changements s’appliquent dès l’enregistrement.
- Annuler
- Enregistrer
- 13b
- Mobile · {{ cur.l }}
- 9:41
- 5G ▮

## Placeholders

- (aucun)

## Libellés d’accessibilité (aria-label)

- Paramètres
- Fermer

## Chaînes de la logique (libellés dynamiques + données de démo)

- profil
- Profil
- Nom, photo
- Ton nom et ta photo
- pref
- Préférences
- Thème, agenda, alertes
- Thème, valeurs par défaut, agenda, notifications
- tva
- Pays, devise et TVA
- Belgique · EUR · 21 %
- Ta devise et ton taux de TVA
- secu
- Sécurité
- E-mail, mot de passe
- E-mail, mot de passe, appareils
- data
- Données
- Exporter
- Exporter toutes tes données
-  }, o || {});
const NOTIF = [[
- ]];
class Component extends DCLogic {
  state = { mOpen: false, tab: 
- , theme: 
- , pay: 
- , tvaOn: true, notif: [1, 1, 1, 1, 1] };
  seg(opts, cur, set, l) { return { isSeg: true, l: l || 
- , opts: opts.map(o => ({ l: o, on: () => set(o), bg: cur === o ? 
- , c: cur === o ? 
- , sh: cur === o ? 
-  })) }; }
  fields(cols, fs) { return { isFields: true, cols, fields: fs.map(f => Object.assign({ opt: 
- , suf: 
- , help: 
- , caret: false, box: !f.plain, vc: f.ph ? 
-  }, f)) }; }
  btns(bs) { return { isBtns: true, btns: bs.map(([l, k]) => ({ l, bg: k === 
-  })) }; }
  renderVals() {
    const s = this.state;
    const tgl = (rows, arr, set) => ({ isToggles: true, rows: rows.map(([l, d], i) => ({ l, d, aria: arr[i] ? 
- , on: () => set(i), bg: arr[i] ? 
- , j: arr[i] ? 
-  })) });
    const C = {
      profil: [{ t: 
- , items: [this.fields(
- )])] }],
      pref: [
        { t: 
- , items: [this.seg([
- ], s.theme, v => this.setState({ theme: v }))] },
        { t: 
- , { suf: 
- , { opt: 
- , ph: 1, suf: 
-  })]), this.seg([
- ], s.pay, v => this.setState({ pay: v }), 
- , { caret: 1 }), F(
- , { caret: 1 })])] },
        { t: 
- , items: [tgl(NOTIF, s.notif, i => this.setState(x => { const n = x.notif.slice(); n[i] = n[i] ? 0 : 1; return { notif: n }; }))] }
      ],
      tva: [
        { t: 
- , { caret: 1, help: 
- , { plain: 1, help: 
-  })]), this.btns([[
- , items: [tgl([[
- ]], [s.tvaOn], () => this.setState(x => ({ tvaOn: !x.tvaOn })))].concat(s.tvaOn ? [this.fields(
-  })])] : []) }
      ],
      secu: [
        { t: 
- , { help: 
- , { plain: 1 }), F(
- )]), this.btns([[
- , items: [this.btns([[
- ]])] }
      ],
      data: [{ t: 
- ]]), { isNote: true, l: 
- , ibg: on ? 
- , sbg: on ? 
- , mbg: on ? 
-  }; }),
      mOpen: s.mOpen, mAria: s.mOpen ? 
- , mRot: s.mOpen ? 
- , toggleM: () => this.setState({ mOpen: !s.mOpen }),
      cur: { l: t[1], sub: t[3], s: t[2], d: t[4], save: s.tab === 
-  || s.tab === 
