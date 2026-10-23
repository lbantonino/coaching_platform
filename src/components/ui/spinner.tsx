// Indicateur d'envoi dans un bouton (prompt Claude Design §4 « Button primary », état chargement) :
// cercle de 18 px, bordure 2 px de la couleur du texte à 35 %, haut plein, un tour en 0,8 s
// (blanc sur le bouton rouge, couleur du texte sur un bouton contour).
export function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block size-[18px] shrink-0 animate-spin-fast rounded-full border-2 border-current/35 border-t-current"
    />
  );
}
