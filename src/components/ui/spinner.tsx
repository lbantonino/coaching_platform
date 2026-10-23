// Indicateur d'envoi dans un bouton (prompt Claude Design §4 « Button primary », état chargement) :
// cercle de 18 px, bordure 2 px blanche à 35 %, haut blanc, un tour en 0,8 s.
export function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block size-[18px] shrink-0 animate-spin-fast rounded-full border-2 border-white/35 border-t-white"
    />
  );
}
