"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

import { phoneFabClass } from "@/components/layout/mobile-bar";
import { Spinner } from "@/components/ui/spinner";
import { buttonClass } from "@/components/ui/button";
import { Overlay, type MenuAnchor } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import type { Discipline } from "@/domain/training/discipline";
import type { SessionFormState } from "@/features/sessions/actions";
import type { SessionFormInput } from "@/features/sessions/schemas";

import type { SessionDraft } from "./session-apple-fields";
import { SessionForm } from "./session-form";

// Fenêtre « Nouvelle séance » de l'espace coach (demandes d'Antonino, 23/10, D-35). La même partout,
// par-dessus la page où l'on est : clic sur un créneau vide de l'agenda (jour et heure déjà remplis),
// « Créer → Séance » du tableau de bord, bouton « Nouvelle séance » de l'Agenda et de la page Séances.
// Façon Calendrier d'Apple (D-204) : feuille du bas sur téléphone ; sur ordinateur, bulle accrochée au
// créneau cliqué dans la grille, sinon fenêtre centrée. Après « Créer la séance », on reste
// sur la page : la fenêtre se ferme, un toast confirme et la page se met à jour. Il n'y a plus de page
// « Nouvelle séance » à part. Les sportifs proposés sont lus à chaque ouverture (fiches récentes).
// Depuis la fiche d'un sportif (« + Créer → Séance », 26/10) : séance individuelle avec ce sportif
// déjà choisi, et la discipline de son type de programme.
type Slot = {
  date: string;
  time: string;
  label?: string;
  athleteId?: string;
  discipline?: Discipline | null;
  // « Modifier » une carte de l'Assistant IA : toute la séance proposée, pré-remplie.
  values?: Partial<SessionFormInput>;
  // Créneau cliqué dans la grille (px, à l'écran) : sur ordinateur, la bulle s'y accroche (D-204).
  rect?: SlotRect;
};
export type SlotRect = { left: number; right: number; top: number };
type Athlete = { id: string; name: string };

const OpenContext = createContext<((slot?: Partial<Slot>) => void) | null>(null);
// Séance provisoire de la bulle de l'ordinateur : la grille la dessine à son heure (comme le Mac).
const DraftContext = createContext<SessionDraft | null>(null);

// Ouvre la fenêtre ; null hors de l'espace coach (la grille n'est alors pas cliquable).
export function useOpenNewSession() {
  return useContext(OpenContext);
}

export function useNewSessionDraft() {
  return useContext(DraftContext);
}

const DEFAULT_TIME = "19:00";
const DESKTOP = "(min-width: 1024px)";
const POPOVER_WIDTH = 440;
const EDGE = 16;

// Bulle du Mac : à droite du créneau (à gauche s'il n'y a pas la place), alignée sur lui, sans sortir
// de l'écran. Sa hauteur suit la fenêtre (720 px au plus, 24 px des bords : voir Overlay).
function popoverAnchor(rect: SlotRect): MenuAnchor {
  const width = Math.min(POPOVER_WIDTH, window.innerWidth - 2 * EDGE);
  const right = rect.right + 8;
  const x =
    right + width <= window.innerWidth - EDGE ? right : Math.max(EDGE, rect.left - 8 - width);
  const height = Math.min(720, window.innerHeight - 48);
  const y = Math.max(24, Math.min(rect.top - 24, window.innerHeight - 24 - height));
  return { x, y, side: "top", width };
}
const todayInBrussels = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Brussels" }).format(new Date());

// Valeurs proposées d'office (Paramètres > Préférences, D-57) : durée, lieu, prix et mode de
// paiement ; la TVA suit le mode (virement = hors TVA, espèces = TVA comprise, D-52).
export type SessionDefaults = {
  durationMinutes: number;
  location: string | null;
  priceCents: number | null;
  paymentMethod: "cash" | "transfer";
};

// 6500 -> « 65 » ; 6550 -> « 65,50 ».
const priceText = (cents: number | null) =>
  cents === null ? "" : (cents / 100).toFixed(2).replace(".", ",").replace(/,00$/, "");

export function NewSessionSheet({
  action,
  loadAthletes,
  defaults,
  children,
}: {
  action: (previous: SessionFormState, formData: FormData) => Promise<SessionFormState>;
  loadAthletes: () => Promise<Athlete[]>;
  defaults: SessionDefaults;
  children: ReactNode;
}) {
  const [slot, setSlot] = useState<Slot | null>(null);
  // Gardés d'une ouverture à l'autre : la fenêtre s'ouvre tout de suite, la liste se relit derrière.
  const [athletes, setAthletes] = useState<Athlete[] | null>(null);
  const [anchor, setAnchor] = useState<MenuAnchor | null>(null);
  const [draft, setDraft] = useState<SessionDraft | null>(null);
  const router = useRouter();
  const toast = useToast();

  const open = useCallback(
    (wanted?: Partial<Slot>) => {
      setAnchor(
        wanted?.rect && window.matchMedia(DESKTOP).matches ? popoverAnchor(wanted.rect) : null,
      );
      setDraft(null);
      setSlot({
        date: wanted?.date ?? todayInBrussels(),
        time: wanted?.time ?? DEFAULT_TIME,
        label: wanted?.label,
        athleteId: wanted?.athleteId,
        discipline: wanted?.discipline,
        values: wanted?.values,
      });
      loadAthletes().then(setAthletes, () => setAthletes([]));
    },
    [loadAthletes],
  );
  const close = useCallback(() => {
    setSlot(null);
    setDraft(null);
  }, []);
  const onCreated = useCallback(
    (created: { newAthleteName: string | null }) => {
      setSlot(null);
      setDraft(null);
      toast(
        created.newAthleteName
          ? `Séance créée. Fiche de ${created.newAthleteName} ajoutée à tes sportifs, à compléter.`
          : "Séance créée.",
      );
      router.refresh();
    },
    [router, toast],
  );

  return (
    <OpenContext.Provider value={open}>
      <DraftContext.Provider value={draft}>{children}</DraftContext.Provider>
      <Overlay
        open={slot !== null}
        onClose={close}
        label={slot?.label ? `Nouvelle séance, ${slot.label}` : "Nouvelle séance"}
        size="event"
        anchor={anchor}
        tall
      >
        {slot && athletes === null ? (
          <p className="flex items-center gap-2 px-5 py-6 text-[14px] text-muted">
            <Spinner /> Chargement de tes sportifs…
          </p>
        ) : slot && athletes ? (
          <SessionForm
            action={action}
            athletes={athletes}
            initial={{
              kind: "individual",
              title: "",
              discipline: slot.discipline ?? "",
              location: defaults.location ?? "",
              startsOn: slot.date,
              startTime: slot.time,
              durationMinutes: String(defaults.durationMinutes),
              repeatsWeekly: false,
              endsOn: "",
              athleteId: slot.athleteId ?? "",
              athleteIds: [],
              newClient: false,
              newAthleteName: "",
              notes: "",
              price: priceText(defaults.priceCents),
              // TVA (D-163) : décochée par défaut ; cochée, le taux normal du pays est proposé.
              applyVat: false,
              vatRate: "",
              vatIncluded: defaults.paymentMethod === "cash",
              paymentMethod: defaults.paymentMethod,
              ...slot.values,
            }}
            locked={false}
            submitLabel="Créer la séance"
            onCreated={onCreated}
            onCancel={close}
            layout={anchor ? "popover" : "sheet"}
            onDraft={anchor ? setDraft : undefined}
          />
        ) : null}
      </Overlay>
    </OpenContext.Provider>
  );
}

// Bouton rouge « Nouvelle séance » (Agenda, Séances) : ouvre la fenêtre, à `date` si elle est donnée.
// `variant` : « header » (barre du haut de l'Agenda, 32 px, D-78) ; « fab » (Agenda sur téléphone,
// 03/11, comme Google Agenda : le bouton flottant en bas à droite, modèle de toutes les pages, D-117).
export function NewSessionButton({
  date,
  variant = "default",
}: {
  date?: string;
  variant?: "default" | "header" | "fab";
}) {
  const open = useOpenNewSession();
  if (variant === "fab") {
    return (
      <button
        type="button"
        aria-label="Nouvelle séance"
        disabled={!open}
        onClick={() => open?.(date ? { date } : undefined)}
        data-phone-fab=""
        className={phoneFabClass}
      >
        <Plus aria-hidden size={24} strokeWidth={2.2} />
      </button>
    );
  }
  return (
    <button
      type="button"
      disabled={!open}
      onClick={() => open?.(date ? { date } : undefined)}
      className={buttonClass({
        className:
          variant === "header"
            ? "lg:h-8 lg:rounded-lg lg:px-3.5 lg:text-[12px] lg:font-medium"
            : "",
      })}
    >
      <Plus aria-hidden size={16} strokeWidth={2} />
      Nouvelle séance
    </button>
  );
}
