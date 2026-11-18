"use client";

import { useRouter } from "next/navigation";
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
  // Pourquoi le dernier enregistrement a échoué (message de l'action), null sinon.
  error: string | null;
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
  const router = useRouter();
  const [plan, setPlan] = useState(initialPlan);
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(initialRevision);
  const planRef = useRef(plan);
  const revisionRef = useRef(initialRevision);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inFlight = useRef<Promise<boolean> | null>(null);
  const blocked = useRef(false);
  // Le plan tel qu'il est enregistré (revue MVP du 13/11, C20) : une « modification » qui ne change
  // rien (renommer avec le même titre, valider le même jour…) n'enregistre rien, et ne crée donc pas
  // de « Modifications non publiées ».
  const savedJson = useRef<string | null>(null);
  // Dernière révision enregistrée dans cet onglet (C10) : la page rouverte par le retour arrière du
  // navigateur peut sortir d'un cache, avec une révision plus ancienne ; on la relit alors.
  const storeKey =
    target.kind === "program"
      ? `coory-revision:program:${target.programId}`
      : `coory-revision:template:${target.templateId}`;

  const saveOnce = useCallback(async (): Promise<boolean> => {
    if (!dirty.current || blocked.current) return !blocked.current;
    dirty.current = false;
    const current = planRef.current;
    const json = JSON.stringify(current);
    savedJson.current ??= JSON.stringify(initialPlan);
    if (json === savedJson.current) {
      setStatus("saved");
      return true;
    }
    setStatus("saving");
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
      setError(result.issues?.[0] ? `${result.message} (${result.issues[0]})` : result.message);
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
    savedJson.current = json;
    try {
      sessionStorage.setItem(storeKey, String(result.revision));
    } catch {
      // Stockage bloqué : la page se relit seulement quand elle redevient visible.
    }
    setRevision(result.revision);
    setError(null);
    setStatus(dirty.current ? "saving" : "saved");
    return true;
  }, [organizationId, target, initialPlan, storeKey]);

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
  // Quitter par un lien de l'app (retour de l'en-tête, menu) démonte l'éditeur : la modification qui
  // attendait ses 700 ms part quand même (revue MVP du 13/11, C7 ; avant, elle était perdue).
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
      if (dirty.current && !blocked.current) void flush();
    };
  }, [flush]);

  // Données plus fraîches reçues du serveur (rechargement au retour de l'éditeur de séance, « Recharger »
  // après un conflit) : adoptées SUR PLACE, sans reconstruire l'éditeur (relecture du 18/11 : une
  // fenêtre ouverte se refermait seule et le niveau du téléphone repartait de la semaine quand le
  // rechargement arrivait après un geste du coach). Rien n'est adopté pendant qu'une modification
  // attend ou part : c'est l'enregistrement qui tranche (conflit). Après un conflit, on repart du serveur.
  useEffect(() => {
    if (initialRevision <= revisionRef.current && !blocked.current) return;
    if (dirty.current || inFlight.current) return;
    if (blocked.current && initialRevision < revisionRef.current) return;
    blocked.current = false;
    revisionRef.current = initialRevision;
    planRef.current = initialPlan;
    savedJson.current = JSON.stringify(initialPlan);
    setPlan(initialPlan);
    setRevision(initialRevision);
    setError(null);
    setStatus("saved");
  }, [initialPlan, initialRevision]);

  // C10 : rouverte depuis le cache (retour arrière), la page peut montrer une révision dépassée ;
  // revenue au premier plan, elle relit le serveur (une modification faite ailleurs s'affiche).
  useEffect(() => {
    try {
      if (Number(sessionStorage.getItem(storeKey) ?? 0) > initialRevision) router.refresh();
    } catch {
      // Stockage bloqué : rien à comparer.
    }
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (dirty.current || inFlight.current || blocked.current) return;
      router.refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [router, storeKey, initialRevision]);

  const value: EditorValue = {
    organizationId,
    target,
    readOnly,
    plan,
    update: update as EditorValue["update"],
    status,
    error,
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
