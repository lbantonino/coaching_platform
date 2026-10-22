import {
  consentEventLabel,
  type CoachProof,
  type ConsentAction,
  type ConsentSource,
} from "@/features/consents/schemas";
import { goalTypeLabels, type GoalStatus, type GoalType } from "@/features/goals/schemas";
import type { NoteVisibility } from "@/features/notes/schemas";
import { formatReferenceValue } from "@/features/references/format";
import { referenceKindLabels, type ReferenceKind } from "@/features/references/schemas";
import { formatDate } from "@/lib/format";

// Historique d'une fiche (P2-04 étape 2) : une frise construite UNIQUEMENT à partir d'événements réels
// déjà enregistrés (création, objectifs, mesures, accords, invitations, notes). Rien n'est stocké en double.
// Fonction pure : testable sans base de données.

export type ActivityKind =
  | "profile"
  | "goal"
  | "goal_achieved"
  | "goal_dropped"
  | "reference"
  | "consent"
  | "invite"
  | "account"
  | "note";

export type ActivityEvent = {
  id: string;
  kind: ActivityKind;
  at: string;
  title: string;
  detail: string | null;
};

export type ActivitySources = {
  profile: { id: string; createdAt: string };
  goals: {
    id: string;
    type: GoalType;
    competitionName: string | null;
    status: GoalStatus;
    createdAt: string;
    updatedAt: string;
  }[];
  references: {
    id: string;
    kind: ReferenceKind;
    paceMin: number | null;
    paceMax: number | null;
    bpm: number | null;
    exercise: string | null;
    loadKg: number | null;
    reps: number | null;
    measuredOn: string;
    createdAt: string;
  }[];
  consents: {
    id: string;
    action: ConsentAction;
    source: ConsentSource;
    proof: CoachProof | null;
    recordedAt: string;
  }[];
  invites: { id: string; createdAt: string; acceptedAt: string | null; revokedAt: string | null }[];
  notes: { visibility: NoteVisibility; updatedAt: string }[];
};

export function buildActivity(sources: ActivitySources): ActivityEvent[] {
  const events: ActivityEvent[] = [
    {
      id: `profile-${sources.profile.id}`,
      kind: "profile",
      at: sources.profile.createdAt,
      title: "Fiche créée",
      detail: null,
    },
  ];

  for (const goal of sources.goals) {
    const name = goal.competitionName ?? goalTypeLabels[goal.type];
    events.push({
      id: `goal-${goal.id}`,
      kind: "goal",
      at: goal.createdAt,
      title: `Objectif créé : ${name}`,
      detail: goal.competitionName ? goalTypeLabels[goal.type] : null,
    });
    // Un objectif clos ne change plus : sa dernière mise à jour est la date de clôture.
    if (goal.status !== "active") {
      const achieved = goal.status === "achieved";
      events.push({
        id: `goal-closed-${goal.id}`,
        kind: achieved ? "goal_achieved" : "goal_dropped",
        at: goal.updatedAt,
        title: `${achieved ? "Objectif atteint" : "Objectif abandonné"} : ${name}`,
        detail: null,
      });
    }
  }

  for (const reference of sources.references) {
    events.push({
      id: `reference-${reference.id}`,
      kind: "reference",
      at: reference.createdAt,
      title: `Mesure ajoutée : ${referenceKindLabels[reference.kind]}`,
      detail: [
        formatReferenceValue(reference),
        reference.exercise,
        `mesurée le ${formatDate(reference.measuredOn)}`,
      ]
        .filter(Boolean)
        .join(" · "),
    });
  }

  for (const consent of sources.consents) {
    events.push({
      id: `consent-${consent.id}`,
      kind: "consent",
      at: consent.recordedAt,
      title: consentEventLabel(consent.action, consent.source, consent.proof),
      detail: "Contraintes physiques (données de santé)",
    });
  }

  for (const invite of sources.invites) {
    events.push({
      id: `invite-${invite.id}`,
      kind: "invite",
      at: invite.createdAt,
      title: "Lien d'invitation créé",
      detail: "Accès à l'espace sportif",
    });
    if (invite.acceptedAt) {
      events.push({
        id: `invite-accepted-${invite.id}`,
        kind: "account",
        at: invite.acceptedAt,
        title: "Compte activé par le sportif",
        detail: null,
      });
    }
    if (invite.revokedAt) {
      events.push({
        id: `invite-revoked-${invite.id}`,
        kind: "invite",
        at: invite.revokedAt,
        title: "Lien d'invitation révoqué",
        detail: null,
      });
    }
  }

  for (const note of sources.notes) {
    events.push({
      id: `note-${note.visibility}`,
      kind: "note",
      at: note.updatedAt,
      title:
        note.visibility === "coach" ? "Note privée mise à jour" : "Message au sportif mis à jour",
      detail: null,
    });
  }

  // Le plus récent d'abord (dates comparées en valeur, quel que soit leur format d'écriture).
  return events.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}
