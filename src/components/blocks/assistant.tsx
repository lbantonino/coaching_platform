"use client";

import {
  ArrowUp,
  CalendarPlus,
  ChartColumn,
  Coins,
  FilePlus2,
  ListPlus,
  Maximize2,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { MenuDialog, Overlay, type MenuAnchor } from "@/components/ui/overlay";
import { Spinner } from "@/components/ui/spinner";

// Assistant IA du coach, kit « Coory Pages », page 02 (D-132 ; décision 15 d'Antonino) : TOUT le
// design maintenant (la boîte ouverte par le bouton « Assistant IA », la page complète, l'historique),
// le branchement réel plus tard, avec lui (fournisseur d'IA, enregistrement des conversations,
// exécution des actions, données des sportifs). Sans fournisseur, l'assistant le DIT : jamais de
// fausse réponse, rien n'est envoyé nulle part, rien n'est enregistré (la conversation vit dans cet
// onglet du navigateur, partagée par la boîte et la page « Plein écran »).

export type AssistantMessage = { id: number; from: "coach" | "assistant"; text: string };
type Athlete = { id: string; name: string };

type AssistantState = {
  firstName: string;
  open: boolean;
  messages: AssistantMessage[];
  draft: string;
  athlete: Athlete | null;
  openDialog: () => void;
  closeDialog: () => void;
  setDraft: (text: string) => void;
  setAthlete: (athlete: Athlete | null) => void;
  send: (text: string) => void;
  restart: () => void;
  loadAthletes: () => Promise<Athlete[]>;
};

const AssistantContext = createContext<AssistantState | null>(null);

export function useAssistant() {
  return useContext(AssistantContext);
}

// La réponse honnête tant qu'aucun fournisseur d'IA n'est branché (décision 15).
export const NOT_CONNECTED =
  "Je ne suis pas encore branché à un service d'intelligence artificielle : ta demande n'a été envoyée nulle part. Quand je le serai, je préparerai ce que tu demandes et tu valideras chaque action avant qu'elle soit faite.";

export function AssistantProvider({
  firstName,
  loadAthletes,
  children,
}: {
  firstName: string;
  // Action serveur (organisation déjà liée) ; sans organisation, aucun sportif.
  loadAthletes?: () => Promise<Athlete[]>;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const next = useRef(0);

  const send = useCallback(
    (text: string) => {
      const body = text.trim();
      if (!body) return;
      const about = athlete ? ` (sportif : ${athlete.name})` : "";
      setMessages((current) => [
        ...current,
        { id: next.current++, from: "coach", text: `${body}${about}` },
        { id: next.current++, from: "assistant", text: NOT_CONNECTED },
      ]);
      setDraft("");
    },
    [athlete],
  );

  const value = useMemo<AssistantState>(
    () => ({
      firstName,
      open,
      messages,
      draft,
      athlete,
      openDialog: () => setOpen(true),
      closeDialog: () => setOpen(false),
      setDraft,
      setAthlete,
      send,
      restart: () => {
        setMessages([]);
        setDraft("");
        setAthlete(null);
      },
      loadAthletes: loadAthletes ?? (async () => []),
    }),
    [firstName, open, messages, draft, athlete, send, loadAthletes],
  );

  return (
    <AssistantContext.Provider value={value}>
      {children}
      <AssistantDialog />
    </AssistantContext.Provider>
  );
}

// L'orbe de l'assistant (dégradé violet, jetons du thème).
export function AssistantOrb({ size }: { size: number }) {
  return (
    <span
      aria-hidden
      className="shrink-0 rounded-full bg-[radial-gradient(circle_at_32%_28%,var(--status-accent-soft),var(--violet)_58%,var(--violet-text))] shadow-[0_8px_24px_-10px_var(--violet)]"
      style={{ width: size, height: size }}
    />
  );
}

// Suggestions de l'accueil (boîte) : chacune envoie sa demande.
const SUGGESTIONS: { label: string; icon: LucideIcon }[] = [
  { label: "Créer un programme", icon: FilePlus2 },
  { label: "Planifier une séance", icon: CalendarPlus },
  { label: "Résumer la semaine d'un sportif", icon: ChartColumn },
  { label: "Relancer un paiement", icon: Coins },
  { label: "Ajouter une tâche", icon: ListPlus },
];

// Raccourcis de la page complète (trois cartes).
export const SHORTCUTS: { title: string; text: string; icon: LucideIcon }[] = [
  {
    title: "Programmer",
    text: "Crée ou adapte un programme à partir des retours d'un sportif.",
    icon: FilePlus2,
  },
  {
    title: "Analyser",
    text: "Résume la semaine d'un sportif : séances, ressenti, progression.",
    icon: ChartColumn,
  },
  {
    title: "Administratif",
    text: "Relances de paiement, tâches et agenda, en un message.",
    icon: CalendarPlus,
  },
];

// La boîte « Assistant IA » (ordinateur : sous l'en-tête, large ; téléphone : sous la barre du haut).
function AssistantDialog() {
  const assistant = useAssistant()!;
  const router = useRouter();
  const titleId = useId();
  const empty = assistant.messages.length === 0;
  return (
    <Overlay
      open={assistant.open}
      onClose={assistant.closeDialog}
      labelledBy={titleId}
      size="assistant"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 pt-4 pb-5 md:gap-5 md:px-6 md:pt-5 md:pb-5">
        <div className="flex items-center gap-2.5">
          <AssistantOrb size={26} />
          <h2 id={titleId} className="flex-1 text-[15px] leading-[normal] font-semibold">
            Assistant IA
          </h2>
          <button
            type="button"
            onClick={() => {
              assistant.closeDialog();
              router.push("/coach/assistant");
            }}
            className="inline-flex h-10 items-center gap-1.5 rounded-[12px] px-3 text-[13px] leading-[normal] font-medium text-text-2 transition-colors duration-150 hover:bg-dlg-tile"
          >
            <Maximize2 aria-hidden size={14} strokeWidth={1.9} />
            <span className="max-sm:sr-only">Plein écran</span>
          </button>
          <button
            type="button"
            aria-label="Fermer"
            onClick={assistant.closeDialog}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-dlg-tile text-text transition-colors duration-150 hover:bg-dlg-tile-hover"
          >
            <X aria-hidden size={17} strokeWidth={2} />
          </button>
        </div>

        {empty ? (
          <div className="flex flex-col gap-1.5">
            <p className="text-[24px] leading-[1.15] font-semibold tracking-[-0.02em] md:text-[22px]">
              Que veux-tu faire, {assistant.firstName} ?
            </p>
            <p className="text-[13.5px] leading-[1.45] text-muted">
              Je prépare, tu valides. Rien n&apos;est modifié sans ton accord.
            </p>
          </div>
        ) : (
          <AssistantThread className="max-h-[330px]" />
        )}

        <AssistantComposer rows={2} placeholder="Demande à ton assistant…" autoFocus />

        {empty ? (
          <ul aria-label="Suggestions" className="flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <li key={suggestion.label}>
                <button
                  type="button"
                  onClick={() => assistant.send(suggestion.label)}
                  className="inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-[13px] leading-[normal] font-medium text-text-2 inset-ring inset-ring-line-2 transition-colors duration-150 hover:bg-surface-2"
                >
                  <suggestion.icon
                    aria-hidden
                    size={14}
                    strokeWidth={1.9}
                    className="text-violet-text"
                  />
                  {suggestion.label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <p className="text-center text-[12px] leading-[normal] text-faint max-md:hidden">
          Entrée pour envoyer · Échap pour fermer
        </p>
      </div>
    </Overlay>
  );
}

// Le fil : les demandes du coach (bulle encre, à droite) et les réponses (orbe + texte).
export function AssistantThread({ className = "" }: { className?: string }) {
  const assistant = useAssistant()!;
  return (
    <ol
      aria-label="Conversation avec l'assistant"
      aria-live="polite"
      className={`flex min-h-0 flex-col gap-4 overflow-y-auto overscroll-contain ${className}`}
    >
      {assistant.messages.map((message) =>
        message.from === "coach" ? (
          <li
            key={message.id}
            className="max-w-[85%] self-end rounded-[16px_16px_4px_16px] bg-cta px-4 py-2.5 text-[14.5px] leading-[1.45] font-medium text-on-cta"
          >
            <span className="sr-only">Toi : </span>
            {message.text}
          </li>
        ) : (
          <li key={message.id} className="flex gap-3">
            <span className="pt-0.5">
              <AssistantOrb size={22} />
            </span>
            <p className="min-w-0 flex-1 text-[14.5px] leading-[1.55] text-text">
              <span className="sr-only">Assistant : </span>
              {message.text}
            </p>
          </li>
        ),
      )}
    </ol>
  );
}

// Zone de saisie (boîte et page) : le texte, le sportif concerné, Envoyer (rond violet, grisé si
// vide). Entrée envoie, Maj + Entrée passe à la ligne. « Joindre » et « Dicter » de la maquette
// attendent le branchement : pas de bouton qui ne fait rien.
export function AssistantComposer({
  rows,
  placeholder,
  autoFocus = false,
}: {
  rows: number;
  placeholder: string;
  autoFocus?: boolean;
}) {
  const assistant = useAssistant()!;
  const [menu, setMenu] = useState<MenuAnchor | null>(null);
  const [athletes, setAthletes] = useState<Athlete[] | null>(null);
  const id = useId();
  const empty = assistant.draft.trim() === "";
  return (
    <div className="flex flex-col gap-2.5 rounded-[18px] bg-surface p-3 shadow-[0_12px_32px_-18px_var(--violet)] inset-ring-[1.5px] inset-ring-violet/45 md:p-3.5">
      <label htmlFor={id} className="sr-only">
        Ta demande à l&apos;assistant
      </label>
      <textarea
        id={id}
        rows={rows}
        autoFocus={autoFocus}
        value={assistant.draft}
        onChange={(event) => assistant.setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            assistant.send(assistant.draft);
          }
        }}
        placeholder={placeholder}
        maxLength={2000}
        enterKeyHint="send"
        className="w-full resize-none bg-transparent px-1 text-[16px] leading-[1.5] text-text outline-none placeholder:text-faint md:text-[14.5px]"
      />
      <div className="flex items-center gap-2">
        {assistant.athlete ? (
          <button
            type="button"
            onClick={() => assistant.setAthlete(null)}
            aria-label={`Retirer le sportif : ${assistant.athlete.name}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-status-accent-soft px-3 text-[13px] leading-[normal] font-medium text-violet-text"
          >
            <UserRound aria-hidden size={14} strokeWidth={1.9} />
            {assistant.athlete.name}
            <X aria-hidden size={13} strokeWidth={2.2} />
          </button>
        ) : (
          <button
            type="button"
            onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              setMenu({
                x: Math.round(rect.left),
                y: Math.round(rect.bottom + 6),
                side: "top",
                width: 260,
              });
              setAthletes(null);
              assistant.loadAthletes().then(setAthletes, () => setAthletes([]));
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] leading-[normal] font-medium text-text-2 inset-ring inset-ring-line-2 transition-colors duration-150 hover:bg-surface-2"
          >
            <UserRound aria-hidden size={14} strokeWidth={1.9} />
            Sportif
          </button>
        )}
        <span aria-hidden className="flex-1" />
        <button
          type="button"
          aria-label="Envoyer"
          disabled={empty}
          onClick={() => assistant.send(assistant.draft)}
          className="grid size-9 shrink-0 place-items-center rounded-full bg-violet text-white transition-[background-color,scale] duration-150 active:scale-95 disabled:bg-dlg-check-line"
        >
          <ArrowUp aria-hidden size={17} strokeWidth={2.2} />
        </button>
      </div>
      <MenuDialog open={menu !== null} onClose={() => setMenu(null)} anchor={menu} title="Sportif">
        {athletes === null ? (
          <p className="flex items-center gap-2 px-3 py-3 text-[14px] text-muted">
            <Spinner /> Chargement…
          </p>
        ) : athletes.length === 0 ? (
          <p className="px-3 py-3 text-[14px] text-muted">Aucun sportif.</p>
        ) : (
          <ul aria-label="Choisir un sportif" className="flex max-h-72 flex-col overflow-y-auto">
            {athletes.map((athlete) => (
              <li key={athlete.id}>
                <button
                  type="button"
                  onClick={() => {
                    assistant.setAthlete(athlete);
                    setMenu(null);
                  }}
                  className="flex h-[46px] w-full items-center rounded-[9px] px-3 text-left text-[15px] leading-[normal] font-medium text-text transition-[background-color] duration-150 hover:bg-dlg-tile md:h-9 md:px-2.5 md:text-[13.5px]"
                >
                  {athlete.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </MenuDialog>
    </div>
  );
}

// Carte « ACTIONS PROPOSÉES » (kit) : prête pour le branchement (réponse de l'assistant avec ses
// actions) ; aucune action n'est proposée tant qu'il n'est pas branché. Cochées par défaut ;
// « Valider N actions » n'exécute que celles cochées, désactivé à 0.
export function ProposedActions({
  actions,
  onValidate,
}: {
  actions: { id: string; label: string }[];
  onValidate: (ids: string[]) => void;
}) {
  const [checked, setChecked] = useState<Set<string>>(() => new Set(actions.map((a) => a.id)));
  const count = checked.size;
  return (
    <div className="flex flex-col gap-3 rounded-[14px] bg-surface-2 p-3.5">
      <p className="text-[11.5px] leading-[normal] font-semibold tracking-[0.04em] text-faint uppercase">
        Actions proposées
      </p>
      <ul className="flex flex-col gap-1">
        {actions.map((action) => (
          <li key={action.id}>
            <label className="flex min-h-10 cursor-pointer items-center gap-3 text-[14px] leading-[1.4]">
              <input
                type="checkbox"
                checked={checked.has(action.id)}
                onChange={() =>
                  setChecked((current) => {
                    const nextSet = new Set(current);
                    if (nextSet.has(action.id)) nextSet.delete(action.id);
                    else nextSet.add(action.id);
                    return nextSet;
                  })
                }
                className="size-[18px] accent-[var(--violet)]"
              />
              {action.label}
            </label>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12.5px] leading-[normal] text-muted">Coche ce que tu gardes</span>
        <button
          type="button"
          disabled={count === 0}
          onClick={() => onValidate([...checked])}
          className="inline-flex h-9 items-center rounded-[10px] bg-violet px-3.5 text-[13px] leading-[normal] font-semibold text-white disabled:opacity-50"
        >
          Valider {count} action{count > 1 ? "s" : ""}
        </button>
      </div>
    </div>
  );
}
