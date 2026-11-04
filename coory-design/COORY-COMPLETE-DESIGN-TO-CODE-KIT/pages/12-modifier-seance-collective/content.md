# 12 · Modifier la séance (individuelle + collective) — contenu (textes)

> Extraction automatique du fichier source. **Statiques** = textes du gabarit (libellés d’interface, à reprendre tels quels). **Données de démo** = valeurs du fichier `logic.js` (noms, montants, dates, listes) : elles illustrent la maquette et doivent être remplacées par les données réelles de COORY.

## Textes statiques du gabarit

- body{margin:0;background:#dcdbe3}*{box-sizing:border-box}a{color:#6a3ee0;text-decoration:none}a:hover{color:#8b5cf6}input::placeholder{color:#8b8996}
- Type de séance
- 12a
- Desktop · 1280 · Modifier la séance
- GL
- Gianluca Lo Bianco
- Coach
- Agenda · Coaching force
- Modifier la séance
- Rechercher dans Coory
- ⌘K
- Assistant IA
- 9
- Informations
- Titre, discipline et lieu de la séance.
- Titre
- Discipline
- facultatif
- Lieu
- Date et récurrence
- Première séance
- Heure
- Durée
- min
- Répéter chaque semaine
- Le même jour et à la même heure
- Jusqu’au
- dim. 17 janv. 2027
- Sans date de fin, la séance continue chaque semaine.
- Sportifs inscrits
- Tout désélectionner
- Rechercher un sportif
- Prix
- €
- Paiement
- TVA comprise dans le prix
- Note du coach
- Ex. : prévoir chronos et plots
- YK
- Yanis Khelifi
- Voir la fiche
- Enregistrer
- Annuler
- Pour changer de type ou de sportif, supprime la séance et crée-en une nouvelle.
- Supprimer la séance
- 12b
- Mobile · Modifier la séance
- 9:41
- 5G ▮
- Même jour, même heure

## Placeholders

- (aucun)

## Libellés d’accessibilité (aria-label)

- Coory
- Retour
- Supprimer

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
- Antoine Maes
- Camille Renard
- Chloé Martin
- Emma Laurent
- Inès Benali
- Julie Willems
- Julien Dubois
- Laura Claes
- Léa Vandenberghe
- Lucas Janssens
- Manon
- Maxime Leroy
- Mehdi Ouali
- Nadia El Amrani
- Sophie Lambert
- Thomas Peeters
- Yanis Khelifi
- SÉANCE INDIVIDUELLE
- Coaching force
- Musculation
- Salle de sport
- lun. 7 sept. 2026
- Prix de la séance
- Séance individuelle
- SÉANCE COLLECTIVE
- Circuit Hyrox du samedi
- Hyrox
- Box Hyrox
- sam. 5 sept. 2026
- Prix pour toute la séance
- , who: 
- , whoS: 
-  } };
const eur = n => n.toLocaleString(
- , { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + 
- ;
class Component extends DCLogic {
  state = { kind: 
- , title: KIND.coll.title, rec: true, pay: 
- , tva: true, price: 
- , ins: { 
- : 1 } };
  renderVals() {
    const s = this.state, p = parseFloat(String(s.price).replace(
- )) || 0;
    const ht = s.tva ? p / 1.21 : p, ttc = s.tva ? p : p * 1.21;
    const K = Object.assign({}, KIND[s.kind], { ind: s.kind === 
- , coll: s.kind === 
-  }); const sel = ATH.filter(a => s.ins[a]); const nIns = sel.length + 
-  + (sel.length > 1 ? 
- ); if (K.coll) K.whoS = nIns;
    const priceLine = p && K.coll && sel.length ? eur(ttc) + 
-  + eur(ttc / sel.length) + 
-  : p ? eur(ht) + 
-  + eur(ttc) + 
-  : (K.coll ? 
-  }; }),
      insAv: sel.slice(0, 6).map((a, i) => ({ i: a.split(
- ).map(w => w[0]).join(
- ).slice(0, 2), bg: AVC[i % 5] })),
      kinds: [[
- ]].map(([key, l]) => ({ l, on: () => this.setState({ kind: key, title: KIND[key].title, price: KIND[key].price, tva: key === 
-  }), bg: s.kind === key ? 
- , c: s.kind === key ? 
-  })),
      nav1: NAV1.map(n => ({ l: n[0], d: n[1], bg: n[0] === 
- , swBg: s.rec ? 
- , swJ: s.rec ? 
- ,
      pays: [
- ].map(l => { const on = s.pay === l; return { l, on: () => this.setState({ pay: l }), bg: on ? 
-  }; }),
      tva: s.tva, toggleTva: () => this.setState(x => ({ tva: !x.tva })), tvaBg: s.tva ? 
- , tvaBd: s.tva ? 
- , tvaMark: s.tva ? 
- ,
      price: s.price, setPrice: e => this.setState({ price: e.target.value }), priceLine,
      recap: [{ k: 
- , v: (s.rec ? 
- ) + K.date.split(
- )[0].replace(
-  + K.hour }, { k: 
- , v: K.dur + 
- , v: s.rec ? 
- , v: p ? eur(ttc) + 
