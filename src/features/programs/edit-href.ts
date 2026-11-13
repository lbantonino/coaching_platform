// « Modifier la séance » depuis la fiche d'un sportif (onglets Programme et Agenda, demande d'Antonino
// du 10/11) : l'éditeur de la séance si elle est encore dans le brouillon (la clé d'une séance publiée
// est celle du brouillon), sinon l'éditeur du programme ouvert sur sa semaine (séance supprimée ou
// déplacée depuis la publication).
export function sessionEditHref(
  editorHref: string,
  draftKeys: ReadonlySet<string>,
  weekIndex: number,
  key: string,
  // La page de la fiche où revenir après « Terminer » (onglet et semaine).
  returnTo?: string,
): string {
  // Dans les deux cas, le retour ramène à la fiche (revue MVP du 13/11, B15).
  const back = returnTo ? encodeURIComponent(returnTo) : null;
  return draftKeys.has(key)
    ? `${editorHref}/seances/${encodeURIComponent(key)}${back ? `?retour=${back}` : ""}`
    : `${editorHref}?semaine=${weekIndex}&seance=${encodeURIComponent(key)}${back ? `&retour=${back}` : ""}`;
}
