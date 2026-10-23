"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

import { Spinner } from "@/components/ui/spinner";
import { buttonClass } from "@/components/ui/button";
import { Sheet } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import type { SessionFormState } from "@/features/sessions/actions";

import { SessionForm } from "./session-form";

// Fenêtre « Nouvelle séance » de l'espace coach (demandes d'Antonino, 23/10, D-35). La même partout,
// par-dessus la page où l'on est : clic sur un créneau vide de l'agenda (jour et heure déjà remplis),
// « Créer → Séance » du tableau de bord, bouton « Nouvelle séance » de l'Agenda et de la page Séances.
// Feuille du bas sur téléphone, fenêtre centrée sur ordinateur. Après « Créer la séance », on reste
// sur la page : la fenêtre se ferme, un toast confirme et la page se met à jour. Il n'y a plus de page
// « Nouvelle séance » à part. Les sportifs proposés sont lus à chaque ouverture (fiches récentes).
type Slot = { date: string; time: string; label?: string };
type Athlete = { id: string; name: string };

const OpenContext = createContext<((slot?: Partial<Slot>) => void) | null>(null);

// Ouvre la fenêtre ; null hors de l'espace coach (la grille n'est alors pas cliquable).
export function useOpenNewSession() {
  return useContext(OpenContext);
}

const DEFAULT_TIME = "19:00";
const todayInBrussels = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Brussels" }).format(new Date());

export function NewSessionSheet({
  action,
  loadAthletes,
  children,
}: {
  action: (previous: SessionFormState, formData: FormData) => Promise<SessionFormState>;
  loadAthletes: () => Promise<Athlete[]>;
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
      });
      loadAthletes().then(setAthletes, () => setAthletes([]));
    },
    [loadAthletes],
  );
  const close = useCallback(() => setSlot(null), []);
  const onCreated = useCallback(() => {
    setSlot(null);
    toast("Séance créée.");
    router.refresh();
  }, [router, toast]);

  return (
    <OpenContext.Provider value={open}>
      {children}
      <Sheet open={slot !== null} onClose={close} title="Nouvelle séance" subtitle={slot?.label}>
        {slot && athletes === null ? (
          <p className="flex items-center gap-2 text-[14px] text-muted">
            <Spinner /> Chargement de tes sportifs…
          </p>
        ) : slot && athletes ? (
          <SessionForm
            action={action}
            athletes={athletes}
            initial={{
              kind: "individual",
              title: "",
              discipline: "",
              location: "",
              startsOn: slot.date,
              startTime: slot.time,
              durationMinutes: "60",
              repeatsWeekly: false,
              endsOn: "",
              athleteId: "",
              athleteIds: [],
              newClient: false,
              prospectName: "",
              notes: "",
            }}
            locked={false}
            submitLabel="Créer la séance"
            onCreated={onCreated}
          />
        ) : null}
      </Sheet>
    </OpenContext.Provider>
  );
}

// Bouton rouge « Nouvelle séance » (Agenda, Séances) : ouvre la fenêtre, à `date` si elle est donnée.
export function NewSessionButton({ date }: { date?: string }) {
  const open = useOpenNewSession();
  return (
    <button
      type="button"
      disabled={!open}
      onClick={() => open?.(date ? { date } : undefined)}
      className={buttonClass()}
    >
      <Plus aria-hidden size={16} strokeWidth={2} />
      Nouvelle séance
    </button>
  );
}
