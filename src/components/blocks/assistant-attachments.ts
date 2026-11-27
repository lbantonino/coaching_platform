"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  IMAGE_MAX_SIDE,
  REFRESH_AFTER_MS,
  attachmentKind,
  attachmentProblem,
} from "@/features/assistant/attachment-rules";
import { shrinkPhoto } from "@/lib/shrink-photo";

// Fichiers joints à l'Assistant IA, côté navigateur (D-213, 27/11/2026) : jusqu'à 10, 20 Mo chacun.
// Chaque fichier est déposé DIRECTEMENT dans le stockage de Coory (adresse signée : jamais par Vercel,
// 4,5 Mo au plus), puis préparé par le serveur (un appel par fichier). La question part quand tous
// sont prêts. Une copie préparée il y a plus de 40 min est refaite avant l'envoi.

type Ticket = { ok: true; id: string; uploadUrl: string } | { ok: false; error: string };
type Prepared = { ok: true; pages: number } | { ok: false; error: string };

// Actions serveur liées à l'organisation (layout coach) ; absentes pour le compte de démonstration.
export type AttachmentActions = {
  request: (meta: { name: string; type: string; size: number }) => Promise<Ticket>;
  prepare: (id: string) => Promise<Prepared>;
  remove: (ids: string[]) => Promise<{ ok: boolean }>;
};

export type AttachedFile = {
  key: string;
  file: File;
  status: "uploading" | "ready" | "error";
  id?: string;
  error?: string;
  preparedAt?: number;
};

// Liste des formats proposés par le sélecteur de fichiers.
export const ATTACHMENT_ACCEPT =
  ".pdf,image/*,.heic,.docx,.xlsx,.csv,.tsv,.txt,.md,.json,application/pdf";

// Une image est réduite avant l'envoi (Claude refuse plus de 5 Mo ou 8 000 px), en gardant son nom.
async function shrinkImage(file: File): Promise<File> {
  const shrunk = await shrinkPhoto(file, { maxSide: IMAGE_MAX_SIDE });
  if (shrunk === file) return file;
  const base = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([shrunk], `${base}.jpg`, { type: "image/jpeg" });
}

// iPhone qui teste en local (http://<IP du Mac>) : l'adresse signée vise 127.0.0.1 (le Mac) ; on
// la fait pointer vers la même machine que la page. En ligne : rien ne change.
function reachable(url: string): string {
  const target = new URL(url);
  const local = (host: string) => host === "127.0.0.1" || host === "localhost";
  if (local(target.hostname) && !local(window.location.hostname)) {
    target.hostname = window.location.hostname;
  }
  return target.toString();
}

let counter = 0;

export function useAttachments(actions: AttachmentActions | undefined) {
  const [list, setList] = useState<AttachedFile[]>([]);
  const latest = useRef(list);
  useEffect(() => {
    latest.current = list;
  }, [list]);

  const patch = useCallback((key: string, change: Partial<AttachedFile>) => {
    setList((current) => current.map((item) => (item.key === key ? { ...item, ...change } : item)));
  }, []);

  // Relecture du 27/11 : un fichier retiré pendant son envoi ne laisse rien derrière lui (le serveur
  // l'efface dès qu'il est connu) ; retirés est mis à jour tout de suite, sans attendre l'affichage.
  const removed = useRef(new Set<string>());
  const gone = (key: string) => removed.current.has(key);
  // Les images se réduisent une par une (dix grandes photos à la fois saturent la mémoire d'un iPhone).
  const shrinking = useRef<Promise<unknown>>(Promise.resolve());

  const upload = useCallback(
    async (key: string, raw: File) => {
      if (!actions) return;
      const failed = (name: string) => `« ${name} » n'a pas pu être envoyé. Réessaie.`;
      let id: string | undefined;
      const abandon = () => {
        if (id) void actions.remove([id]).catch(() => undefined);
      };
      try {
        let file = raw;
        if (attachmentKind(raw.name, raw.type) === "image") {
          const turn = shrinking.current.then(() => shrinkImage(raw));
          shrinking.current = turn.catch(() => undefined);
          file = await turn;
        }
        if (gone(key)) return;
        patch(key, { file });
        const ticket = await actions.request({ name: file.name, type: file.type, size: file.size });
        if (!ticket.ok) return patch(key, { status: "error", error: ticket.error });
        id = ticket.id;
        if (gone(key)) return abandon();
        patch(key, { id: ticket.id });
        const body = new FormData();
        body.append("cacheControl", "3600");
        body.append("", file);
        const put = await fetch(reachable(ticket.uploadUrl), {
          method: "PUT",
          body,
          headers: { "x-upsert": "false" },
        });
        if (gone(key)) return abandon();
        if (!put.ok) return patch(key, { status: "error", error: failed(file.name) });
        const ready = await actions.prepare(ticket.id);
        if (gone(key)) return abandon();
        patch(
          key,
          ready.ok
            ? { status: "ready", preparedAt: Date.now() }
            : { status: "error", error: ready.error },
        );
      } catch {
        if (gone(key)) return abandon();
        patch(key, { status: "error", error: failed(raw.name) });
      }
    },
    [actions, patch],
  );

  // Ajoute des fichiers (sélection ou glisser-déposer) ; renvoie le premier refus, s'il y en a un.
  // Deux fichiers ne portent jamais le même nom (« Ranger » nomme le sien) : « nom (2).pdf ».
  const add = useCallback(
    (files: File[]): string | null => {
      let count = latest.current.length;
      let refusal: string | null = null;
      const added: AttachedFile[] = [];
      const taken = new Set(latest.current.map((entry) => entry.file.name.toLowerCase()));
      for (const original of files) {
        const problem = attachmentProblem(original, count);
        if (problem) {
          refusal ??= problem;
          continue;
        }
        let file = original;
        const dot = original.name.lastIndexOf(".");
        const base = dot > 0 ? original.name.slice(0, dot) : original.name;
        const extension = dot > 0 ? original.name.slice(dot) : "";
        for (let n = 2; taken.has(file.name.toLowerCase()); n += 1) {
          file = new File([original], `${base} (${n})${extension}`, { type: original.type });
        }
        taken.add(file.name.toLowerCase());
        count += 1;
        added.push({ key: `fichier-${++counter}`, file, status: "uploading" });
      }
      if (added.length > 0) {
        setList((current) => [...current, ...added]);
        for (const item of added) void upload(item.key, item.file);
      }
      return refusal;
    },
    [upload],
  );

  const remove = useCallback(
    (key: string) => {
      removed.current.add(key);
      const item = latest.current.find((entry) => entry.key === key);
      setList((current) => current.filter((entry) => entry.key !== key));
      if (item?.id && actions) void actions.remove([item.id]).catch(() => undefined);
    },
    [actions],
  );

  // Nouvelle conversation, conversation rouverte : les fichiers sont retirés (et effacés).
  const clear = useCallback(() => {
    for (const entry of latest.current) removed.current.add(entry.key);
    const ids = latest.current.flatMap((entry) => (entry.id ? [entry.id] : []));
    setList([]);
    if (ids.length > 0 && actions) void actions.remove(ids).catch(() => undefined);
  }, [actions]);

  // Avant l'envoi : refait les copies de plus de 40 min (ou toutes, `all`). false : un fichier a échoué.
  const refresh = useCallback(
    async (all = false): Promise<boolean> => {
      if (!actions) return true;
      const stale = Date.now() - REFRESH_AFTER_MS;
      const due = latest.current.filter(
        (entry) => entry.status === "ready" && entry.id && (all || (entry.preparedAt ?? 0) < stale),
      );
      const results = await Promise.all(
        due.map(async (entry) => {
          const started = Date.now();
          const ready = await actions.prepare(entry.id!).catch(() => null);
          patch(
            entry.key,
            ready?.ok
              ? { preparedAt: started }
              : {
                  status: "error",
                  error: ready?.error ?? `« ${entry.file.name} » à joindre à nouveau.`,
                },
          );
          return Boolean(ready?.ok);
        }),
      );
      return results.every(Boolean);
    },
    [actions, patch],
  );

  return useMemo(
    () => ({ list, add, remove, clear, refresh, enabled: Boolean(actions) }),
    [list, add, remove, clear, refresh, actions],
  );
}
