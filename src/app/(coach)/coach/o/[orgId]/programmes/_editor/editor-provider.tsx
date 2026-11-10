"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { ProgramDraft, ProgramPlan } from "@/domain/training/program-plan";
import { saveDraft, updateTemplate } from "@/features/programs/actions";

// État partagé de l'éditeur de programme (03, D-157) : le plan en cours, son enregistrement automatique
// (« Enregistré »), et ce que l'en-tête et le contenu ont besoin de savoir l'un de l'autre. Le plan est
// UN document : chaque modification l'envoie en entier avec son numéro de révision ; si quelqu'un l'a
// modifié ailleurs entre-temps, le serveur refuse au lieu d'écraser (« conflit »).

export type SaveStatus = "saved" | "saving" | "error" | "conflict";

export type EditorTarget =
  { kind: "program"; programId: string } | { kind: "template"; templateId: string };

type EditorValue<P extends ProgramPlan | ProgramDraft = ProgramPlan | ProgramDraft> = {
  organizationId: string;
  target: EditorTarget;
  readOnly: boolean;
  plan: P;
  // Remplace le plan et programme l'enregistrement (700 ms après la dernière modification).
  update: (change: (plan: P) => P) => void;
  status: SaveStatus;
  // Révision du brouillon (programme) ou version (modèle) actuellement enregistrée.
  revision: number;
  // La même, lue au moment de l'appel (après un flush, avant le rendu suivant) : publier envoie
  // toujours la révision qui vient d'être enregistrée.
  currentRevision: () => number;
  // Enregistre tout de suite ce qui attend (avant de publier ou d'ouvrir une séance).
  flush: () => Promise<boolean>;
  retry: () => void;
};

const EditorContext = createContext<EditorValue | null>(null);

export function useEditor<P extends ProgramPlan | ProgramDraft = ProgramDraft>(): EditorValue<P> {
  const value = useContext(EditorContext);
  if (!value) throw new Error("useEditor hors de EditorProvider");
  return value as unknown as EditorValue<P>;
}

// À monter avec une clé qui contient la révision lue sur le serveur (voir les pages) : l'état local
// ne suit pas les nouvelles props, c'est la clé qui le renouvelle.
export function EditorProvider({
  organizationId,
  target,
  readOnly,
  initialPlan,
  initialRevision,
  children,
}: {
  organizationId: string;
  target: EditorTarget;
  readOnly: boolean;
  initialPlan: ProgramPlan | ProgramDraft;
  initialRevision: number;
  children: ReactNode;
}) {
  const [plan, setPlan] = useState(initialPlan);
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [revision, setRevision] = useState(initialRevision);
  const planRef = useRef(plan);
  const revisionRef = useRef(initialRevision);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inFlight = useRef<Promise<boolean> | null>(null);
  const blocked = useRef(false);

  const saveOnce = useCallback(async (): Promise<boolean> => {
    if (!dirty.current || blocked.current) return !blocked.current;
    dirty.current = false;
    setStatus("saving");
    const current = planRef.current;
    const result =
      target.kind === "program"
        ? await saveDraft(organizationId, target.programId, revisionRef.current, current).then(
            (r) => (r.ok ? { ok: true as const, revision: r.revision } : r),
          )
        : await updateTemplate(
            organizationId,
            "program",
            target.templateId,
            revisionRef.current,
            current,
          ).then((r) => (r.ok ? { ok: true as const, revision: r.version } : r));
    if (!result.ok) {
      if (result.code === "REVISION_CONFLICT") {
        blocked.current = true;
        setStatus("conflict");
      } else {
        dirty.current = true;
        setStatus("error");
      }
      return false;
    }
    revisionRef.current = result.revision;
    setRevision(result.revision);
    setStatus(dirty.current ? "saving" : "saved");
    return true;
  }, [organizationId, target]);

  // Un seul enregistrement à la fois ; ce qui change pendant l'envoi part juste après.
  const flush = useCallback(async (): Promise<boolean> => {
    clearTimeout(timer.current);
    for (;;) {
      while (inFlight.current) await inFlight.current;
      if (!dirty.current) return !blocked.current;
      const run = saveOnce().finally(() => {
        inFlight.current = null;
      });
      inFlight.current = run;
      // Échec : on s'arrête (« Pas enregistré · Réessayer ») au lieu de boucler.
      if (!(await run)) return false;
    }
  }, [saveOnce]);

  const update = useCallback(
    (change: (plan: ProgramPlan | ProgramDraft) => ProgramPlan | ProgramDraft) => {
      if (readOnly || blocked.current) return;
      const next = change(planRef.current);
      planRef.current = next;
      setPlan(next);
      dirty.current = true;
      clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), 700);
    },
    [readOnly, flush],
  );

  // Quitter la page avec une modification qui attend : on l'envoie (et le navigateur prévient).
  useEffect(() => {
    const onLeave = (event: BeforeUnloadEvent) => {
      if (!dirty.current && !inFlight.current) return;
      void flush();
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("beforeunload", onLeave);
      clearTimeout(timer.current);
    };
  }, [flush]);

  const value: EditorValue = {
    organizationId,
    target,
    readOnly,
    plan,
    update: update as EditorValue["update"],
    status,
    revision,
    currentRevision: () => revisionRef.current,
    flush,
    retry: () => {
      dirty.current = true;
      void flush();
    },
  };
  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function saveStatusLabel(status: SaveStatus): string {
  switch (status) {
    case "saving":
      return "Enregistrement…";
    case "error":
      return "Pas enregistré";
    case "conflict":
      return "Modifié ailleurs";
    default:
      return "Enregistré";
  }
}
