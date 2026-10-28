import type { AthleteDetail } from "@/features/athletes/queries";
import { getAthleteNotes } from "@/features/notes/queries";
import { formatDateTime } from "@/lib/format";

import { HealthNotesBlock } from "./health-notes-block";
import { NoteForm } from "./note-form";

// Onglet « Notes » (P2-03 fin, D-56) : les blessures et points d'attention (avec l'accord du
// sportif), les notes libres (privées, entre coachs) et le message visible par le sportif.
export async function NotesSection({
  organizationId,
  athlete,
}: {
  organizationId: string;
  athlete: AthleteDetail;
}) {
  const athleteId = athlete.id;
  const hasAccount = athlete.hasAccount;
  const notes = await getAthleteNotes(organizationId, athleteId);

  return (
    <section
      aria-labelledby="notes-title"
      className="flex flex-col gap-6 rounded-card border border-line bg-surface p-5 md:p-[22px]"
    >
      <div className="flex flex-col gap-1">
        <h2 id="notes-title" className="text-title font-medium">
          Notes
        </h2>
        <p className="text-small text-muted">
          Les blessures, avec l&apos;accord du sportif ; tes notes libres, entre coachs ; et un
          message qu&apos;il lit dans son espace. Vider une note puis l&apos;enregistrer la
          supprime.
        </p>
      </div>

      <HealthNotesBlock organizationId={organizationId} athlete={athlete} />

      <div className="flex flex-col gap-2 border-t border-line pt-6">
        <NoteForm
          organizationId={organizationId}
          athleteId={athleteId}
          visibility="coach"
          label="Notes libres"
          hint="Caractère, préférences, logistique… Visible seulement par les coachs de ton organisation. Pas de blessures ici : elles vont dans « Blessures et points d'attention », avec l'accord du sportif."
          placeholder="Ex. : très investie, préfère les séances du matin ; vise la catégorie Pro"
          body={notes.coach?.body ?? ""}
        />
        {notes.coach ? (
          <p className="text-caption text-faint">
            Mise à jour le {formatDateTime(notes.coach.updatedAt)}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 border-t border-line pt-6">
        <NoteForm
          organizationId={organizationId}
          athleteId={athleteId}
          visibility="athlete"
          label="Message au sportif"
          hint={
            hasAccount
              ? "Le sportif le lit dans son espace, sous « Message de ton coach »."
              : "Le sportif le lira dans son espace une fois son compte activé."
          }
          placeholder="Ex. : semaine de reprise, garde l'endurance vraiment facile"
          body={notes.athlete?.body ?? ""}
        />
        {notes.athlete ? (
          <p className="text-caption text-faint">
            Mis à jour le {formatDateTime(notes.athlete.updatedAt)}
          </p>
        ) : null}
      </div>
    </section>
  );
}
