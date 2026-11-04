# 09 · Inviter un sportif — contenu (textes)

> Extraction automatique du fichier source. **Statiques** = textes du gabarit (libellés d’interface, à reprendre tels quels). **Données de démo** = valeurs du fichier `logic.js` (noms, montants, dates, listes) : elles illustrent la maquette et doivent être remplacées par les données réelles de COORY.

## Textes statiques du gabarit

- body{margin:0;background:#dcdbe3}*{box-sizing:border-box}a{color:#6a3ee0;text-decoration:none}a:hover{color:#8b5cf6}
- État affiché
- 9a
- Desktop · 1280 · {{ st.label }}
- GL
- Gianluca Lo Bianco
- Coach
- Sportifs · {{ st.name }}
- Inviter {{ st.name }}
- Rechercher dans Coory
- Assistant IA
- coory.app/invitation/7f3k-92xa-sophie
- Copier le lien
- 9b
- Mobile · {{ st.label }}
- 9:41
- 5G ▮
- Inviter {{ st.first }}
- coory.app/invitation/7f3k-92xa…

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
- Pas encore invité
- Sophie Lambert
- sophie.lambert@example.test
- Pas encore invitée
- Génère un lien personnel et envoie-le toi-même. Sophie l’ouvrira pour créer son accès avec son adresse e-mail.
- Générer le lien d’invitation
- Lien généré
- Lien prêt
- Copie le lien maintenant : pour ta sécurité, il ne sera plus affiché ensuite.
- Copier le lien
- Invitation en attente
- Lucas Janssens
- lucas.janssens@example.test
- En attente · jusqu’au 10 nov.
- Un lien est valable jusqu’au 10 novembre 2026 à 14:32. Il ne peut pas être réaffiché : génère un nouveau lien si Lucas l’a perdu.
- Générer un nouveau lien
- Révoquer ce lien
- Compte déjà activé
- Thomas Peeters
- thomas.peeters@example.test
- Compte activé
- Thomas a déjà activé son compte. Il se connecte avec son adresse e-mail : aucune invitation à envoyer.
- Voir la fiche
- Envoyer un message
- )[0];
    return {
      states: Object.keys(ST).map(k => ({ l: ST[k].label, on: () => this.setState({ s: k }), bg: this.state.s === k ? 
- , c: this.state.s === k ? 
-  })),
      st, shares: [
- ],
      rules: [[
- ]].map(([d, l]) => ({ d, l })),
      nav1: NAV1.map(n => ({ l: n[0], d: n[1], bg: n[0] === 
