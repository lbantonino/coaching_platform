import type Anthropic from "@anthropic-ai/sdk";

// Outils de LECTURE de l'Assistant IA (lot 1 des actions) : exécutés tout de suite, limités à
// l'organisation du coach. Les descriptions parlent à Claude (en français, comme la consigne).
const date = { type: "string", description: "Date au format AAAA-MM-JJ." } as const;

export const READ_TOOLS: Anthropic.Tool[] = [
  {
    name: "chercher_sportifs",
    description:
      "Cherche les sportifs du coach par prénom ou nom (début d'un mot, sans accent). Renvoie leur id, nom complet, statut, discipline et ce qui manque à leur fiche. À utiliser AVANT toute action qui concerne un sportif. Si plusieurs sportifs correspondent, demande au coach lequel.",
    input_schema: {
      type: "object",
      properties: {
        nom: { type: "string", description: "Prénom, nom ou début du nom." },
        avec_archives: { type: "boolean", description: "Inclure les sportifs archivés." },
      },
      required: ["nom"],
    },
  },
  {
    name: "voir_agenda",
    description:
      "Liste les séances du coach entre deux dates (31 jours au plus), une ligne par date : seance_id, date, date_originale (date de la série, à donner pour déplacer), heure, durée, titre, sportif ou « collective », répétée chaque semaine ou non.",
    input_schema: {
      type: "object",
      properties: { du: date, au: date },
      required: ["du", "au"],
    },
  },
  {
    name: "voir_a_encaisser",
    description:
      "Liste les dates de séances passées pas encore payées (avec le montant attendu), d'un sportif si son id est donné. À regarder avant de noter un paiement : si une date correspond, propose de la marquer payée.",
    input_schema: {
      type: "object",
      properties: { sportif_id: { type: "string", description: "Id du sportif (facultatif)." } },
    },
  },
  {
    name: "voir_listes_de_taches",
    description: "Liste les listes de tâches du coach (id et nom).",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "voir_categories_de_depenses",
    description: "Liste les catégories de dépenses du coach (id et nom).",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "voir_modeles",
    description:
      "Liste les modèles de programme (Coory et ceux du coach) : id, titre, discipline, semaines, séances par semaine. À regarder avant de créer un programme : partir d'un modèle qui convient est plus sûr et moins long.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "voir_programmes",
    description:
      "Liste les programmes d'un sportif avec leurs dates (début, fin) et leur statut : pour choisir une date de début qui ne chevauche rien, ou copier un ancien programme.",
    input_schema: {
      type: "object",
      properties: { sportif_id: { type: "string" } },
      required: ["sportif_id"],
    },
  },
  {
    name: "chercher_exercices",
    description:
      "Cherche des exercices de la Bibliothèque du coach par nom (début d'un mot, sans accent) : id, nom, mesure (repetitions ou secondes). Utilise ces id (exerciseId) dans les séances de musculation.",
    input_schema: {
      type: "object",
      properties: { nom: { type: "string" } },
      required: ["nom"],
    },
  },
];

export const READ_TOOL_NAMES = new Set(READ_TOOLS.map((tool) => tool.name));
