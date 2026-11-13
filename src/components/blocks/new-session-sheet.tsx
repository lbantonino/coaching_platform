"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

import { phoneFabClass } from "@/components/layout/mobile-bar";
import { Spinner } from "@/components/ui/spinner";
import { buttonClass } from "@/components/ui/button";
import { DialogBody, Sheet } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import type { Discipline } from "@/domain/training/discipline";
import type { SessionFormState } from "@/features/sessions/actions";
import type { SessionFormInput } from "@/features/sessions/schemas";

import { SessionForm } from "./session-form";

// Fenêtre « Nouvelle séance » de l'espace coach (demandes d'Antonino, 23/10, D-35). La même partout,
// par-dessus la page où l'on est : clic sur un créneau vide de l'agenda (jour et heure déjà remplis),
// « Créer → Séance » du tableau de bord, bouton « Nouvelle séance » de l'Agenda et de la page Séances.
// Feuille du bas sur téléphone, fenêtre centrée sur ordinateur. Après « Créer la séance », on reste
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
};
type Athlete = { id: string; name: string };

const OpenContext = createContext<((slot?: Partial<Slot>) => void) | null>(null);

// Ouvre la fenêtre ; null hors de l'espace coach (la grille n'est alors pas cliquable).
export function useOpenNewSession() {
  return useContext(OpenContext);
}

const DEFAULT_TIME = "19:00";
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
  const [athletes, setAthletes] = useState<Athlete[] | null>(null);
  const router = useRouter();
  const toast = useToast();

  const open = useCallback(
    (wanted?: Partial<Slot>) => {
      setAthletes(null);
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
  const close = useCallback(() => setSlot(null), []);
  const onCreated = useCallback(
    (created: { newAthleteName: string | null }) => {
      setSlot(null);
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
      {children}
      <Sheet
        open={slot !== null}
        onClose={close}
        title="Nouvelle séance"
        subtitle={slot?.label ?? "Elle apparaît tout de suite dans l'agenda."}
        tall
        bare
      >
        {slot && athletes === null ? (
          <DialogBody>
            <p className="flex items-center gap-2 text-[14px] text-muted">
              <Spinner /> Chargement de tes sportifs…
            </p>
          </DialogBody>
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
          />
        ) : null}
      </Sheet>
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
