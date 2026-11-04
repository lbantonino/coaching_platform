# Design → code

1. Ouvre `source-design-files/shared/Coory Boites.dc.html` : chaque écran a `data-shot="NN-d|m"`. Inspecte les styles inline (valeurs exactes).
2. `source-design-files/interface-NN/spec.json` donne la même chose sous forme de données (champs, actions, largeurs).
3. Traduis les styles inline en tokens/classes du système de COORY (Tailwind ou CSS existant) — ne colle pas de styles inline.
4. Icônes : lucide-react avec les noms de `design-system/icons.md`.
5. Le fond d’app gris dessiné derrière chaque boîte est un **décor de maquette** : ne pas l’implémenter.
