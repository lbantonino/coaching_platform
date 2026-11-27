"use server";

import { revalidatePath } from "next/cache";

import { updateAthlete } from "@/features/athletes/actions";
import { insertAthlete } from "@/features/athletes/create-athlete";
import { getAthlete } from "@/features/athletes/queries";
import { requireOrgAccess } from "@/features/auth/guards";
import { parseCoachExerciseForm } from "@/domain/exercises/coach-exercise";
import { insertCoachExercise } from "@/features/exercises/create-exercise";
import { createExpense } from "@/features/billing/expense-actions";
import { createPayment } from "@/features/billing/payment-actions";
import { createSession, markSessionPaid, moveSession } from "@/features/sessions/actions";
import { findSession } from "@/domain/training/plan-edit";
import type { Weekday } from "@/domain/training/session-v2";
import {
  archiveProgram,
  archiveTemplate,
  createProgram,
  createProgramTemplate,
  duplicateProgram,
  duplicateTemplate,
  publishProgram,
  saveDraft,
  saveProgramAsTemplate,
  saveSessionAsTemplate,
  unarchiveProgram,
  updateTemplate,
} from "@/features/programs/actions";
import { loadDraft } from "@/features/programs/drafts";
import { aimFor } from "@/features/programs/template-use";
import { getProgramTemplate } from "@/features/programs/templates";
import { uploadDocument } from "@/features/documents/actions";
import { uploadAthletePhoto, uploadCoachPhoto } from "@/features/photos/actions";
import { createTask, createTaskList } from "@/features/tasks/actions";
import { todayIsoInBrussels } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

import { executeDaily } from "./execute-daily";
import { executeReglages } from "./execute-reglages";
import { executeSportifs } from "./execute-sportifs";
import {
  ATHLETE_READ_FAILED,
  athletePlanFacts,
  hasUnknownExercise,
  UNKNOWN_EXERCISE,
} from "./exercise-check";
import {
  athleteFormValues,
  athleteUpdateFormData,
  requireResolved,
  toCoachExerciseInput,
  toFormData,
  toNewAthleteValues,
} from "./form-data";
import { cardAvailableDays, customDraftFrom, toCreateProgramInput } from "./program";
import { programActionRefusal } from "./program-actions";
import {
  applyProgramEdits,
  changedSinceProposal,
  programEditRefusal,
  revisionConflict,
  templateEditRefusal,
} from "./program-edit";
import { assistantActionSchema, staleAthleteFields } from "./proposals";

// Clic « Valider » sur une carte de l'Assistant IA (lot 1 des actions, spec §5.2). N'appelle JAMAIS
// Claude (aucun coût, aucune demande décomptée). Ne fait aucune confiance à la carte : accès à
// l'organisation, schéma strict, puis la MÊME logique que le formulaire habituel, qui revérifie elle
// aussi l'appartenance de chaque identifiant (sportif, séance, liste, catégorie) et ses règles.
export type ExecuteResult =
  { ok: true; href: string; createdAthleteId?: string } | { ok: false; error: string };

const fail = (error: string): ExecuteResult => ({ ok: false, error });
const INVALID = "Cette action n'est pas valable. Redemande-la à l'assistant.";
// L'éditeur ouvert sur la première semaine touchée (sans semaine : en haut du programme).
const onWeek = (path: string, weeks: number[]) =>
  weeks[0] !== undefined ? `${path}?semaine=${weeks[0]}` : path;
const blank = { error: null, attempt: 0, values: null } as const;
// Jours disponibles au clic (revue du 20/11, n°3 et n°4) : ceux notés sur la carte, que le coach a
// lue ; une carte d'avant relit la fiche. Pas d'enjeu de droits : ce ne sont que des jours PROPOSÉS,
// que le coach peut de toute façon choisir dans l'éditeur. null si la fiche n'a pas pu être lue.
async function clickAvailableDays(
  params: object,
  orgId: string,
  athleteId: string | null,
): Promise<readonly Weekday[] | null> {
  const noted = params as Record<string, unknown>;
  if (Array.isArray(noted.joursDisponibles)) return cardAvailableDays(noted, []);
  const facts = await athletePlanFacts(await createClient(), orgId, athleteId);
  return facts ? facts.availableDays : null;
}

export async function executeAssistantAction(
  organizationId: string,
  input: unknown,
): Promise<ExecuteResult> {
  const { user, membership } = await requireOrgAccess(organizationId);
  const orgId = membership.organizationId;
  const parsed = assistantActionSchema.safeParse(input);
  if (!parsed.success) return fail("Cette action n'est pas valable. Redemande-la à l'assistant.");
  const action = parsed.data;
  if (!requireResolved(action)) {
    return fail("Le sportif de cette carte n'est pas encore créé : valide d'abord sa fiche.");
  }
  const base = `/coach/o/${orgId}`;

  switch (action.kind) {
    case "creer_sportif": {
      const created = await insertAthlete(orgId, user.id, toNewAthleteValues(action.params));
      if (!created.ok) return fail(created.error);
      revalidatePath(`${base}/sportifs`, "layout");
      return {
        ok: true,
        href: `${base}/sportifs/${created.id}${created.incomplete ? "?creation=incomplete" : ""}`,
        createdAthleteId: created.id,
      };
    }
    case "creer_seance": {
      const state = await createSession(orgId, blank, toFormData(action));
      if (state.error || !state.created)
        return fail(state.error ?? "La séance n'a pas pu être créée.");
      return {
        ok: true,
        href: `${base}/agenda/seances/${state.created.id}?date=${action.params.startsOn}`,
      };
    }
    case "deplacer_seance": {
      const { sessionId, originalDate, newDate, newTime, scope } = action.params;
      const moved = await moveSession(orgId, { sessionId, originalDate, newDate, newTime, scope });
      if (!moved.ok) return fail(moved.error ?? "La séance n'a pas pu être déplacée.");
      return { ok: true, href: `${base}/agenda/seances/${sessionId}?date=${newDate}` };
    }
    case "marquer_seance_payee": {
      const { sessionId, sessionDate } = action.params;
      const paid = await markSessionPaid(orgId, sessionId, sessionDate);
      if (!paid.ok) return fail("Cette date n'a pas pu être marquée payée.");
      return { ok: true, href: `${base}/agenda/seances/${sessionId}?date=${sessionDate}` };
    }
    case "noter_paiement": {
      const state = await createPayment(orgId, { ...blank, saved: false }, toFormData(action));
      if (!state.saved) return fail(state.error ?? "Le paiement n'a pas pu être enregistré.");
      return { ok: true, href: "/coach/comptabilite" };
    }
    case "noter_depense": {
      const state = await createExpense(orgId, { ...blank, saved: false }, toFormData(action));
      if (!state.saved) return fail(state.error ?? "La dépense n'a pas pu être enregistrée.");
      return { ok: true, href: "/coach/comptabilite" };
    }
    case "creer_tache": {
      const state = await createTask(orgId, { ...blank, saved: false }, toFormData(action));
      if (!state.saved) return fail(state.error ?? "La tâche n'a pas pu être créée.");
      return { ok: true, href: "/coach/taches" };
    }
    case "importer_document":
      // Lot 2 : le fichier vient du navigateur, par executeDocumentImport (ci-dessous).
      return fail("Joins à nouveau le fichier, puis redemande à l'assistant.");
    case "preparer_pdf":
      // Lot 2 : la carte donne les liens des PDF ; il n'y a rien à exécuter.
      return fail("Rien à valider : ouvre le PDF depuis la carte.");
    case "creer_exercice": {
      // Lot 2 : les MÊMES règles et le MÊME enregistrement que « Créer un exercice » (sans photo).
      const parsedForm = parseCoachExerciseForm(toCoachExerciseInput(action.params));
      if (!parsedForm.ok) return fail(parsedForm.error);
      const created = await insertCoachExercise(orgId, user.id, parsedForm.values);
      if (!created.ok) return fail(created.error);
      revalidatePath("/coach/bibliotheque", "layout");
      return { ok: true, href: `/coach/bibliotheque/${created.id}` };
    }
    case "completer_fiche": {
      // Lot 2 : le formulaire Profil COMPLET (fiche actuelle + champs de la carte), par updateAthlete.
      const current = await getAthlete(orgId, action.params.athleteId);
      if (!current || current.status === "archived") return fail("Sportif introuvable ou archivé.");
      // Une saisie du coach entre la carte et le clic n'est jamais écrasée (relecture du lot 2, n°d).
      const stale = staleAthleteFields(
        action.params.avant,
        athleteFormValues(current) as Record<string, unknown>,
      );
      if (stale) return fail(stale);
      const state = await updateAthlete(
        orgId,
        current.id,
        { error: null, saved: false, attempt: 0, values: null },
        athleteUpdateFormData(athleteFormValues(current), action.params.changes),
      );
      if (!state.saved) return fail(state.error ?? "La fiche n'a pas pu être complétée.");
      return { ok: true, href: `${base}/sportifs/${current.id}?onglet=profil` };
    }
    case "creer_liste_de_taches": {
      const list = await createTaskList(orgId, action.params.name);
      if (!list.ok) return fail(list.error ?? "La liste n'a pas pu être créée.");
      return { ok: true, href: "/coach/taches" };
    }
    case "modifier_programme": {
      // Lot 3b : le brouillon RELU au clic ; une autre révision que celle de la carte = refus, rien
      // n'est écrit. Puis les MÊMES fonctions que l'éditeur et le MÊME enregistrement (saveDraft, qui
      // revérifie la révision dans la base). Programme publié : seul son brouillon change.
      const { programId, revision, operations } = action.params;
      const loaded = await loadDraft(await createClient(), orgId, programId);
      const refusal = programEditRefusal(
        loaded ? { status: loaded.program.status, hasDraft: loaded.draft !== null } : null,
      );
      if (refusal || !loaded?.draft) return fail(refusal ?? "Programme introuvable.");
      const conflict = revisionConflict(revision, loaded.revision);
      if (conflict) return fail(conflict);
      // Jours proposés en jours fixes : ceux notés sur la carte (revue du 20/11, n°4), sinon (carte
      // d'avant) les disponibilités relues du sportif.
      const availableDays = await clickAvailableDays(
        action.params,
        orgId,
        loaded.program.athleteId,
      );
      if (!availableDays) return fail(ATHLETE_READ_FAILED);
      const applied = applyProgramEdits(loaded.draft, operations, {
        today: todayIsoInBrussels(),
        availableDays,
      });
      if (!applied.ok) return fail(applied.error);
      if (await hasUnknownExercise(await createClient(), orgId, operations, loaded.draft)) {
        return fail(UNKNOWN_EXERCISE);
      }
      const saved = await saveDraft(orgId, programId, revision, applied.plan);
      if (!saved.ok) {
        return fail(saved.code === "REVISION_CONFLICT" ? changedSinceProposal() : saved.message);
      }
      const path = `${base}/programmes/${programId}`;
      revalidatePath(path, "layout");
      revalidatePath(`${base}/sportifs/${loaded.program.athleteId}`);
      return { ok: true, href: onWeek(path, applied.weeks) };
    }
    case "modifier_modele": {
      // Lot 3b : un de Mes modèles, à la version de la carte (updateTemplate la revérifie aussi).
      const { templateId, version, operations } = action.params;
      const template = await getProgramTemplate(orgId, templateId);
      const refusal = templateEditRefusal(
        template ? { source: template.source, hasPlan: template.plan !== null } : null,
      );
      if (refusal || !template?.plan) return fail(refusal ?? "Modèle introuvable.");
      const conflict = revisionConflict(version, template.version, "modele");
      if (conflict) return fail(conflict);
      const applied = applyProgramEdits(template.plan, operations);
      if (!applied.ok) return fail(applied.error);
      if (await hasUnknownExercise(await createClient(), orgId, operations, template.plan)) {
        return fail(UNKNOWN_EXERCISE);
      }
      const saved = await updateTemplate(orgId, "program", templateId, version, applied.plan);
      if (!saved.ok) {
        return fail(
          saved.code === "REVISION_CONFLICT" ? changedSinceProposal("modele") : saved.message,
        );
      }
      return { ok: true, href: onWeek(`${base}/programmes/modeles/${templateId}`, applied.weeks) };
    }
    // Lot 3b : les actions d'un programme. Le programme est RELU (un programme archivé entre-temps ne
    // fait plus que « Désarchiver »), puis l'action du bouton de l'éditeur fait le travail, avec ses
    // propres contrôles (organisation, état, révision, publication).
    case "publier_programme":
    case "archiver_programme":
    case "desarchiver_programme":
    case "dupliquer_programme":
    case "enregistrer_comme_modele":
    case "enregistrer_seance_comme_modele": {
      const { programId } = action.params;
      const loaded = await loadDraft(await createClient(), orgId, programId);
      const refusal = programActionRefusal(
        action.kind,
        loaded
          ? {
              status: loaded.program.status,
              hasDraft: loaded.draft !== null,
              revision: loaded.revision,
              upToDate: loaded.activePublication !== null && !loaded.hasUnpublishedChanges,
            }
          : null,
      );
      if (refusal || !loaded) return fail(refusal ?? "Programme introuvable.");
      const editor = `${base}/programmes/${programId}`;
      switch (action.kind) {
        case "publier_programme": {
          const { revision } = action.params;
          if (revision === undefined) return fail(INVALID);
          const published = await publishProgram(orgId, programId, revision);
          if (!published.ok) {
            return fail(
              published.code === "REVISION_CONFLICT" ? changedSinceProposal() : published.message,
            );
          }
          revalidatePath(`${base}/sportifs/${loaded.program.athleteId}`);
          return { ok: true, href: editor };
        }
        case "archiver_programme": {
          const archived = await archiveProgram(orgId, programId);
          if (!archived.ok) return fail(archived.message);
          return { ok: true, href: `${base}/programmes` };
        }
        case "desarchiver_programme": {
          const restored = await unarchiveProgram(orgId, programId);
          if (!restored.ok) return fail(restored.message);
          return { ok: true, href: editor };
        }
        case "dupliquer_programme": {
          const copied = await duplicateProgram(orgId, programId);
          if (!copied.ok) return fail(copied.message);
          return { ok: true, href: `${base}/programmes/${copied.programId}` };
        }
        case "enregistrer_comme_modele": {
          const saved = await saveProgramAsTemplate(orgId, programId, action.params.titre);
          if (!saved.ok) return fail(saved.message);
          return { ok: true, href: `${base}/programmes/modeles/${saved.templateId}` };
        }
        case "enregistrer_seance_comme_modele": {
          // La séance telle que la carte l'a lue : même révision du brouillon.
          const { revision, cle, titre } = action.params;
          if (revision === undefined || !loaded.draft) return fail(INVALID);
          const conflict = revisionConflict(revision, loaded.revision);
          if (conflict) return fail(conflict);
          const found = findSession(loaded.draft, cle);
          if (!found) return fail("Cette séance n'est plus dans le programme.");
          const saved = await saveSessionAsTemplate(orgId, found.session, titre);
          if (!saved.ok) return fail(saved.message);
          return { ok: true, href: `${base}/programmes/modeles/${saved.templateId}` };
        }
      }
      return fail(INVALID);
    }
    case "dupliquer_modele": {
      const sorte = action.params.sorte === "seance" ? "session" : "program";
      const copied = await duplicateTemplate(orgId, sorte, action.params.templateId);
      if (!copied.ok) return fail(copied.message);
      return { ok: true, href: `${base}/programmes/modeles/${copied.templateId}` };
    }
    case "archiver_modele": {
      // archiveTemplate ne touche qu'aux modèles de l'organisation (jamais un modèle Coory).
      const sorte = action.params.sorte === "seance" ? "session" : "program";
      const archived = await archiveTemplate(orgId, sorte, action.params.templateId);
      if (!archived.ok) return fail(archived.message);
      return { ok: true, href: `${base}/programmes?onglet=modeles` };
    }
    case "creer_modele": {
      // La MÊME création que l'assistant « Créer un modèle » ; sans sportif, la façon de viser par
      // défaut de l'assistant (aimFor).
      const p = action.params;
      const created = await createProgramTemplate(orgId, {
        title: p.titre,
        discipline: p.discipline,
        aimDefaults: aimFor(undefined),
        weeksCount: p.semaines,
        sessionsPerWeek: p.seancesParSemaine,
        phases: (p.phases ?? []).map((phase) => ({
          name: phase.nom,
          weekFrom: phase.de,
          weekTo: phase.a,
        })),
        scheduling: p.organisation ?? "ordered",
        start: p.depuisModele
          ? { kind: "template", templateId: p.depuisModele }
          : { kind: "blank" },
      });
      if (!created.ok) return fail(created.message);
      return { ok: true, href: `${base}/programmes/modeles/${created.templateId}` };
    }
    // Lot 4 (D-183) : le quotidien, par execute-daily.ts (server-only), après requireOrgAccess.
    case "modifier_seance_agenda":
    case "supprimer_seance_agenda":
    case "marquer_seance_non_payee":
    case "supprimer_paiement":
    case "supprimer_depense":
    case "arreter_depense":
    case "categorie_depenses":
    case "cocher_tache":
    case "modifier_tache":
    case "supprimer_tache":
    case "supprimer_taches_terminees":
    case "modifier_liste_de_taches":
    case "supprimer_liste_de_taches":
    case "modifier_document":
    case "supprimer_document":
    case "categorie_documents":
      return executeDaily(orgId, user.id, action);
    // Lot 5 (D-184) : les sportifs, par execute-sportifs.ts (server-only), après requireOrgAccess.
    case "statut_sportif":
    case "discipline_sportif":
    case "disponibilites":
    case "ajouter_objectif":
    case "modifier_objectif":
    case "statut_objectif":
    case "supprimer_objectif":
    case "ajouter_repere":
    case "reperes_depuis_test":
    case "supprimer_repere":
    case "ajouter_record":
    case "supprimer_record":
    case "favori_exercice":
    case "modifier_exercice":
    case "supprimer_exercice":
    case "photo":
    case "ajouter_note":
      return executeSportifs(orgId, action);
    // Lot 6 (D-185) : les réglages, par execute-reglages.ts (server-only), après requireOrgAccess.
    case "modifier_profil":
    case "nom_organisation":
    case "pays_organisation":
    case "devise_organisation":
    case "preferences":
    case "preference_notification":
    case "notifications":
      return executeReglages(orgId, action);
    case "creer_programme": {
      // Lot 3a : la MÊME création que l'assistant « Créer un programme » (brouillon, jamais publié),
      // puis, pour un programme écrit, le MÊME enregistrement que l'éditeur.
      const params = action.params as Record<string, unknown>;
      const athleteId = String((params.athlete as { athleteId: string }).athleteId);
      // Exercices revérifiés au clic : la carte vient du navigateur (relecture du lot 3a, n°6).
      if (await hasUnknownExercise(await createClient(), orgId, params.seances)) {
        return fail(UNKNOWN_EXERCISE);
      }
      const created = await createProgram(orgId, toCreateProgramInput(params, athleteId));
      if (!created.ok) return fail(created.message);
      const href = `${base}/programmes/${created.programId}`;
      if (!params.seances) return { ok: true, href };
      // Relecture du lot 3a, n°14 : même une erreur imprévue (lecture du brouillon) ne laisse pas de
      // programme vide en plan.
      let custom: ReturnType<typeof customDraftFrom> | null = null;
      let saved: Awaited<ReturnType<typeof saveDraft>> | null = null;
      try {
        const supabase = await createClient();
        const loaded = await loadDraft(supabase, orgId, created.programId);
        const availableDays = await clickAvailableDays(params, orgId, athleteId);
        custom =
          loaded?.draft && availableDays
            ? customDraftFrom(loaded.draft, params, availableDays)
            : availableDays
              ? null
              : { ok: false, error: ATHLETE_READ_FAILED };
        saved =
          loaded && custom?.ok
            ? await saveDraft(orgId, created.programId, loaded.revision, custom.draft)
            : null;
      } catch {
        saved = null;
      }
      if (!saved?.ok) {
        // Pas de programme vide laissé en plan : le brouillon à peine créé est archivé.
        await archiveProgram(orgId, created.programId);
        return fail(
          saved?.message ??
            (custom && !custom.ok ? custom.error : "Les séances n'ont pas pu être enregistrées."),
        );
      }
      return { ok: true, href };
    }
  }
}

// « Valider » une carte qui part avec le fichier JOINT, resté dans le navigateur : « Importer un
// document » (lot 2, D-181) ou « Photo » mettre (lot 5, D-184). Le fichier arrive ici avec la sorte de
// carte (`kind`) et ses paramètres (`params`, en JSON). Aucune confiance : accès, schéma strict, puis
// le MÊME dépôt que la page habituelle (taille, format, sportif de l'organisation, compte de
// démonstration refusé).
export async function executeWithFile(
  organizationId: string,
  formData: FormData,
): Promise<ExecuteResult> {
  const { membership } = await requireOrgAccess(organizationId);
  const orgId = membership.organizationId;
  let raw: unknown = null;
  try {
    raw = JSON.parse(String(formData.get("params") ?? "null"));
  } catch {
    raw = null;
  }
  const kind = formData.get("kind") === "photo" ? "photo" : "importer_document";
  const parsed = assistantActionSchema.safeParse({ kind, params: raw });
  if (!parsed.success) return fail("Cette action n'est pas valable. Redemande-la à l'assistant.");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return fail("Joins à nouveau le fichier, puis redemande à l'assistant.");
  }
  if (parsed.data.kind === "photo") {
    if (parsed.data.params.action !== "mettre") return fail(INVALID);
    const photo = new FormData();
    photo.set("photo", file);
    const state = { error: null, saved: false, attempt: 0 };
    const athleteId = parsed.data.params.athleteId;
    const saved = athleteId
      ? await uploadAthletePhoto(orgId, athleteId, state, photo)
      : await uploadCoachPhoto(state, photo);
    if (!saved.saved) return fail(saved.error ?? "La photo n'a pas pu être enregistrée.");
    return {
      ok: true,
      href: athleteId ? `/coach/o/${orgId}/sportifs/${athleteId}?onglet=profil` : "/coach",
    };
  }
  if (parsed.data.kind !== "importer_document") return fail(INVALID);
  const form = new FormData();
  form.set("name", parsed.data.params.name);
  form.set("categoryId", parsed.data.params.categoryId ?? "");
  form.set("athleteId", parsed.data.params.athleteId ?? "");
  form.set("file", file);
  const state = await uploadDocument(
    orgId,
    { error: null, attempt: 0, values: null, saved: false },
    form,
  );
  if (!state.saved) return fail(state.error ?? "Le document n'a pas pu être enregistré.");
  return {
    ok: true,
    href: parsed.data.params.athleteId
      ? `/coach/o/${orgId}/sportifs/${parsed.data.params.athleteId}?onglet=documents`
      : "/coach/documents",
  };
}
