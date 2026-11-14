import { groupPublishIssues, type PublishIssue } from "@/domain/training/program-publication";

import type { AssistantProposal } from "./proposals";
import { dayInWords } from "./rules";

// Assistant IA, lot 3b (D-182) : les ACTIONS sur un programme et sur les modèles (publier, archiver,
// désarchiver, dupliquer, enregistrer comme modèle), en cartes à valider. Règles PURES : quand une
// carte est refusée, et ce qu'elle dit au coach (les phrases des fenêtres de l'éditeur).

export type ProgramActionKind =
  | "publier_programme"
  | "archiver_programme"
  | "desarchiver_programme"
  | "dupliquer_programme"
  | "enregistrer_comme_modele"
  | "enregistrer_seance_comme_modele";

type ProgramState = {
  status: "draft" | "published" | "archived";
  hasDraft: boolean;
  revision: number;
  // Publié et rien de changé depuis : « Publier » ne créerait aucune version (relecture n°6).
  upToDate?: boolean;
};

// Comme l'interface : un programme archivé ne propose que « Désarchiver ».
export function programActionRefusal(
  kind: ProgramActionKind,
  program: ProgramState | null,
): string | null {
  if (!program) return "Programme introuvable : regarde voir_programmes.";
  if (kind === "desarchiver_programme") {
    return program.status === "archived" ? null : "Ce programme n'est pas archivé.";
  }
  if (program.status === "archived") {
    return "Ce programme est archivé : il faut d'abord le désarchiver (desarchiver_programme).";
  }
  if (kind === "archiver_programme") return null;
  if (!program.hasDraft) {
    return "Le brouillon de ce programme ne peut pas être lu : le coach doit l'ouvrir dans l'éditeur.";
  }
  // Révision 0 : aucun brouillon enregistré depuis la publication, rien de neuf (même règle que
  // publishProgram).
  if (kind === "publier_programme" && (program.revision === 0 || program.upToDate)) {
    return "Rien à publier : la version publiée est déjà à jour.";
  }
  return null;
}

// Relecture n°3 : dans une même réponse, une carte « Modifier le programme » et une publication (ou
// une copie) du même programme : validées dans le mauvais ordre, la publication ou la copie partirait
// SANS la modification. La seconde carte attend la réponse suivante.
const COPIES = new Set<string>([
  "publier_programme",
  "dupliquer_programme",
  "enregistrer_comme_modele",
  "enregistrer_seance_comme_modele",
]);
export function pendingConflict(
  kind: string,
  programId: string,
  pending: readonly AssistantProposal[],
): string | null {
  const same = pending.filter((card) => card.params.programId === programId);
  if (COPIES.has(kind) && same.some((card) => card.kind === "modifier_programme")) {
    return "Une carte « Modifier le programme » de ce programme attend la validation du coach : propose cette action dans ta prochaine réponse, une fois la modification validée.";
  }
  if (kind === "modifier_programme" && same.some((card) => COPIES.has(card.kind))) {
    return "Une carte de publication ou de copie de ce programme attend la validation du coach : propose la modification dans ta prochaine réponse.";
  }
  return null;
}

// Les MÊMES contrôles que la fenêtre « Publier » : un problème bloquant refuse la carte.
export function publicationRefusal(issues: PublishIssue[]): string | null {
  const blocking = groupPublishIssues(issues).filter((issue) => issue.level === "blocking");
  if (blocking.length === 0) return null;
  return `Publication impossible : ${blocking.map((issue) => issue.message).join(" ")} Corrige-le d'abord dans l'éditeur.`;
}

// Un modèle Coory se lit et se duplique ; il ne s'archive pas (il n'est pas au coach).
export function templateActionRefusal(
  kind: "dupliquer_modele" | "archiver_modele",
  template: { source: "coory" | "mine" } | null,
): string | null {
  if (!template) return "Modèle introuvable : regarde voir_modeles.";
  if (kind === "archiver_modele" && template.source === "coory") {
    return "Un modèle Coory ne s'archive pas : il n'est pas dans Mes modèles.";
  }
  return null;
}

// --- Ce que montre la carte (résolu par le serveur, lu par summarize) ----------------------------
const quoted = (title: string) => `« ${title} »`;
const withAthlete = (title: string, athlete: string | null) =>
  [quoted(title), athlete].filter(Boolean).join(" · ");

export const actionCardNames = {
  publier(card: {
    title: string;
    athlete: string | null;
    version: number;
    issues: PublishIssue[];
  }): Record<string, string> {
    const names: Record<string, string> = {
      ligne: [quoted(card.title), `version ${card.version}`, card.athlete]
        .filter(Boolean)
        .join(" · "),
    };
    groupPublishIssues(card.issues)
      .filter((issue) => issue.level === "warning")
      .forEach((issue, index) => {
        names[`attention:${index}`] = `Attention : ${issue.message}`;
      });
    return names;
  },
  programme(card: { title: string; athlete: string | null }): Record<string, string> {
    return { ligne: withAthlete(card.title, card.athlete) };
  },
  desarchiver(card: {
    title: string;
    athlete: string | null;
    version: number | null;
  }): Record<string, string> {
    return {
      ligne: withAthlete(card.title, card.athlete),
      etat:
        card.version === null
          ? "Il redevient un brouillon"
          : `Il redevient publié (version ${card.version})`,
    };
  },
  dupliquer(card: {
    title: string;
    athlete: string | null;
    startDate: string;
  }): Record<string, string> {
    return {
      ligne: withAthlete(`${card.title} (copie)`.slice(0, 120), card.athlete),
      debut: `Nouveau brouillon dès le ${dayInWords(card.startDate)}`,
    };
  },
  versModele(card: { title: string; weeks: number }): Record<string, string> {
    return {
      depuis: `Depuis ${quoted(card.title)} : ${card.weeks} semaine${card.weeks > 1 ? "s" : ""}, sans sportif ni dates`,
    };
  },
  seanceVersModele(card: {
    session: string;
    week: number;
    program: string;
  }): Record<string, string> {
    return {
      depuis: `Depuis ${quoted(card.session)}, semaine ${card.week} de ${quoted(card.program)}`,
    };
  },
  modele(card: { title: string; source: "coory" | "mine" }): Record<string, string> {
    return {
      ligne: `${quoted(card.title)} · ${card.source === "coory" ? "modèle Coory" : "Mes modèles"}`,
    };
  },
};
