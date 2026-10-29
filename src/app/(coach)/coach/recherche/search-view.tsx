"use client";

import {
  CalendarDays,
  ClipboardList,
  FileText,
  FolderOpen,
  Search,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";

import { useOpenTaskSheet } from "@/components/blocks/task-sheet";
import { ListRow } from "@/components/blocks/list-row";
import { Avatar } from "@/components/ui/avatar";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { SEARCH_MIN, cleanQuery } from "@/domain/search/search";
import type { SearchResults } from "@/features/search/actions";

// Page Recherche (prompt §7 `/coach/recherche`, 4e, D-62) : un grand champ, des résultats rangés
// par groupe et filtrés en direct (sportifs, programmes, séances, documents, tâches). L'adresse
// garde la recherche (?q=) : partageable, et le retour navigateur la retrouve.
const statusLabels: Record<string, string> = {
  active: "Actif",
  paused: "En pause",
  archived: "Archivé",
  draft: "Brouillon",
  published: "Publié",
};

const dayFormatter = new Intl.DateTimeFormat("fr-BE", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const shortDay = (isoDay: string) => dayFormatter.format(new Date(`${isoDay}T00:00:00Z`));

export function SearchView({
  initialQuery,
  initialResults,
  orgBase,
  search,
}: {
  initialQuery: string;
  initialResults: SearchResults | null;
  orgBase: string;
  search: (query: string) => Promise<SearchResults>;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResults | null>(initialResults);
  const [searched, setSearched] = useState(initialQuery);
  const [pending, startTransition] = useTransition();
  const input = useRef<HTMLInputElement>(null);
  const openTask = useOpenTaskSheet();
  const latest = useRef(0);

  // ⌘K / Ctrl K sur cette page : retour au champ.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        input.current?.focus();
        input.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Recherche en direct, un court instant après la dernière touche ; seule la dernière réponse compte.
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const change = (next: string) => {
    setQuery(next);
    clearTimeout(timer.current);
    const clean = cleanQuery(next);
    window.history.replaceState(
      window.history.state,
      "",
      clean ? `?q=${encodeURIComponent(clean)}` : window.location.pathname,
    );
    const ticket = ++latest.current;
    if (clean.length < SEARCH_MIN) {
      setResults(null);
      setSearched(clean);
      return;
    }
    timer.current = setTimeout(() => {
      startTransition(async () => {
        const found = await search(clean);
        if (ticket !== latest.current) return;
        setResults(found);
        setSearched(clean);
      });
    }, 180);
  };

  const total = results
    ? results.athletes.length +
      results.programs.length +
      results.sessions.length +
      results.documents.length +
      results.tasks.length
    : 0;

  return (
    <div className="flex flex-col gap-5">
      <div role="search" className="flex flex-col gap-2">
        <label
          htmlFor="global-search"
          className="flex h-14 items-center gap-3 rounded-wide border border-line-2 bg-surface px-4 focus-within:border-accent"
        >
          <Search aria-hidden size={20} strokeWidth={1.8} className="shrink-0 text-muted" />
          <span className="sr-only">Rechercher dans Coory</span>
          <input
            ref={input}
            id="global-search"
            type="search"
            autoFocus
            autoComplete="off"
            value={query}
            onChange={(event) => change(event.target.value)}
            placeholder="Un sportif, un programme, une séance, un document…"
            className="h-full min-w-0 flex-1 bg-transparent text-[17px] text-text outline-none placeholder:text-muted"
          />
          {pending ? <Spinner /> : null}
        </label>
        <p aria-live="polite" className="text-[13px] text-muted">
          {cleanQuery(query).length < SEARCH_MIN
            ? "Tape au moins 2 lettres."
            : results && searched === cleanQuery(query)
              ? total === 0
                ? "Aucun résultat. Essaie un autre filtre ou une autre recherche."
                : `${total} résultat${total > 1 ? "s" : ""} pour « ${searched} »`
              : "Recherche…"}
        </p>
      </div>

      {results && total > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Group id="search-athletes" title="Sportifs" icon={Users} count={results.athletes.length}>
            {results.athletes.map((athlete) => (
              <ListRow
                key={athlete.id}
                href={`${orgBase}/sportifs/${athlete.id}`}
                leading={
                  <Avatar
                    name={athlete.name}
                    photoPath={athlete.photoPath}
                    sex={athlete.sex as "female" | "male" | "unspecified" | null}
                  />
                }
                title={athlete.name}
                trailing={<StatusBadge label={statusLabels[athlete.status] ?? athlete.status} />}
              />
            ))}
          </Group>
          <Group
            id="search-programs"
            title="Programmes"
            icon={FileText}
            count={results.programs.length}
          >
            {results.programs.map((program) => (
              <ListRow
                key={program.id}
                href={`${orgBase}/sportifs/${program.athleteId}?onglet=agenda`}
                title={program.title}
                sub={program.athleteName}
                trailing={<StatusBadge label={statusLabels[program.status] ?? program.status} />}
              />
            ))}
          </Group>
          <Group
            id="search-sessions"
            title="Séances"
            icon={CalendarDays}
            count={results.sessions.length}
          >
            {results.sessions.map((session) => (
              <ListRow
                key={session.id}
                href={`${orgBase}/agenda/seances/${session.id}`}
                title={session.title}
                sub={[
                  session.kind === "group" ? "Collective" : "Individuelle",
                  session.location,
                  `depuis le ${shortDay(session.startsOn)}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              />
            ))}
          </Group>
          <Group
            id="search-documents"
            title="Documents"
            icon={FolderOpen}
            count={results.documents.length}
          >
            {results.documents.map((document) => (
              <ListRow
                key={document.id}
                href={`/documents/${document.id}`}
                title={document.name}
                trailing={<Badge>{document.category ?? "Sans catégorie"}</Badge>}
              />
            ))}
          </Group>
          <Group id="search-tasks" title="Tâches" icon={ClipboardList} count={results.tasks.length}>
            {results.tasks.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => openTask?.(task)}
                className="-mx-2 flex min-h-16 items-center gap-3 rounded-[12px] border-t border-line px-2 py-2.5 text-left transition-colors duration-150 hover:bg-surface-2 active:bg-surface-2 active:duration-0"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span
                    className={`truncate text-[15px] font-semibold ${task.done ? "text-muted line-through" : ""}`}
                  >
                    {task.title}
                  </span>
                  {task.dueOn ? (
                    <span className="text-[13px] text-muted">Échéance {shortDay(task.dueOn)}</span>
                  ) : null}
                </span>
                <StatusBadge
                  label={task.done ? "Terminée" : task.priority === "high" ? "Haute" : "Normale"}
                />
              </button>
            ))}
          </Group>
        </div>
      ) : null}
    </div>
  );
}

// Un groupe de résultats ; caché s'il est vide.
function Group({
  id,
  title,
  icon: Icon,
  count,
  children,
}: {
  id: string;
  title: string;
  icon: LucideIcon;
  count: number;
  children: ReactNode;
}) {
  if (count === 0) return null;
  return (
    <Card
      id={id}
      title={
        <span className="inline-flex items-center gap-2">
          <Icon aria-hidden size={17} strokeWidth={1.8} className="text-muted" />
          {title}
        </span>
      }
      subtitle={`${count} résultat${count > 1 ? "s" : ""}`}
    >
      <div className="flex flex-col">{children}</div>
    </Card>
  );
}
