import "server-only";

import { randomUUID } from "node:crypto";

import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

import { currencyOf, formatMoney } from "@/domain/billing/money";
import { formatBytes } from "@/domain/documents/documents";
import { EQUIPMENT_KEYS } from "@/domain/exercises/vocabulary";
import { findSession } from "@/domain/training/plan-edit";
import { HYROX_DIVISIONS, planIssues } from "@/domain/training/program-plan";
import { copyStartDate } from "@/domain/training/program-status";
import { SESSION_MOMENTS, sessionBodySchema, WEEKDAYS } from "@/domain/training/session-v2";
import { getAthlete } from "@/features/athletes/queries";
import { addressSchema, athleteUpdateSchema } from "@/features/athletes/schemas";
import { loadDraft } from "@/features/programs/drafts";
import { getPublishedProgram, listAthleteProgramRows } from "@/features/programs/queries";
import { checkPublication } from "@/features/programs/publish-check";
import { getProgramTemplate, getSessionTemplate } from "@/features/programs/templates";
import { getSession } from "@/features/sessions/queries";
import { sessionAmountCents } from "@/features/sessions/schemas";
import { todayIsoInBrussels } from "@/lib/format";

import type { AssistantAttachment } from "../rules";
import { createClient } from "@/lib/supabase/server";

import { isDailyKind } from "../daily";
import { isReglagesKind } from "../reglages";
import { isSportifsKind } from "../sportifs";
import {
  ATHLETE_READ_FAILED,
  athletePlanFacts,
  hasUnknownExercise,
  UNKNOWN_EXERCISE,
} from "../exercise-check";
import { athleteFormValues, checkAgainstSession, formRuleError } from "../form-data";
import { copySourceRefusal, overlapWarning, programRuleError, withSourceRhythm } from "../program";
import { DAILY_TOOLS, proposeDaily } from "./daily";
import { proposeReglages, REGLAGES_TOOLS } from "./reglages";
import { proposeSportifs, SPORTIFS_TOOLS } from "./sportifs";
import {
  actionCardNames,
  pendingConflict,
  programActionRefusal,
  publicationRefusal,
  templateActionRefusal,
  type ProgramActionKind,
} from "../program-actions";
import {
  applyProgramEdits,
  editCardNames,
  programEditRefusal,
  programEditsToolSchema,
  staleReading,
  templateEditRefusal,
  type ProgramEdit,
} from "../program-edit";
import {
  ACTION_KINDS,
  athleteFicheRefusal,
  athleteFieldText,
  changedAthleteFields,
  pdfRefusal,
  prepareToolInput,
  publicationLine,
  hasExerciseNamed,
  summarize,
  type AssistantProposal,
  type ParsedAssistantAction,
} from "../proposals";

// Outils d'ÉCRITURE de l'Assistant IA (lot 1 des actions) : rien n'est exécuté. Chaque appel devient
// une PROPOSITION (carte) après vérification : schéma strict, puis appartenance de chaque identifiant
// à l'organisation du coach (sportif non archivé, séance, liste, catégorie). Une erreur est renvoyée
// à Claude pour qu'il corrige ou demande au coach.

const date = { type: "string", description: "AAAA-MM-JJ" } as const;
const hour = { type: "string", description: "HH:MM" } as const;
const athlete = {
  type: "object",
  description:
    'Le sportif : { athleteId } (id trouvé avec chercher_sportifs) ou { nouveauSportif: "Prénom Nom" } pour un sportif dont tu proposes la fiche dans la même réponse.',
  properties: {
    athleteId: { type: "string" },
    nouveauSportif: { type: "string" },
  },
} as const;
const vat = {
  type: "number",
  description: "Taux de TVA en % (0 = sans TVA, par défaut). Seulement si le coach le demande.",
} as const;

export const WRITE_TOOLS: Anthropic.Tool[] = [
  {
    name: "creer_sportif",
    description:
      "Propose la fiche d'un nouveau sportif (carte à valider). Jamais de santé, de blessure ni de note privée.",
    input_schema: {
      type: "object",
      properties: {
        firstName: { type: "string" },
        lastName: { type: "string" },
        sex: { type: "string", enum: ["female", "male", "unspecified"] },
        email: { type: "string" },
        phone: { type: "string" },
        level: { type: "string", enum: ["beginner", "intermediate", "advanced", "competitor"] },
        programType: { type: "string", enum: ["running", "strength", "hyrox", "hybrid"] },
        goalType: {
          type: "string",
          enum: [
            "run_5k",
            "run_10k",
            "run_half",
            "run_marathon",
            "run_other",
            "hyrox",
            "strength",
            "body_composition",
            "fitness",
            "personal",
          ],
        },
        goalDate: date,
        competitionName: { type: "string" },
      },
      required: ["firstName"],
    },
  },
  {
    name: "creer_seance",
    description:
      "Propose une séance dans l'agenda : individuelle (avec son sportif) ou collective (avec ses inscrits), une fois ou chaque semaine.",
    input_schema: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["individual", "group"] },
        title: { type: "string" },
        discipline: { type: "string", enum: ["running", "strength", "hyrox", "hybrid"] },
        location: { type: "string" },
        startsOn: date,
        startTime: hour,
        durationMinutes: { type: "integer" },
        repeatsWeekly: { type: "boolean" },
        endsOn: date,
        athlete,
        athleteIds: { type: "array", items: { type: "string" } },
        price: { type: "number", description: "Prix en unités de la devise (65 = 65 €)." },
        vatRate: vat,
        vatIncluded: { type: "boolean" },
        paymentMethod: { type: "string", enum: ["transfer", "cash"] },
        notes: { type: "string" },
      },
      required: ["kind", "title", "startsOn", "startTime", "durationMinutes"],
    },
  },
  {
    name: "deplacer_seance",
    description:
      "Propose de déplacer une séance (comme la glisser dans l'agenda) : cette date seulement (scope single) ou toute la série (scope series, 3 jours au plus d'écart). originalDate = date_originale de voir_agenda. Heure au quart d'heure.",
    input_schema: {
      type: "object",
      properties: {
        sessionId: { type: "string" },
        originalDate: date,
        newDate: date,
        newTime: hour,
        scope: { type: "string", enum: ["single", "series"] },
      },
      required: ["sessionId", "originalDate", "newDate", "newTime", "scope"],
    },
  },
  {
    name: "marquer_seance_payee",
    description:
      "Propose de marquer payée une date de séance à encaisser (voir_a_encaisser : seance_id et date_originale).",
    input_schema: {
      type: "object",
      properties: { sessionId: { type: "string" }, sessionDate: date },
      required: ["sessionId", "sessionDate"],
    },
  },
  {
    name: "noter_paiement",
    description:
      "Propose un paiement reçu d'un sportif, qui ne correspond à aucune séance à encaisser (sinon utilise marquer_seance_payee).",
    input_schema: {
      type: "object",
      properties: {
        athlete,
        receivedOn: date,
        amount: { type: "number" },
        vatRate: vat,
        method: { type: "string", enum: ["cash", "transfer", "bancontact", "other"] },
        label: { type: "string" },
      },
      required: ["athlete", "receivedOn", "amount", "method"],
    },
  },
  {
    name: "noter_depense",
    description: "Propose une dépense du coach, une fois ou chaque mois.",
    input_schema: {
      type: "object",
      properties: {
        label: { type: "string" },
        categoryId: { type: "string", description: "Id de voir_categories_de_depenses." },
        amount: { type: "number" },
        vatRate: vat,
        spentOn: date,
        repeatsMonthly: { type: "boolean" },
        endsOn: date,
      },
      required: ["label", "amount", "spentOn"],
    },
  },
  {
    name: "creer_tache",
    description: "Propose une tâche pour le coach, avec échéance, liste et sportif si utiles.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        priority: { type: "string", enum: ["high", "normal"] },
        dueOn: date,
        listId: { type: "string", description: "Id de voir_listes_de_taches." },
        athlete,
        notes: { type: "string" },
      },
      required: ["title"],
    },
  },
  {
    name: "importer_document",
    description:
      "Propose de ranger le fichier JOINT par le coach (ligne « [Fichier joint : …] » de sa demande) dans ses Documents, avec un nom, une catégorie (voir_categories_de_documents) et un sportif si utile. Tu ne vois jamais le contenu du fichier. Sans fichier joint, demande au coach de le joindre avec le bouton « Joindre ».",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Nom du document (160 caractères au plus)." },
        categoryId: { type: "string", description: "Id de voir_categories_de_documents." },
        athleteId: { type: "string", description: "Id trouvé avec chercher_sportifs." },
      },
      required: ["name"],
    },
  },
  {
    name: "preparer_pdf",
    description:
      "Donne les deux PDF (Agenda du programme, Fiches et repères) de la dernière version PUBLIÉE d'un programme, en liens dans une carte. Rien n'est envoyé au sportif. Trouve l'id avec voir_programmes.",
    input_schema: {
      type: "object",
      properties: { programId: { type: "string", description: "Id trouvé avec voir_programmes." } },
      required: ["programId"],
    },
  },
  {
    name: "creer_exercice",
    description:
      "Propose un nouvel exercice dans la Bibliothèque du coach (carte à valider), sans photo. Cherche d'abord avec chercher_exercices s'il n'existe pas déjà.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Nom en français (80 caractères au plus)." },
        category: { type: "string", enum: ["strength", "cardio", "hyrox", "mobility"] },
        muscleGroups: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "chest",
              "back",
              "shoulders",
              "biceps",
              "triceps",
              "forearms",
              "abs",
              "lower_back",
              "glutes",
              "hips",
              "quads",
              "hamstrings",
              "calves",
            ],
          },
        },
        equipment: {
          type: "string",
          enum: [...EQUIPMENT_KEYS],
          description: "Matériel principal ; à omettre pour le poids du corps.",
        },
        instructions: {
          type: "array",
          items: { type: "string" },
          description: "Consignes, une par élément (15 au plus).",
        },
        videoUrl: {
          type: "string",
          description: "Lien https vers une vidéo, si le coach en donne un.",
        },
      },
      required: ["name", "category"],
    },
  },
  {
    name: "completer_fiche",
    description:
      "Propose de compléter la fiche d'un sportif existant (carte à valider) : seulement les champs vides, ou ceux que le coach demande de changer. Regarde d'abord la fiche avec voir_fiche. Jamais de santé, de blessure, de note privée ni de statut.",
    input_schema: {
      type: "object",
      properties: {
        athleteId: { type: "string", description: "Id trouvé avec chercher_sportifs." },
        changes: {
          type: "object",
          description: "Les champs à écrire, et seulement eux.",
          properties: {
            firstName: { type: "string" },
            lastName: { type: "string" },
            sex: { type: "string", enum: ["female", "male", "unspecified"] },
            email: { type: "string" },
            phone: { type: "string", description: "Format international conseillé : +32 …" },
            preferredContact: { type: "string", enum: ["email", "phone", "sms", "whatsapp"] },
            level: { type: "string", enum: ["beginner", "intermediate", "advanced", "competitor"] },
            experience: { type: "string" },
            trainingPlaces: {
              type: "array",
              items: { type: "string", enum: ["gym", "outdoor", "track", "home", "box"] },
              description: "TOUS les lieux (la liste remplace l'ancienne).",
            },
            equipment: { type: "string" },
            addressLine: { type: "string" },
            postalCode: { type: "string" },
            city: { type: "string" },
            country: { type: "string", description: "Code ISO à 2 lettres (BE, FR…)." },
          },
        },
      },
      required: ["athleteId", "changes"],
    },
  },
  {
    name: "creer_liste_de_taches",
    description: "Propose une nouvelle liste de tâches (40 caractères au plus).",
    input_schema: {
      type: "object",
      properties: { name: { type: "string" } },
      required: ["name"],
    },
  },
];

// Lot 3a : le schéma EXACT d'une séance (celui de l'éditeur), donné à Claude pour écrire un programme.
const sessionJson = z.toJSONSchema(sessionBodySchema, { unrepresentable: "any" }) as {
  properties?: Record<string, unknown>;
  required?: string[];
};
const writtenSession = {
  type: "object",
  description:
    "Une séance décrite UNE fois, avec sa référence courte ; elle peut être placée dans plusieurs semaines.",
  properties: {
    ref: { type: "string", description: "Référence courte : A, B, footing, sortie-longue…" },
    ...sessionJson.properties,
    fixedDay: { type: "string", enum: [...WEEKDAYS], description: "Jour, en mode jours fixés." },
    fixedTime: hour,
    moment: { type: "string", enum: [...SESSION_MOMENTS] },
  },
  required: ["ref", ...(sessionJson.required ?? [])],
};

WRITE_TOOLS.push({
  name: "creer_programme",
  description: [
    "Propose un BROUILLON de programme pour un sportif (jamais publié ici : le coach le relit ; pour le publier, une autre carte publier_programme, seulement s'il le demande).",
    "Avant : chercher_sportifs, voir_programmes (choisis un début LUNDI après la fin de son dernier programme PUBLIÉ ; un brouillon ne bloque rien), voir_modeles.",
    "Départ (start) : un modèle qui convient ({kind:'template', templateId}) est le plus sûr ; sinon une copie ({kind:'copy', programId}) ; sinon vide ({kind:'blank'}), et alors tu peux écrire les séances.",
    "Programme écrit : décris chaque séance UNE fois dans seances (avec ref), puis place les ref semaine par semaine dans semaines ; fais progresser en variant les séances d'une phase à l'autre, sans répéter inutilement.",
    "Musculation : exerciseId vient de chercher_exercices. Course : allures en secondes par km ou zones de FC. Reste concis.",
  ].join(" "),
  input_schema: {
    type: "object",
    properties: {
      athlete,
      title: { type: "string" },
      discipline: { type: "string", enum: ["running", "strength", "hyrox"] },
      startDate: { ...date, description: "Un LUNDI, AAAA-MM-JJ." },
      weeksCount: { type: "integer" },
      sessionsPerWeek: { type: "integer" },
      scheduling: {
        type: "string",
        enum: ["ordered", "fixed"],
        description:
          "ordered : dans l'ordre, le sportif choisit le jour ; fixed : jours fixés (donne fixedDay à chaque séance, sinon Coory en propose un selon les disponibilités du sportif).",
      },
      goal: {
        type: "object",
        properties: {
          raceName: { type: "string" },
          raceDate: date,
          hyroxDivision: { type: "string", enum: [...HYROX_DIVISIONS] },
          note: { type: "string" },
        },
      },
      phases: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            weekFrom: { type: "integer" },
            weekTo: { type: "integer" },
          },
          required: ["name", "weekFrom", "weekTo"],
        },
      },
      start: {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["blank", "template", "copy"] },
          templateId: { type: "string" },
          programId: { type: "string" },
        },
        required: ["kind"],
      },
      seances: { type: "array", items: writtenSession },
      semaines: {
        type: "array",
        items: {
          type: "object",
          properties: {
            index: { type: "integer" },
            light: { type: "boolean" },
            seances: { type: "array", items: { type: "string" } },
          },
          required: ["index", "seances"],
        },
      },
    },
    required: [
      "athlete",
      "title",
      "discipline",
      "startDate",
      "weeksCount",
      "sessionsPerWeek",
      "scheduling",
      "start",
    ],
  },
});

// Lot 3b (D-182) : chaque geste de l'éditeur, en UNE carte par programme ou modèle.
const editTool = (target: "programme" | "modele") =>
  [
    target === "programme"
      ? "Propose UNE carte qui modifie le brouillon d'un programme, comme dans l'éditeur."
      : "Propose UNE carte qui modifie un de Mes modèles (jamais un modèle Coory : duplique-le d'abord), comme dans l'éditeur.",
    "Gestes : séances (modifier_seance, ajouter_seance, dupliquer_seance, supprimer_seance, deplacer_seance, jour_seance), semaines (ajouter_semaine, retirer_semaine, semaine_allegee, dupliquer_semaine, organisation_semaine), phases (ajouter_phase, renommer_phase, semaines_phase, retirer_phase), titre, discipline, façon de viser (viser)",
    target === "programme"
      ? ", date de début (debut, ramenée au lundi) et objectif."
      : " (un modèle n'a ni date de début ni objectif).",
    target === "programme"
      ? " Avant : voir_brouillon (sommaire : clés des séances, phases et révision), puis voir_brouillon avec `semaines` pour le contenu d'une séance à modifier."
      : " Avant : voir_modele (sommaire : clés, phases, révision), puis voir_modele avec `semaines` pour le contenu d'une séance.",
    " Mets TOUS les changements demandés dans une seule carte (20 au plus), dans l'ordre où ils s'appliquent ; une suppression est définitive.",
    " Les numéros de semaine sont ceux de ta lecture, même après un retrait plus haut dans la carte ; une semaine ajoutée prend le numéro qui suit la dernière ; jamais d'ajout et de retrait de semaines dans la même carte.",
    " Un jour (jour_seance) se fixe seulement dans une semaine à jours fixes : passe-la d'abord en jours fixes (organisation_semaine) ; jamais sur une séance avec le coach.",
    target === "programme"
      ? " Programme publié : les changements vont dans son brouillon (publier est une autre carte, seulement si le coach le demande)."
      : "",
  ].join("");

WRITE_TOOLS.push(
  {
    name: "modifier_programme",
    description: editTool("programme"),
    input_schema: {
      type: "object",
      properties: {
        programId: { type: "string", description: "Id trouvé avec voir_programmes." },
        revision: { type: "integer", description: "La `revision` donnée par voir_brouillon." },
        operations: programEditsToolSchema,
      },
      required: ["programId", "revision", "operations"],
    },
  },
  {
    name: "modifier_modele",
    description: editTool("modele"),
    input_schema: {
      type: "object",
      properties: {
        templateId: { type: "string", description: "Id trouvé avec voir_modeles." },
        version: { type: "integer", description: "La `revision` donnée par voir_modele." },
        operations: programEditsToolSchema,
      },
      required: ["templateId", "version", "operations"],
    },
  },
);

// Lot 3b (D-182) : les actions d'un programme et des modèles, comme leurs boutons.
const programIdField = {
  programId: { type: "string", description: "Id trouvé avec voir_programmes." },
} as const;
const templateFields = {
  templateId: {
    type: "string",
    description: "Id trouvé avec voir_modeles ou voir_modeles_de_seance.",
  },
  sorte: {
    type: "string",
    enum: ["programme", "seance"],
    description: "programme (par défaut) ou seance (voir_modeles_de_seance).",
  },
} as const;
WRITE_TOOLS.push(
  {
    name: "publier_programme",
    description:
      "Propose de PUBLIER le brouillon d'un programme (nouvelle version : fiche, agenda et PDF la suivent). Seulement si le coach le demande. Les contrôles de « Publier » sont faits : un problème bloquant refuse la carte (explique-le au coach), un avertissement s'affiche sur la carte.",
    input_schema: { type: "object", properties: programIdField, required: ["programId"] },
  },
  {
    name: "archiver_programme",
    description:
      "Propose d'archiver un programme (il quitte la liste et la fiche du sportif ; ses versions publiées restent ; se désarchive ensuite).",
    input_schema: { type: "object", properties: programIdField, required: ["programId"] },
  },
  {
    name: "desarchiver_programme",
    description:
      "Propose de désarchiver un programme archivé : il reprend son état d'avant (brouillon, ou publié avec sa version).",
    input_schema: { type: "object", properties: programIdField, required: ["programId"] },
  },
  {
    name: "dupliquer_programme",
    description:
      "Propose de dupliquer un programme : un nouveau brouillon pour le même sportif, qui commence le lundi après la fin de l'original.",
    input_schema: { type: "object", properties: programIdField, required: ["programId"] },
  },
  {
    name: "enregistrer_comme_modele",
    description:
      "Propose d'enregistrer un programme dans Mes modèles (sans sportif ni dates), sous un titre.",
    input_schema: {
      type: "object",
      properties: { ...programIdField, titre: { type: "string" } },
      required: ["programId", "titre"],
    },
  },
  {
    name: "enregistrer_seance_comme_modele",
    description:
      "Propose d'enregistrer UNE séance d'un programme dans Mes modèles (séances), sous un titre (80 caractères au plus). La clé vient de voir_brouillon.",
    input_schema: {
      type: "object",
      properties: { ...programIdField, cle: { type: "string" }, titre: { type: "string" } },
      required: ["programId", "cle", "titre"],
    },
  },
  {
    name: "dupliquer_modele",
    description:
      "Propose de copier un modèle (Coory ou du coach) dans Mes modèles : la copie se modifie ensuite (modifier_modele), l'original ne change pas.",
    input_schema: { type: "object", properties: templateFields, required: ["templateId"] },
  },
  {
    name: "archiver_modele",
    description:
      "Propose d'archiver un de Mes modèles (il n'est plus proposé ; les programmes déjà créés avec lui ne changent pas). Jamais un modèle Coory.",
    input_schema: { type: "object", properties: templateFields, required: ["templateId"] },
  },
  {
    name: "creer_modele",
    description:
      "Propose un nouveau modèle de programme dans Mes modèles : vide (à remplir ensuite avec modifier_modele), ou repris d'un autre modèle (depuisModele, redimensionné).",
    input_schema: {
      type: "object",
      properties: {
        titre: { type: "string" },
        discipline: { type: "string", enum: ["running", "strength", "hyrox", "hybrid"] },
        semaines: { type: "integer" },
        seancesParSemaine: { type: "integer" },
        organisation: {
          type: "string",
          enum: ["ordered", "fixed"],
          description: "ordered (dans l'ordre, par défaut) ou fixed (jours fixés).",
        },
        depuisModele: { type: "string", description: "Id d'un modèle de voir_modeles." },
        phases: {
          type: "array",
          items: {
            type: "object",
            properties: {
              nom: { type: "string" },
              de: { type: "integer" },
              a: { type: "integer" },
            },
            required: ["nom", "de", "a"],
          },
        },
      },
      required: ["titre", "discipline", "semaines", "seancesParSemaine"],
    },
  },
);

// Lot 4 (D-183) : le quotidien (tools/daily.ts).
WRITE_TOOLS.push(...DAILY_TOOLS);
// Lot 5 (D-184) : les sportifs (tools/sportifs.ts).
WRITE_TOOLS.push(...SPORTIFS_TOOLS);
// Lot 6 (D-185) : les réglages (tools/reglages.ts).
WRITE_TOOLS.push(...REGLAGES_TOOLS);

export const WRITE_TOOL_NAMES = new Set<string>(ACTION_KINDS);

type Proposed = { ok: true; proposal: AssistantProposal } | { ok: false; error: string };
const PROGRAM_ACTIONS = new Set<string>([
  "publier_programme",
  "archiver_programme",
  "desarchiver_programme",
  "dupliquer_programme",
  "enregistrer_comme_modele",
  "enregistrer_seance_comme_modele",
]);
const refuse = (error: string): Proposed => ({ ok: false, error });

export async function proposeAction(
  organizationId: string,
  name: string,
  input: unknown,
  pending: AssistantProposal[],
  context: { attachment?: AssistantAttachment } = {},
): Promise<Proposed> {
  // Schéma strict, renvoi à une carte seulement par le nom d'un sportif à créer (relecture n°11).
  const prepared = prepareToolInput(name, input, pending);
  if (!prepared.ok) return refuse(prepared.error);
  const kind = prepared.action.kind;
  const names: Record<string, string> = {};
  const dependsOn = prepared.dependsOn;
  if (dependsOn && prepared.newAthleteName) names[dependsOn] = prepared.newAthleteName;
  // Les règles du formulaire habituel, dès la proposition (relecture n°2).
  const ruleError = formRuleError(prepared.action, todayIsoInBrussels());
  if (ruleError) return refuse(ruleError);
  let p = prepared.action.params as Record<string, unknown>;
  const supabase = await createClient();

  // Chaque identifiant doit appartenir à l'organisation du coach.
  const athleteIds = [
    ...(p.athlete && typeof p.athlete === "object" && "athleteId" in p.athlete
      ? [String(p.athlete.athleteId)]
      : []),
    ...((p.athleteIds as string[] | undefined) ?? []),
    // Lot 2 : le sportif d'un document ou d'une fiche à compléter. Lot 5 : « Statut du sportif »
    // vérifie lui-même son sportif (un archivé se réactive).
    ...(typeof p.athleteId === "string" && kind !== "statut_sportif" ? [p.athleteId] : []),
  ];
  if (athleteIds.length > 0) {
    const { data } = await supabase
      .from("athlete_profiles")
      .select("id, display_name, status")
      .eq("organization_id", organizationId)
      .in("id", athleteIds);
    const found = (data ?? []).filter((row) => row.status !== "archived");
    if (found.length !== new Set(athleteIds).size) {
      return refuse("Sportif introuvable ou archivé : cherche-le avec chercher_sportifs.");
    }
    for (const row of found) names[row.id] = row.display_name ?? "";
  }
  if (typeof p.sessionId === "string") {
    const session = await getSession(organizationId, p.sessionId);
    if (!session) return refuse("Séance introuvable : regarde l'agenda avec voir_agenda.");
    // Comme l'agenda : date d'origine, minuit, séance unique, prix (relecture n°1).
    const checked = checkAgainstSession({ kind, params: p } as ParsedAssistantAction, session);
    if (!checked.ok) return refuse(checked.error);
    p = checked.params;
    const who =
      session.kind === "group" ? "collective" : (session.athletes[0]?.name ?? "sans sportif");
    names[session.id] = `${session.title} · ${who}`;
    if (session.priceCents !== null) {
      names[`${session.id}:montant`] = formatMoney(
        sessionAmountCents({ ...session, priceCents: session.priceCents }),
        session.currency,
      ).replace(/\s/g, " ");
    }
  }
  if (typeof p.listId === "string") {
    const { data } = await supabase
      .from("coach_task_lists")
      .select("name")
      .eq("organization_id", organizationId)
      .eq("id", p.listId)
      .maybeSingle();
    if (!data) return refuse("Liste introuvable : regarde voir_listes_de_taches.");
    names[p.listId] = data.name;
  }
  // Catégorie de DÉPENSES : seulement pour une dépense (relecture du lot 2 : un document a ses propres
  // catégories, vérifiées plus bas ; ce contrôle les refusait toutes).
  if (kind === "noter_depense" && typeof p.categoryId === "string") {
    const { data } = await supabase
      .from("expense_categories")
      .select("name")
      .eq("organization_id", organizationId)
      .eq("id", p.categoryId)
      .maybeSingle();
    if (!data) return refuse("Catégorie introuvable : regarde voir_categories_de_depenses.");
    names[p.categoryId] = data.name;
  }

  if (kind === "importer_document") {
    // Le fichier doit être JOINT à la demande (il part au « Valider », depuis le navigateur).
    if (!context.attachment) {
      return refuse(
        "Aucun fichier joint : demande au coach de le joindre avec le bouton « Joindre », puis de redemander.",
      );
    }
    names.fichier = `${context.attachment.name} (${formatBytes(context.attachment.size)})`;
    if (typeof p.categoryId === "string") {
      const { data } = await supabase
        .from("document_categories")
        .select("name")
        .eq("organization_id", organizationId)
        .eq("id", p.categoryId)
        .maybeSingle();
      if (!data) return refuse("Catégorie introuvable : regarde voir_categories_de_documents.");
      names[p.categoryId] = data.name;
    }
  }

  let links: AssistantProposal["links"];
  if (kind === "preparer_pdf") {
    // Seulement un programme de l'organisation, publié : les PDF viennent de sa dernière version, lue
    // comme les pages PDF (getPublishedProgram, relecture du lot 2, n°i).
    const published = await getPublishedProgram(organizationId, String(p.programId));
    if (!published) {
      const { data: exists } = await supabase
        .from("programs")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("id", String(p.programId))
        .maybeSingle();
      return refuse(pdfRefusal(exists ? { published: false } : null) ?? "Programme introuvable.");
    }
    const program = published.program;
    names[program.id] = program.title;
    names.sportif = published.athleteName;
    names.version = publicationLine(program.publicationNumber, program.publishedAt);
    const pdf = `/coach/o/${organizationId}/programmes/${program.id}/pdf`;
    links = [
      { label: "Agenda du programme", href: `${pdf}/agenda` },
      { label: "Fiches et repères", href: `${pdf}/fiches` },
    ];
  }

  if (kind === "creer_exercice") {
    // Doublon possible : un exercice du coach au même nom (sans casse ni espaces en trop). La carte le
    // dit ; le coach décide. Comparé ici, pas par un motif de la base (relecture du lot 2, n°f), sur
    // tous ses exercices (revue du 20/11, n°12).
    const duplicate = await hasExerciseNamed(async (from, to) => {
      const { data, error } = await supabase
        .from("exercises")
        .select("name_fr")
        .eq("organization_id", organizationId)
        .is("archived_at", null)
        .order("id")
        .range(from, to);
      return error ? null : (data ?? []);
    }, String(p.name));
    if (duplicate === null) {
      return refuse("La Bibliothèque n'a pas pu être lue (doublon possible) : réessaie.");
    }
    if (duplicate) names.doublon = "oui";
  }

  if (kind === "completer_fiche") {
    // La fiche doit être de l'organisation et active ; le résultat passe par les MÊMES règles que le
    // formulaire Profil (schémas de la fiche et de l'adresse), sur la fiche complète.
    const detail = await getAthlete(organizationId, String(p.athleteId));
    const changes = p.changes as Record<string, string | string[]>;
    const ficheRefusal = athleteFicheRefusal(detail, changes);
    if (ficheRefusal || !detail) return refuse(ficheRefusal ?? "Sportif introuvable.");
    const current = athleteFormValues(detail) as Record<string, string | string[]>;
    if (
      Object.entries(changes).every(([f, v]) => JSON.stringify(current[f]) === JSON.stringify(v))
    ) {
      return refuse("Ces informations sont déjà sur la fiche : rien à compléter.");
    }
    const merged = { ...current, ...changes };
    const profile = athleteUpdateSchema.safeParse(merged);
    const address = addressSchema.safeParse(merged);
    if (!profile.success || !address.success) {
      return refuse((profile.error ?? address.error)?.issues[0]?.message ?? "Fiche invalide.");
    }
    names[detail.id] = detail.displayName;
    // Seuls les vrais changements vont sur la carte (n°e) ; leur valeur actuelle est notée pour le
    // clic (n°d : une saisie du coach entre-temps refuse la carte au lieu d'être écrasée).
    const effective = changedAthleteFields(current, changes) as Record<string, string | string[]>;
    for (const field of Object.keys(effective)) {
      names[`avant:${field}`] = athleteFieldText(field, current[field]);
    }
    p = {
      ...p,
      changes: effective,
      avant: Object.fromEntries(
        Object.keys(effective).map((field) => [field, current[field] ?? ""]),
      ),
    };
  }

  if (kind === "creer_programme") {
    const start = p.start as { kind: string; templateId?: string; programId?: string };
    if (start.kind === "template" && start.templateId) {
      const template = await getProgramTemplate(organizationId, start.templateId);
      if (!template?.plan) return refuse("Modèle introuvable : regarde voir_modeles.");
      names[start.templateId] = template.title;
      p = withSourceRhythm(p, template.plan);
    }
    const athleteId =
      p.athlete && typeof p.athlete === "object" && "athleteId" in p.athlete
        ? String(p.athlete.athleteId)
        : null;
    const rows = athleteId ? await listAthleteProgramRows(organizationId, athleteId) : [];
    if (start.kind === "copy" && start.programId) {
      // La même source que createProgram : le brouillon d'un programme de ce sportif.
      const source = athleteId ? await loadDraft(supabase, organizationId, start.programId) : null;
      const refusal = copySourceRefusal(
        source?.draft ? { athleteId: source.program.athleteId } : null,
        athleteId,
      );
      if (refusal || !source) return refuse(refusal ?? "Programme à copier introuvable.");
      names[start.programId] = source.program.title;
      p = withSourceRhythm(p, source.draft);
    }
    if (await hasUnknownExercise(supabase, organizationId, p.seances)) {
      return refuse(UNKNOWN_EXERCISE);
    }
    // Façon de viser par défaut comme l'assistant de création (relecture du lot 3a, n°7) : FC sans
    // VMA, % avec des charges maximales liées ; notée ici, la même au « Valider ». Les jours
    // disponibles aussi (revue du 20/11, n°3) : la carte se revérifie avec eux, le clic les reprend.
    const facts = await athletePlanFacts(supabase, organizationId, athleteId);
    if (!facts) return refuse(ATHLETE_READ_FAILED);
    p = { ...p, aimDefaults: p.aimDefaults ?? facts.aim, joursDisponibles: facts.availableDays };
    const withDays = programRuleError(p);
    if (withDays) return refuse(withDays);
    // Un brouillon peut chevaucher un programme publié, mais il ne pourra pas être publié tel quel :
    // la carte le dit (comme l'assistant de création).
    const overlap = overlapWarning(rows, String(p.startDate), Number(p.weeksCount));
    if (overlap) names.chevauchement = overlap;
  }

  if (kind === "modifier_programme") {
    // Le brouillon de l'organisation (repris de la version publiée s'il n'existe pas encore), à la
    // révision que Claude a lue ; les changements passent par les fonctions de l'éditeur, pour VALIDER
    // et décrire la carte. Rien n'est enregistré ici.
    const conflict = pendingConflict(kind, String(p.programId), pending);
    if (conflict) return refuse(conflict);
    const loaded = await loadDraft(supabase, organizationId, String(p.programId));
    const refusal = programEditRefusal(
      loaded ? { status: loaded.program.status, hasDraft: loaded.draft !== null } : null,
    );
    if (refusal || !loaded?.draft) return refuse(refusal ?? "Programme introuvable.");
    const stale = staleReading(Number(p.revision), loaded.revision);
    if (stale) return refuse(stale);
    // Jours disponibles notés sur la carte : les mêmes au clic (revue du 20/11, n°4).
    const facts = await athletePlanFacts(supabase, organizationId, loaded.program.athleteId);
    if (!facts) return refuse(ATHLETE_READ_FAILED);
    p = { ...p, joursDisponibles: facts.availableDays };
    const applied = applyProgramEdits(loaded.draft, p.operations as ProgramEdit[], {
      today: todayIsoInBrussels(),
      availableDays: facts.availableDays,
    });
    if (!applied.ok) return refuse(applied.error);
    if (await hasUnknownExercise(supabase, organizationId, p.operations, loaded.draft)) {
      return refuse(UNKNOWN_EXERCISE);
    }
    const { data: athleteRow } = await supabase
      .from("athlete_profiles")
      .select("display_name")
      .eq("organization_id", organizationId)
      .eq("id", loaded.program.athleteId)
      .maybeSingle();
    Object.assign(
      names,
      editCardNames({
        title: loaded.draft.title,
        athlete: athleteRow?.display_name ?? null,
        status: loaded.program.status === "published" ? "published" : "draft",
        lines: applied.lines,
      }),
    );
  }

  if (kind === "modifier_modele") {
    // Seulement un de Mes modèles (un modèle Coory se lit seulement, comme dans l'interface).
    const template = await getProgramTemplate(organizationId, String(p.templateId));
    const refusal = templateEditRefusal(
      template ? { source: template.source, hasPlan: template.plan !== null } : null,
    );
    if (refusal || !template?.plan) return refuse(refusal ?? "Modèle introuvable.");
    const stale = staleReading(Number(p.version), template.version, "modele");
    if (stale) return refuse(stale);
    const applied = applyProgramEdits(template.plan, p.operations as ProgramEdit[]);
    if (!applied.ok) return refuse(applied.error);
    if (await hasUnknownExercise(supabase, organizationId, p.operations, template.plan)) {
      return refuse(UNKNOWN_EXERCISE);
    }
    Object.assign(
      names,
      editCardNames({
        title: template.plan.title,
        athlete: null,
        status: "template",
        lines: applied.lines,
      }),
    );
  }

  if (PROGRAM_ACTIONS.has(kind)) {
    // Lot 3b : comme les boutons du programme (un programme archivé ne fait que « Désarchiver »).
    const conflict = pendingConflict(kind, String(p.programId), pending);
    if (conflict) return refuse(conflict);
    const loaded = await loadDraft(supabase, organizationId, String(p.programId));
    const refusal = programActionRefusal(
      kind as ProgramActionKind,
      loaded
        ? {
            status: loaded.program.status,
            hasDraft: loaded.draft !== null,
            revision: loaded.revision,
            upToDate: loaded.activePublication !== null && !loaded.hasUnpublishedChanges,
          }
        : null,
    );
    if (refusal || !loaded) return refuse(refusal ?? "Programme introuvable.");
    const draft = loaded.draft;
    const { data: athleteRow } = await supabase
      .from("athlete_profiles")
      .select("display_name")
      .eq("organization_id", organizationId)
      .eq("id", loaded.program.athleteId)
      .maybeSingle();
    const athlete = athleteRow?.display_name ?? null;
    const title = draft?.title ?? loaded.program.title;
    if (kind === "publier_programme" && draft) {
      // Les MÊMES contrôles que la fenêtre « Publier » ; la révision publiée est celle lue ici.
      const checked = await checkPublication(supabase, organizationId, loaded.program.id, {
        ...loaded,
        draft,
      });
      if (!checked) return refuse("Sportif introuvable ou archivé.");
      const blocked = publicationRefusal(checked.issues);
      if (blocked) return refuse(blocked);
      p = { ...p, revision: loaded.revision };
      Object.assign(
        names,
        actionCardNames.publier({
          title,
          athlete,
          version: (loaded.activePublication?.number ?? 0) + 1,
          issues: checked.issues,
        }),
      );
    } else if (kind === "desarchiver_programme") {
      Object.assign(
        names,
        actionCardNames.desarchiver({
          title,
          athlete,
          version: loaded.activePublication?.number ?? null,
        }),
      );
    } else if (kind === "dupliquer_programme" && draft) {
      Object.assign(
        names,
        actionCardNames.dupliquer({
          title,
          athlete,
          startDate: copyStartDate(
            { startDate: draft.startDate, weeksCount: draft.weeks.length },
            todayIsoInBrussels(),
          ),
        }),
      );
    } else if (kind === "enregistrer_comme_modele" && draft) {
      Object.assign(names, actionCardNames.versModele({ title, weeks: draft.weeks.length }));
    } else if (kind === "enregistrer_seance_comme_modele" && draft) {
      const found = findSession(draft, String(p.cle));
      if (!found) {
        return refuse(
          `Séance « ${String(p.cle)} » introuvable : regarde les clés avec voir_brouillon.`,
        );
      }
      p = { ...p, revision: loaded.revision };
      Object.assign(
        names,
        actionCardNames.seanceVersModele({
          session: found.session.title,
          week: found.week.index,
          program: title,
        }),
      );
    } else {
      Object.assign(names, actionCardNames.programme({ title, athlete }));
    }
  }

  if (kind === "dupliquer_modele" || kind === "archiver_modele") {
    const template =
      p.sorte === "seance"
        ? await getSessionTemplate(organizationId, String(p.templateId))
        : await getProgramTemplate(organizationId, String(p.templateId));
    const refusal = templateActionRefusal(kind, template ? { source: template.source } : null);
    if (refusal || !template) return refuse(refusal ?? "Modèle introuvable.");
    const readable = "plan" in template ? template.plan !== null : template.session !== null;
    if (kind === "dupliquer_modele" && !readable) {
      return refuse("Ce modèle ne peut pas être lu : le coach doit l'ouvrir dans l'éditeur.");
    }
    Object.assign(
      names,
      actionCardNames.modele({ title: template.title, source: template.source }),
    );
  }

  if (kind === "creer_modele") {
    if (typeof p.depuisModele === "string") {
      const template = await getProgramTemplate(organizationId, p.depuisModele);
      if (!template?.plan) return refuse("Modèle introuvable : regarde voir_modeles.");
      names[p.depuisModele] = template.title;
    }
    // Les phases suivent la règle des plans (dans le modèle, contiguës, sans se chevaucher).
    const phases = ((p.phases as { nom: string; de: number; a: number }[] | undefined) ?? []).map(
      (phase, index) => ({
        id: `p${index + 1}`,
        name: phase.nom,
        weekFrom: phase.de,
        weekTo: phase.a,
      }),
    );
    const weeks = Array.from({ length: Number(p.semaines) }, (_, index) => ({
      index: index + 1,
      light: false,
      scheduling: "ordered" as const,
      sessions: [],
    }));
    const issue =
      phases.find((phase) => phase.weekFrom > phase.weekTo) !== undefined
        ? "Une phase va d'une semaine à une suivante."
        : planIssues({ phases, weeks })[0]?.message;
    if (issue) return refuse(issue);
  }

  if (isDailyKind(kind)) {
    const checked = await proposeDaily(organizationId, kind, p, names);
    if (!checked.ok) return refuse(checked.error);
    if (checked.params) p = { ...p, ...checked.params };
  }
  if (isReglagesKind(kind)) {
    const checked = await proposeReglages(organizationId, kind, p, names);
    if (!checked.ok) return refuse(checked.error);
    if (checked.params) p = { ...p, ...checked.params };
  }
  if (isSportifsKind(kind)) {
    const checked = await proposeSportifs(organizationId, kind, p, names, context);
    if (!checked.ok) return refuse(checked.error);
    if (checked.params) p = { ...p, ...checked.params };
  }

  const { data: organization } = await supabase
    .from("organizations")
    .select("currency")
    .eq("id", organizationId)
    .maybeSingle();
  const { title, summary } = summarize(
    { kind, params: p },
    names,
    currencyOf(organization?.currency ?? "EUR"),
  );
  return {
    ok: true,
    proposal: {
      id: randomUUID(),
      kind,
      params: p,
      title,
      summary,
      dependsOn,
      ...(links ? { links } : {}),
    },
  };
}
