// Modules prévus mais pas encore construits (D-28) : visibles dans le menu avec « Bientôt », chacun
// avec une page qui dit ce qui arrive et dans quelle phase de la roadmap. Rien n'y est simulé.
export const COMING_SOON = {
  programmes: {
    label: "Programmes",
    phase: "P4",
    summary:
      "Créer le programme d'un sportif sur plusieurs semaines (Running, Musculation, Hyrox, Hybride) à partir des modèles, le personnaliser séance par séance, puis le publier.",
  },
  seances: {
    label: "Séances",
    phase: "P3, puis P5 et P6",
    summary:
      "Les modèles de séances réutilisables (P3), les séances publiées dans les programmes (P5) et les retours des sportifs : séance faite, ressenti (RPE), commentaires (P6).",
  },
  facturation: {
    label: "Facturation",
    phase: "après P6 (D-17)",
    summary:
      "Suivre les forfaits de chaque sportif et les paiements reçus, puis émettre des factures PDF. Aucun paiement ne passe par Coory : le coach suit ce qu'il encaisse.",
  },
  comptabilite: {
    label: "Comptabilité",
    phase: "après P6 (D-17, OPEN-17)",
    summary:
      "Revenus du mois, paiements en attente et export pour le comptable. Les règles (TVA, mentions, numérotation) sont en cours de vérification par un comptable.",
  },
  bibliotheque: {
    label: "Bibliothèque",
    phase: "P3",
    summary:
      "Le catalogue d'exercices, les blocs et les modèles de séances et de semaines que le coach réutilise d'un sportif à l'autre.",
  },
  taches: {
    label: "Tâches",
    phase: "avec P4 à P7",
    summary:
      "Les tâches prioritaires du coach, créées à partir de ce qui existe : programme à finaliser, facture à envoyer, suivi à faire, message auquel répondre. Elles arrivent avec les modules qui les produisent.",
  },
  messages: {
    label: "Messages",
    phase: "P7",
    summary:
      "Écrire aux sportifs depuis Coory, dans le respect de leur canal préféré et de leur consentement. En attendant, le coach dispose du message visible par le sportif dans sa fiche (onglet Notes).",
  },
  documents: {
    label: "Documents",
    phase: "P5",
    summary:
      "Les PDF des programmes publiés (même version que celle vue par le sportif), puis les factures. Stockés en privé, téléchargeables par le coach et le sportif concerné.",
  },
} as const;

export type ComingSoonSlug = keyof typeof COMING_SOON;
