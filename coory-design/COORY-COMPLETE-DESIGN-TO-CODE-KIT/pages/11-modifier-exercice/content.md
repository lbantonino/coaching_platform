# 11 · Modifier l’exercice — contenu (textes)

> Extraction automatique du fichier source. **Statiques** = textes du gabarit (libellés d’interface, à reprendre tels quels). **Données de démo** = valeurs du fichier `logic.js` (noms, montants, dates, listes) : elles illustrent la maquette et doivent être remplacées par les données réelles de COORY.

## Textes statiques du gabarit

- body{margin:0;background:#dcdbe3}*{box-sizing:border-box}a{color:#6a3ee0;text-decoration:none}a:hover{color:#8b5cf6}input::placeholder,textarea::placeholder{color:#8b8996}
- 11a
- Desktop · 1280 · {{ title }}
- GL
- Gianluca Lo Bianco
- Coach
- Rechercher dans Coory
- Assistant IA
- Variante de
- . L’exercice d’origine reste inchangé.
- « Sled push »
- Voir l’original
- Nom de l’exercice
- Rubrique
- Groupes musculaires
- Matériel
- Consignes
- Une consigne par ligne, 15 au maximum. Facultatif.
- Photo
- facultatif
- Glisse une photo ici ou parcours
- JPEG, PNG ou WebP · stockée en privé
- Parcourir
- Lien vidéo
- YouTube, Instagram, TikTok… S’ouvre dans un nouvel onglet.
- APERÇU
- Muscles
- Annuler
- Supprimer l’exercice
- 11b
- Mobile · {{ title }}
- 9:41
- 5G ▮
- Original
- Une consigne par ligne, 15 au maximum.
- Ajouter une photo

## Placeholders

- Ex. Squat goblet
- Tiens-toi debout, pieds à largeur de hanches.
Descends en gardant le dos droit.
- https://www.instagram.com/reel/…

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
- Musculation
- Cardio
- Hyrox
- Mobilité
- Pectoraux
- Dos
- Épaules
- Biceps
- Triceps
- Avant-bras
- Abdominaux
- Lombaires
- Fessiers
- Hanches et adducteurs
- Quadriceps
- Ischio-jambiers
- Mollets
- Fentes bulgares avec élastique
- Élastique
- , rub: 
- , g: {}, mat: 
-  }, variant: { name: 
- , g: { Fessiers: 1, Quadriceps: 1, Mollets: 1 }, mat: 
-  } };
class Component extends DCLogic {
  state = Object.assign({ mode: 
-  }, PRESET.edit);
  renderVals() {
    const s = this.state, isVar = s.mode === 
- ;
    const chip = (on, l, fn) => ({ l, on: fn, mark: on ? 
-  });
    const sel = GROUPS.filter(g => s.g[g]);
    return {
      modes: [[
- ]].map(([k, l]) => ({ l, on: () => this.setState(Object.assign({ mode: k }, PRESET[k])), bg: s.mode === k ? 
- , c: s.mode === k ? 
-  })),
      nav1: NAV1.map(n => ({ l: n[0], d: n[1], bg: n[0] === 
-  })),
      nav2: NAV2.map(n => ({ l: n[0], d: n[1], b: n[2] })),
      isVar, title: 
- , crumb: 
-  + PRESET.edit.name, cta: 
- ,
      name: s.name, setName: e => this.setState({ name: e.target.value }), nameShown: s.name || 
-  + (sel.length > 1 ? 
- , gList: sel.length ? sel.join(
