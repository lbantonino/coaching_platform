# 06 · Modifier la séance (individuelle) — contenu (textes)

> Extraction automatique du fichier source. **Statiques** = textes du gabarit (libellés d’interface, à reprendre tels quels). **Données de démo** = valeurs du fichier `logic.js` (noms, montants, dates, listes) : elles illustrent la maquette et doivent être remplacées par les données réelles de COORY.

## Textes statiques du gabarit

- body{margin:0;background:#dcdbe3}*{box-sizing:border-box}a{color:#6a3ee0;text-decoration:none}a:hover{color:#8b5cf6}input::placeholder{color:#8b8996}
- 1a
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
- Musculation
- Lieu
- Salle de sport
- Date et récurrence
- Première séance
- jeu. 10 sept. 2026
- Heure
- 07:00
- Durée
- 60
- min
- Répéter chaque semaine
- Le même jour et à la même heure
- Jusqu’au
- dim. 17 janv. 2027
- Sans date de fin, la séance continue chaque semaine.
- Prix
- Prix de la séance
- €
- Paiement
- TVA comprise dans le prix
- SÉANCE INDIVIDUELLE
- NA
- ♀
- Nadia El Amrani
- Voir la fiche
- Enregistrer
- Annuler
- Pour changer de type ou de sportif, supprime la séance et crée-en une nouvelle.
- Supprimer la séance
- 1b
- Mobile · Modifier la séance
- 9:41
- 5G ▮
- Coaching force
- Séance individuelle
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
- Coaching force
- Virement
- )) || 0;
    const ht = s.tva ? p / 1.21 : p, ttc = s.tva ? p : p * 1.21;
    const priceLine = p ? eur(ht) + 
-  + eur(ttc) + 
- ;
    return {
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
- , v: s.rec ? 
- , v: p ? eur(ttc) + 
