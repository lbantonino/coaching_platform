import type { AthleteDetail } from "@/features/athletes/queries";
import { getAthleteNotes } from "@/features/notes/queries";
import { formatDateTimeShort } from "@/lib/format";

import { HealthNotesBlock } from "./health-notes-block";
import { NoteForm } from "./note-form";

// Onglet « Notes » (P2-03 fin, D-56), d'après la maquette « Sportifs » du 03/11/2026 (page 2i), avec
// les choix d'Antonino du 04/11 : « Notes libres » en haut, pleine largeur, puis « Blessures et points
// d'attention » (qui descend jusqu'au bas du menu sur ordinateur). La carte « Message au sportif » est
// retirée (les sportifs n'installeront pas tous l'app) ; les messages déjà enregistrés restent en base,
// sans être affichés.
export async function NotesSection({
  organizationId,
  athlete,
}: {
  organizationId: string;
  athlete: AthleteDetail;
}) {
  const notes = await getAthleteNotes(organizationId, athlete.id);

  return (
    <div className="flex flex-col gap-4 lg:flex-1">
      <section
        aria-labelledby="free-notes-title"
        className="flex min-w-0 flex-col gap-4 rounded-[20px] bg-surface p-[22px] inset-ring inset-ring-line-soft"
      >
        <div className="flex flex-col gap-1">
          <h2
            id="free-notes-title"
            className="text-[17px] leading-[21.5px] font-semibold tracking-[-0.01em]"
          >
            Notes libres
          </h2>
          <p id="free-notes-hint" className="text-[13.5px] leading-[1.5] text-pretty text-muted">
            Caractère, préférences, logistique… Visible seulement par les coachs de ton
            organisation.
          </p>
        </div>
        <NoteForm
          organizationId={organizationId}
          athleteId={athlete.id}
          visibility="coach"
          label="Notes libres"
          labelledBy="free-notes-title"
          describedBy="free-notes-hint"
          placeholder="Ex. : très investie, préfère les séances du matin ; vise la catégorie Pro"
          body={notes.coach?.body ?? ""}
          updatedLabel={notes.coach ? formatDateTimeShort(notes.coach.updatedAt) : null}
        />
      </section>

      <HealthNotesBlock organizationId={organizationId} athlete={athlete} />
    </div>
  );
}
