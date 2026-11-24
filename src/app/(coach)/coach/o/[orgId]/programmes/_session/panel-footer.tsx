// Pied des panneaux de l'éditeur de séance (Running, Musculation, Hyrox) : « Valider … » et
// « Supprimer ». Demande d'Antonino du 24/11/2026 : le bouton ne se cherche jamais. Le pied reste collé
// en bas de la zone qui défile (panneau de droite sur ordinateur, fenêtre sur téléphone), sur le fond
// du panneau (`--panel-bg`, posé par le conteneur) avec un filet, le contenu passant dessous.
// Un pied collé s'arrête au-dessus du rembourrage bas de la zone qui défile (`--panel-pad`, posé par le
// conteneur : 20 px sur ordinateur, 22 px dans la fenêtre du téléphone) : il descend d'autant pour
// toucher le bord, sinon le contenu dépasse dessous (vu sur les captures du 24/11). Les marges
// négatives couvrent aussi le rembourrage des côtés.
export function PanelFooter({
  primary,
  onDone,
  onDelete,
}: {
  primary: string;
  onDone: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      data-panel-footer=""
      className="sticky bottom-[calc(-1*var(--panel-pad,20px))] z-10 -mx-5 mt-1 -mb-[var(--panel-pad,20px)] flex gap-2 border-t border-line bg-[var(--panel-bg)] px-5 pt-3 pb-[var(--panel-pad,20px)] md:max-lg:-mx-6 md:max-lg:px-6"
    >
      <button
        type="button"
        onClick={onDone}
        className="inline-flex h-[46px] flex-1 items-center justify-center rounded-[12px] bg-cta px-4 text-[14.5px] font-semibold text-on-cta transition-[scale,background-color] duration-150 hover:bg-cta-hover active:scale-[0.98]"
      >
        {primary}
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="inline-flex h-[46px] items-center rounded-[12px] px-4 text-[14px] font-semibold text-alert inset-ring inset-ring-field-ring transition-[scale,background-color] duration-150 hover:bg-surface-2 active:scale-[0.98]"
      >
        Supprimer
      </button>
    </div>
  );
}
