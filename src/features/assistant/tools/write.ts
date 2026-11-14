import "server-only";

import { randomUUID } from "node:crypto";

import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

import { currencyOf, formatMoney } from "@/domain/billing/money";
import { formatBytes } from "@/domain/documents/documents";
import { EQUIPMENT_KEYS } from "@/domain/exercises/vocabulary";
import { SESSION_MOMENTS, sessionBodySchema, WEEKDAYS } from "@/domain/training/session-v2";
import { getAthlete } from "@/features/athletes/queries";
import { addressSchema, athleteUpdateSchema } from "@/features/athletes/schemas";
import { loadDraft } from "@/features/programs/drafts";
import { listAthleteProgramRows } from "@/features/programs/queries";
import { getProgramTemplate } from "@/features/programs/templates";
import { getSession } from "@/features/sessions/queries";
import { sessionAmountCents } from "@/features/sessions/schemas";
import { todayIsoInBrussels } from "@/lib/format";

import { dayInWords, type AssistantAttachment } from "../rules";
import { createClient } from "@/lib/supabase/server";

import { athleteFormValues, checkAgainstSession, formRuleError } from "../form-data";
import { withSourceRhythm } from "../program";
import {
  ACTION_KINDS,
  athleteFieldText,
  pdfRefusal,
  prepareToolInput,
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
    "Propose un BROUILLON de programme pour un sportif (jamais publié : le coach le relit et le publie dans l'éditeur).",
    "Avant : chercher_sportifs, voir_programmes (choisis un début LUNDI après la fin de son dernier programme), voir_modeles.",
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
        description: "ordered : dans l'ordre, le sportif choisit le jour ; fixed : jours fixés.",
      },
      goal: {
        type: "object",
        properties: {
          raceName: { type: "string" },
          raceDate: date,
          hyroxDivision: { type: "string" },
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

export const WRITE_TOOL_NAMES = new Set<string>(ACTION_KINDS);

// Identifiants d'exercices cités dans des séances écrites (à vérifier dans la Bibliothèque).
function exerciseIds(value: unknown, found = new Set<string>()): Set<string> {
  if (Array.isArray(value)) value.forEach((item) => exerciseIds(item, found));
  else if (value && typeof value === "object") {
    for (const [key, inner] of Object.entries(value)) {
      if (key === "exerciseId" && typeof inner === "string") found.add(inner);
      else exerciseIds(inner, found);
    }
  }
  return found;
}

const DAY_MS = 86_400_000;
const isoPlus = (day: string, days: number) =>
  new Date(Date.parse(`${day}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);

type Proposed = { ok: true; proposal: AssistantProposal } | { ok: false; error: string };
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
    // Lot 2 : le sportif d'un document ou d'une fiche à compléter.
    ...(typeof p.athleteId === "string" ? [p.athleteId] : []),
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
    // Seulement un programme de l'organisation, publié : les PDF viennent de sa dernière version.
    const { data: program } = await supabase
      .from("programs")
      .select(
        "id, title, athlete_profiles ( display_name ), program_publications!programs_active_publication_fkey ( number, published_at )",
      )
      .eq("organization_id", organizationId)
      .eq("id", String(p.programId))
      .maybeSingle();
    const publication = program?.program_publications ?? null;
    const refusal = pdfRefusal(program ? { published: publication !== null } : null);
    if (refusal || !program || !publication) return refuse(refusal ?? "Programme introuvable.");
    names[program.id] = program.title;
    names.sportif = program.athlete_profiles?.display_name ?? "";
    names.version = `Version ${publication.number} publiée le ${dayInWords(
      publication.published_at.slice(0, 10),
    )}`;
    const pdf = `/coach/o/${organizationId}/programmes/${program.id}/pdf`;
    links = [
      { label: "Agenda du programme", href: `${pdf}/agenda` },
      { label: "Fiches et repères", href: `${pdf}/fiches` },
    ];
  }

  if (kind === "creer_exercice") {
    // Doublon possible : un exercice du coach au même nom (sans casse). La carte le dit ; le coach décide.
    const { data } = await supabase
      .from("exercises")
      .select("id")
      .eq("organization_id", organizationId)
      .is("archived_at", null)
      // Nom exact sans casse : « % » et « _ » d'un nom ne sont pas des jokers.
      .ilike(
        "name_fr",
        String(p.name)
          .trim()
          .replace(/[\\%_]/g, (char) => `\\${char}`),
      )
      .limit(1);
    if ((data ?? []).length > 0) names.doublon = "oui";
  }

  if (kind === "completer_fiche") {
    // La fiche doit être de l'organisation et active ; le résultat passe par les MÊMES règles que le
    // formulaire Profil (schémas de la fiche et de l'adresse), sur la fiche complète.
    const detail = await getAthlete(organizationId, String(p.athleteId));
    if (!detail || detail.status === "archived") {
      return refuse("Sportif introuvable ou archivé : cherche-le avec chercher_sportifs.");
    }
    const changes = p.changes as Record<string, string | string[]>;
    if (changes.email !== undefined && detail.hasAccount) {
      return refuse(
        "Le sportif a activé son compte : son adresse e-mail ne peut plus être modifiée ici.",
      );
    }
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
    for (const field of Object.keys(changes)) {
      names[`avant:${field}`] = athleteFieldText(field, current[field]);
    }
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
      if (!source?.draft || source.program.athleteId !== athleteId) {
        return refuse("Programme à copier introuvable parmi ceux de ce sportif.");
      }
      names[start.programId] = source.program.title;
      p = withSourceRhythm(p, source.draft);
    }
    const ids = [...exerciseIds(p.seances)];
    if (ids.length > 0) {
      const { data } = await supabase.from("exercises").select("id").in("id", ids);
      if ((data ?? []).length !== ids.length) {
        return refuse("Exercice introuvable : prends les id donnés par chercher_exercices.");
      }
    }
    // Un brouillon peut chevaucher un programme publié, mais il ne pourra pas être publié tel quel :
    // la carte le dit (comme l'assistant de création).
    const from = String(p.startDate);
    const to = isoPlus(from, Number(p.weeksCount) * 7);
    const clash = rows.find(
      (row) =>
        row.status === "published" &&
        row.startDate < to &&
        from < isoPlus(row.startDate, row.weeksCount * 7),
    );
    if (clash) {
      names.chevauchement = `Attention : chevauche « ${clash.title} », publié jusqu'au ${dayInWords(
        isoPlus(clash.startDate, clash.weeksCount * 7 - 1),
      )}.`;
    }
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
