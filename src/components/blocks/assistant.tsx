"use client";

import {
  ArrowUp,
  CalendarPlus,
  ChartColumn,
  Coins,
  FilePlus2,
  ListPlus,
  Lock,
  Maximize2,
  Mic,
  Square,
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

import { AssistantCard } from "@/components/blocks/assistant-card";
import { useDictation } from "@/components/blocks/assistant-voice";
import { MenuDialog, Overlay, type MenuAnchor } from "@/components/ui/overlay";
import { Spinner } from "@/components/ui/spinner";
import type { AskAssistantResult } from "@/features/assistant/actions";
import {
  blockDependents,
  canValidate,
  noteFor,
  resolveCard,
  startCard,
  toCards,
  type CardState,
} from "@/features/assistant/cards";
import type { ExecuteResult } from "@/features/assistant/execute";
import type { AssistantAction } from "@/features/assistant/proposals";
import type { StepResult } from "@/features/assistant/loop";
import {
  LOCKED_DETAIL,
  LOCKED_TEXT,
  UNCONFIGURED_NOTE,
  UNCONFIGURED_TEXT,
  assistantComposerOpen,
  trimHistory,
  type AskRequest,
  type AssistantAccess,
} from "@/features/assistant/rules";

// Assistant IA du coach, kit « Coory Pages », page 02 (D-132) : la boîte ouverte par le bouton
// « Assistant IA » et la page complète partagent la même conversation (elle vit dans cet onglet du
// navigateur, rien n'est enregistré). Branché à Claude depuis D-168 (13/11/2026), réservé à
// l'abonnement mensuel Coory : sans abonnement, l'interface est verrouillée et AUCUNE demande ne part
// (la base le revérifie à chaque demande, features/assistant/actions.ts). Abonné : 100 demandes par
// coach et par mois. Depuis le lot 1 des actions, il lit ce qu'il faut (sportifs, agenda, séances à
// encaisser) et PROPOSE des actions en cartes : rien n'est fait avant le clic « Valider » du coach.

// `failed` : réponse d'erreur (ou la question qui l'a provoquée), jamais renvoyée à Claude.
// `hidden` : note pour l'assistant (« [Fait : …] »), envoyée avec la demande suivante, jamais affichée.
// `cards` : actions proposées par l'assistant, à valider (lot 1 des actions).
export type AssistantMessage = {
  id: number;
  from: "coach" | "assistant";
  text: string;
  failed?: boolean;
  hidden?: boolean;
  cards?: CardState[];
  // Actions de la même réponse qui n'ont pas pu être préparées (relecture n°3).
  failures?: string[];
};
type Athlete = { id: string; name: string };

type AssistantState = {
  firstName: string;
  access: AssistantAccess;
  // Une demande est en cours (réponse attendue), et ce que l'assistant fait en ce moment.
  pending: boolean;
  progress: string | null;
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
  // Gestes sur une carte d'action.
  validateCard: (messageId: number, cardId: string) => void;
  cancelCard: (messageId: number, cardId: string) => void;
  // Après « Modifier » : la carte est remplacée par le formulaire, ou la saisie attend la correction.
  dropCard: (messageId: number, cardId: string, asked: boolean) => void;
};

const AssistantContext = createContext<AssistantState | null>(null);

export function useAssistant() {
  return useContext(AssistantContext);
}

const UNAVAILABLE = "L'assistant est indisponible pour le moment. Réessaie dans quelques instants.";

export function AssistantProvider({
  firstName,
  access: initialAccess,
  ask,
  execute,
  loadAthletes,
  children,
}: {
  firstName: string;
  // Abonnement et clé (lus par le serveur) : verrouillé, pas branché, ou prêt.
  access: AssistantAccess;
  // Actions serveur (organisation déjà liée) ; sans organisation, pas d'assistant.
  ask?: (input: AskRequest) => Promise<AskAssistantResult>;
  execute?: (action: AssistantAction) => Promise<ExecuteResult>;
  // Action serveur (organisation déjà liée) ; sans organisation, aucun sportif.
  loadAthletes?: () => Promise<Athlete[]>;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  // La réponse du serveur met à jour les demandes restantes (ou verrouille si l'abonnement a pris fin).
  const [access, setAccess] = useState<AssistantAccess>(initialAccess);
  const next = useRef(0);
  // Une conversation recommencée pendant une demande ignore la réponse de l'ancienne.
  const conversation = useRef(0);
  // Cartes en cours d'exécution (un deuxième clic ne relance rien, même avant le rendu suivant).
  const running = useRef(new Set<string>());
  const router = useRouter();

  const send = useCallback(
    (text: string) => {
      const body = text.trim();
      if (!body || pending || !assistantComposerOpen(access) || !ask) return;
      const about = athlete ? ` (sportif : ${athlete.name})` : "";
      const question = `${body}${about}`;
      const history = trimHistory(
        messages
          .filter((message) => !message.failed)
          .map(({ from, text: said }) => ({ from, text: said })),
      );
      const asked = next.current++;
      const round = conversation.current;
      setMessages((current) => [...current, { id: asked, from: "coach", text: question }]);
      setDraft("");
      setPending(true);
      const answer = (result: AskAssistantResult) => {
        if (round !== conversation.current) return;
        const step = result.ok ? result.step : null;
        setMessages((current) => [
          ...current.map((message) =>
            message.id === asked && !result.ok ? { ...message, failed: true } : message,
          ),
          {
            id: next.current++,
            from: "assistant",
            text: result.ok ? stepText(result.step) : result.error,
            failed: !result.ok,
            ...(step?.kind === "proposals"
              ? { cards: toCards(step.proposals), failures: step.failures }
              : {}),
          },
        ]);
        if (!result.ok && (result.kind === "locked" || result.kind === "unconfigured")) {
          setAccess({ status: result.kind });
        } else if (result.remaining !== null) {
          setAccess({ status: "ready", remaining: result.remaining });
        }
        setProgress(null);
        setPending(false);
      };
      // Une demande se fait en étapes (un appel au modèle chacune) : tant que l'assistant cherche
      // (outils de lecture), on relance l'étape suivante avec la conversation qu'il a renvoyée.
      const drive = async () => {
        let result = await ask({ start: { history, question } });
        while (result.ok && result.step.kind === "continue") {
          if (round !== conversation.current) return;
          setProgress(result.step.progress);
          result = await ask({
            next: { usageId: result.usageId, messages: result.step.messages },
          });
        }
        answer(result);
      };
      drive().catch(() =>
        answer({ ok: false, kind: "unavailable", error: UNAVAILABLE, remaining: null }),
      );
    },
    [athlete, access, ask, messages, pending],
  );

  // Met à jour les cartes d'un message, et ajoute éventuellement une note pour l'assistant.
  const updateCards = useCallback(
    (messageId: number, change: (cards: CardState[]) => CardState[], note?: string) => {
      setMessages((current) => {
        const updated = current.map((message) =>
          message.id === messageId && message.cards
            ? { ...message, cards: change(message.cards) }
            : message,
        );
        return note
          ? [...updated, { id: next.current++, from: "coach", text: note, hidden: true }]
          : updated;
      });
    },
    [],
  );

  const findCard = useCallback(
    (messageId: number, cardId: string) =>
      messages.find((message) => message.id === messageId)?.cards?.find((c) => c.id === cardId),
    [messages],
  );

  const validateCard = useCallback(
    (messageId: number, cardId: string) => {
      const cards = messages.find((message) => message.id === messageId)?.cards ?? [];
      const card = cards.find((item) => item.id === cardId);
      if (!card || !execute || !canValidate(cards, cardId) || running.current.has(cardId)) return;
      running.current.add(cardId);
      updateCards(messageId, (list) => startCard(list, cardId));
      const blocked = (who: string) => `Impossible : la fiche de ${who} n'a pas été créée.`;
      execute({ kind: card.kind, params: card.params })
        .catch((): ExecuteResult => ({ ok: false, error: UNAVAILABLE }))
        .then((result) => {
          running.current.delete(cardId);
          if (result.ok) {
            updateCards(
              messageId,
              (list) => resolveCard(list, cardId, result.href, result.createdAthleteId),
              noteFor(card, "done"),
            );
            router.refresh();
          } else {
            updateCards(messageId, (list) =>
              blockDependents(
                list.map((item) =>
                  item.id === cardId ? { ...item, status: "error", result: result.error } : item,
                ),
                cardId,
                blocked(card.summary[0] ?? "ce sportif"),
              ),
            );
          }
        });
    },
    [messages, execute, updateCards, router],
  );

  const cancelCard = useCallback(
    (messageId: number, cardId: string) => {
      const card = findCard(messageId, cardId);
      if (!card || card.status !== "pending") return;
      updateCards(
        messageId,
        (list) =>
          blockDependents(
            list.map((item) => (item.id === cardId ? { ...item, status: "cancelled" } : item)),
            cardId,
            `Impossible : la fiche de ${card.summary[0] ?? "ce sportif"} n'a pas été créée.`,
          ),
        noteFor(card, "cancelled"),
      );
    },
    [findCard, updateCards],
  );

  const dropCard = useCallback(
    (messageId: number, cardId: string, asked: boolean) => {
      const card = findCard(messageId, cardId);
      if (!card || card.status !== "pending") return;
      updateCards(
        messageId,
        (list) =>
          blockDependents(
            list.map((item) =>
              item.id === cardId
                ? {
                    ...item,
                    status: "cancelled",
                    result: asked ? "À corriger dans ta réponse" : "Modifiée dans le formulaire",
                  }
                : item,
            ),
            cardId,
            `Impossible : la fiche de ${card.summary[0] ?? "ce sportif"} n'a pas été créée.`,
          ),
        noteFor(card, "cancelled"),
      );
      if (asked) {
        setMessages((current) => [
          ...current,
          { id: next.current++, from: "assistant", text: "Que veux-tu changer ?", failed: true },
        ]);
      }
    },
    [findCard, updateCards],
  );

  const value = useMemo<AssistantState>(
    () => ({
      firstName,
      access,
      pending,
      progress,
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
        conversation.current++;
        setMessages([]);
        setDraft("");
        setAthlete(null);
        setPending(false);
        setProgress(null);
      },
      loadAthletes: loadAthletes ?? (async () => []),
      validateCard,
      cancelCard,
      dropCard,
    }),
    [
      firstName,
      access,
      pending,
      progress,
      open,
      messages,
      draft,
      athlete,
      send,
      loadAthletes,
      validateCard,
      cancelCard,
      dropCard,
    ],
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

// Texte d'une étape terminée (une réponse, ou le message qui accompagne des cartes).
function stepText(step: StepResult): string {
  return step.kind === "answer" || step.kind === "proposals" ? step.text : "";
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
// Ce que l'assistant sait vraiment faire : proposer et rédiger (il n'a accès à aucune donnée).
const SUGGESTIONS: { label: string; icon: LucideIcon }[] = [
  { label: "Créer une séance", icon: CalendarPlus },
  { label: "Noter un paiement", icon: Coins },
  { label: "Ajouter une tâche", icon: ListPlus },
  { label: "Créer la fiche d'un sportif", icon: FilePlus2 },
  { label: "Préparer une semaine d'affûtage", icon: ChartColumn },
];

// Raccourcis de la page complète (trois cartes).
export const SHORTCUTS: { title: string; text: string; icon: LucideIcon }[] = [
  {
    title: "Programmer",
    text: "Des idées de séances et la structure d'un programme, à adapter à ton sportif.",
    icon: FilePlus2,
  },
  {
    title: "Conseiller",
    text: "Une question d'entraînement : progression, charge, récupération.",
    icon: ChartColumn,
  },
  {
    title: "Administratif",
    text: "Séances, paiements, dépenses et tâches : je les prépare, tu valides d'un clic.",
    icon: CalendarPlus,
  },
];

// Sans abonnement (ou sans clé sur le serveur) : ce que l'assistant affiche à la place de la saisie.
export function assistantLockText(access: AssistantAccess): { title: string; detail: string } {
  return access.status === "unconfigured"
    ? { title: UNCONFIGURED_TEXT, detail: "Réessaie plus tard." }
    : { title: LOCKED_TEXT, detail: LOCKED_DETAIL };
}

// Pastille du verrou (même tuile que la fenêtre « pas encore disponible »).
export function AssistantLockTile() {
  return (
    <span
      aria-hidden
      className="grid size-[52px] shrink-0 place-items-center rounded-[16px] bg-dlg-accent-soft text-violet-text"
    >
      <Lock size={22} strokeWidth={1.9} />
    </span>
  );
}

// « 37 demandes restantes ce mois-ci » sous la saisie.
export function remainingLabel(access: AssistantAccess): string | null {
  if (access.status === "unconfigured") return UNCONFIGURED_NOTE;
  if (access.status !== "ready") return null;
  const n = access.remaining;
  return n === 0
    ? "Plus de demande ce mois-ci"
    : `${n} demande${n > 1 ? "s" : ""} restante${n > 1 ? "s" : ""} ce mois-ci`;
}

// La boîte « Assistant IA » (ordinateur : sous l'en-tête, large ; téléphone : sous la barre du haut).
// Rendue par la mise en page à l'intérieur des fenêtres séance, paiement et tâche, pour que
// « Modifier » une carte puisse les ouvrir pré-remplies (calque fixe : sa place ne change rien).
export function AssistantDialog() {
  const assistant = useAssistant()!;
  const router = useRouter();
  const titleId = useId();
  const empty = assistant.messages.length === 0;
  const ready = assistantComposerOpen(assistant.access);
  const lock = assistantLockText(assistant.access);
  const remaining = remainingLabel(assistant.access);
  return (
    <Overlay
      open={assistant.open}
      onClose={assistant.closeDialog}
      labelledBy={titleId}
      size="assistant"
    >
      <div className="flex min-h-0 flex-auto flex-col gap-4 px-4 pt-4 pb-5 md:gap-5 md:px-6 md:pt-5 md:pb-5">
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

        {!ready ? (
          // Sans abonnement : le verrou, pas de saisie (aucune demande ne peut partir).
          <div className="flex flex-col gap-3.5 pb-1">
            <AssistantLockTile />
            <div className="flex flex-col gap-1.5">
              <p className="text-[20px] leading-[1.25] font-semibold tracking-[-0.02em] text-balance">
                {lock.title}
              </p>
              <p className="text-[14px] leading-[1.5] text-muted">{lock.detail}</p>
            </div>
          </div>
        ) : empty ? (
          <div className="flex flex-col gap-1.5">
            <p className="text-[24px] leading-[1.15] font-semibold tracking-[-0.02em] md:text-[22px]">
              Que veux-tu faire, {assistant.firstName} ?
            </p>
            <p className="text-[13.5px] leading-[1.45] text-muted">
              Je propose, tu décides. Mes réponses peuvent contenir des erreurs.
            </p>
          </div>
        ) : (
          <AssistantThread className="max-h-[330px]" />
        )}

        {ready ? (
          <AssistantComposer rows={2} placeholder="Demande à ton assistant…" autoFocus />
        ) : null}

        {ready && empty ? (
          <ul aria-label="Suggestions" className="flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <li key={suggestion.label}>
                <button
                  type="button"
                  onClick={() => assistant.send(suggestion.label)}
                  className="tap-44 inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-[13px] leading-[normal] font-medium text-text-2 inset-ring inset-ring-line-2 transition-colors duration-150 hover:bg-surface-2"
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
        {ready ? (
          <p className="text-center text-[12px] leading-[normal] text-faint">
            {remaining}
            <span className="max-md:hidden"> · Entrée pour envoyer · Échap pour fermer</span>
          </p>
        ) : null}
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
      {assistant.messages
        .filter((message) => !message.hidden)
        .map((message) =>
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
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                {message.text ? (
                  <p
                    className={`text-[14.5px] leading-[1.55] break-words whitespace-pre-line ${
                      message.failed ? "text-muted" : "text-text"
                    }`}
                  >
                    <span className="sr-only">Assistant : </span>
                    {message.text}
                  </p>
                ) : null}
                {message.failures && message.failures.length > 0 ? (
                  <p role="alert" className="text-[13.5px] leading-[1.45] text-alert">
                    {message.failures.length > 1
                      ? "Des actions n'ont pas pu être préparées : "
                      : "Une action n'a pas pu être préparée : "}
                    {message.failures.join(" ")}
                  </p>
                ) : null}
                {message.cards?.map((card) => (
                  <AssistantCard
                    key={card.id}
                    card={card}
                    cards={message.cards ?? []}
                    onValidate={() => assistant.validateCard(message.id, card.id)}
                    onCancel={() => assistant.cancelCard(message.id, card.id)}
                    onModify={(asked) => {
                      assistant.dropCard(message.id, card.id, asked);
                      // La fenêtre habituelle s'ouvre : la boîte de l'assistant se ferme pour elle.
                      if (!asked) assistant.closeDialog();
                    }}
                  />
                ))}
              </div>
            </li>
          ),
        )}
      {assistant.pending ? (
        <li className="flex items-center gap-3">
          <AssistantOrb size={22} />
          <span className="flex items-center gap-2 text-[14px] leading-[normal] text-muted">
            <Spinner /> {assistant.progress ?? "L'assistant réfléchit…"}
          </span>
        </li>
      ) : null}
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
  const empty = assistant.draft.trim() === "" || assistant.pending;
  // Dictée (D-173) : la voix s'écrit dans la saisie ; envoyer coupe l'écoute.
  const dictation = useDictation(() => assistant.draft, assistant.setDraft);
  const submit = () => {
    dictation.cancel();
    assistant.send(assistant.draft);
  };
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
        onChange={(event) => {
          if (dictation.listening) dictation.cancel();
          assistant.setDraft(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            submit();
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
            className="tap-44 inline-flex h-9 items-center gap-1.5 rounded-full bg-status-accent-soft px-3 text-[13px] leading-[normal] font-medium text-violet-text"
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
            className="tap-44 inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] leading-[normal] font-medium text-text-2 inset-ring inset-ring-line-2 transition-colors duration-150 hover:bg-surface-2"
          >
            <UserRound aria-hidden size={14} strokeWidth={1.9} />
            Sportif
          </button>
        )}
        <span aria-hidden className="flex-1" />
        {dictation.supported ? (
          <button
            type="button"
            aria-label={dictation.listening ? "Arrêter la dictée" : "Dicter ta demande"}
            aria-pressed={dictation.listening}
            onClick={dictation.toggle}
            className={`relative grid size-9 shrink-0 place-items-center rounded-full transition-[background-color,color,scale] duration-150 after:absolute after:-inset-1 after:rounded-full active:scale-95 ${
              dictation.listening
                ? "bg-status-accent-soft text-violet-text"
                : "text-text-2 inset-ring inset-ring-line-2 hover:bg-surface-2"
            }`}
          >
            {dictation.listening ? (
              <>
                {/* Halo d'écoute : fixe si le mouvement est réduit. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-full inset-ring-2 inset-ring-violet/55 motion-safe:animate-pulse"
                />
                <Square aria-hidden size={12} strokeWidth={0} fill="currentColor" />
              </>
            ) : (
              <Mic aria-hidden size={17} strokeWidth={1.9} />
            )}
          </button>
        ) : null}
        <button
          type="button"
          aria-label="Envoyer"
          disabled={empty}
          onClick={submit}
          className="relative grid size-9 shrink-0 place-items-center rounded-full bg-violet text-white transition-[background-color,scale] duration-150 after:absolute after:-inset-1 after:rounded-full active:scale-95 disabled:bg-dlg-check-line"
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
      <p
        aria-live="polite"
        className={`px-1 text-[12px] leading-[normal] ${dictation.error ? "text-status-danger" : "text-faint"}`}
      >
        {dictation.error ??
          (dictation.listening
            ? "Je t'écoute… Ne dicte pas de données de santé."
            : "N'écris pas de données de santé ici.")}
      </p>
    </div>
  );
}
