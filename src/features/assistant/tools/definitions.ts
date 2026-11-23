import type Anthropic from "@anthropic-ai/sdk";

import { NOTIFICATION_KINDS } from "@/features/coach/settings";

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
    name: "voir_categories_de_documents",
    description: "Liste les catégories de documents du coach (id et nom).",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "voir_fiche",
    description:
      "Montre la fiche d'un sportif (identité, contact, niveau, expérience, lieux, matériel, adresse ; ni santé ni notes) : pour savoir ce qui manque avant completer_fiche.",
    input_schema: {
      type: "object",
      properties: { sportif_id: { type: "string" } },
      required: ["sportif_id"],
    },
  },
  {
    name: "voir_brouillon",
    description:
      "Lit un programme (son brouillon, ce que l'éditeur montre) : sans `semaines`, le SOMMAIRE (titre, dates, phases, chaque séance en une ligne avec sa clé) ; avec `semaines` (2 au plus), le contenu COMPLET des séances de ces semaines. Indispensable avant modifier_programme.",
    input_schema: {
      type: "object",
      properties: {
        programme_id: { type: "string", description: "Id trouvé avec voir_programmes." },
        semaines: {
          type: "array",
          items: { type: "integer" },
          description: "1 ou 2 numéros de semaine.",
        },
      },
      required: ["programme_id"],
    },
  },
  {
    name: "voir_modele",
    description:
      "Lit un modèle de programme (Coory ou du coach), comme voir_brouillon : sommaire, ou 2 semaines détaillées. Avant modifier_modele.",
    input_schema: {
      type: "object",
      properties: {
        modele_id: { type: "string", description: "Id trouvé avec voir_modeles." },
        semaines: { type: "array", items: { type: "integer" } },
      },
      required: ["modele_id"],
    },
  },
  {
    name: "voir_modeles",
    description:
      "Liste les modèles de programme (Coory et ceux du coach) : id, titre, discipline, semaines, séances par semaine. À regarder avant de créer un programme : partir d'un modèle qui convient est plus sûr et moins long.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "voir_modeles_de_seance",
    description:
      "Liste les modèles de SÉANCE (Coory et ceux du coach) : id, titre, discipline, détail, origine. Pour dupliquer_modele ou archiver_modele avec sorte « seance ».",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "voir_taches",
    description:
      "Liste les tâches du coach (100 au plus) : id, titre, échéance, priorité, liste, sportif, faite, note. Par défaut celles à faire ; statut « terminees » ou « toutes ».",
    input_schema: {
      type: "object",
      properties: {
        statut: { type: "string", enum: ["a_faire", "terminees", "toutes"] },
        sportif_id: { type: "string" },
        liste_id: { type: "string" },
      },
    },
  },
  {
    name: "voir_paiements",
    description:
      "Liste les paiements reçus (100 au plus, les plus récents d'abord) : id, date, montant, sportif, moyen, libellé. Filtres : sportif, période (du, au : AAAA-MM-JJ).",
    input_schema: {
      type: "object",
      properties: {
        sportif_id: { type: "string" },
        du: { type: "string" },
        au: { type: "string" },
      },
    },
  },
  {
    name: "voir_depenses",
    description:
      "Liste les dépenses (100 au plus) : id, libellé, montant, date, mensuelle, jusqu_au, catégorie. Période facultative (du, au).",
    input_schema: {
      type: "object",
      properties: { du: { type: "string" }, au: { type: "string" } },
    },
  },
  {
    name: "voir_documents",
    description:
      "Liste les documents (100 au plus) : id, nom, catégorie, sportif, taille, date. Jamais leur contenu. Filtres : sportif, catégorie.",
    input_schema: {
      type: "object",
      properties: { sportif_id: { type: "string" }, categorie_id: { type: "string" } },
    },
  },
  {
    name: "voir_objectifs",
    description:
      "Liste les objectifs d'un sportif (en cours puis passés) : id, objectif, date, temps visé, priorité, statut, compétition.",
    input_schema: {
      type: "object",
      properties: { sportif_id: { type: "string" } },
      required: ["sportif_id"],
    },
  },
  {
    name: "voir_reperes",
    description:
      "Liste les repères d'entraînement (allures, FC, charges) et les records d'un sportif, avec leurs id.",
    input_schema: {
      type: "object",
      properties: { sportif_id: { type: "string" } },
      required: ["sportif_id"],
    },
  },
  {
    name: "voir_parametres",
    description:
      "Lit les réglages : profil du coach (téléphone : rempli ou vide), organisation (nom, pays, devise, propriétaire), préférences, notifications voulues par sorte.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "voir_notifications",
    description:
      "Liste les notifications (100 au plus) : clé, sorte, texte, lue, masquée. Les clés servent à l'outil notifications. Filtres facultatifs : une sorte, ou seulement celles à traiter (ni lues ni masquées).",
    input_schema: {
      type: "object",
      properties: {
        sorte: { type: "string", enum: [...NOTIFICATION_KINDS] },
        etat: { type: "string", enum: ["toutes", "a_traiter"] },
      },
    },
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
