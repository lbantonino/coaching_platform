// Adresses de l'éditeur de séance, utilisées côté serveur ET navigateur (module sans "use client").

// Retour à l'éditeur du programme, ouvert sur la semaine et la séance qu'on vient de modifier.
// `editorReturn` : l'éditeur avait été ouvert depuis la fiche du sportif (revue MVP du 13/11, B15) ;
// il garde ce retour.
export function programHref(meta: {
  base: string;
  programId: string;
  weekIndex: number;
  sessionKey: string;
  editorReturn?: string | null;
}): string {
  return `${meta.base}/${meta.programId}?semaine=${meta.weekIndex}&seance=${meta.sessionKey}${withReturn(meta.editorReturn)}`;
}

const withReturn = (href: string | null | undefined) =>
  href ? `&retour=${encodeURIComponent(href)}` : "";

// Adresse d'une autre séance du même programme (« Dupliquer la séance »), qui garde les retours de
// celle d'où l'on vient (revue MVP du 13/11, B16).
export function sessionHref(
  meta: { base: string; programId: string; editorReturn?: string | null },
  key: string,
  returnTo: string | null,
): string {
  const query = returnTo
    ? `?retour=${encodeURIComponent(returnTo)}`
    : meta.editorReturn
      ? `?editeur=${encodeURIComponent(meta.editorReturn)}`
      : "";
  return `${meta.base}/${meta.programId}/seances/${encodeURIComponent(key)}${query}`;
}

// Une adresse de fiche de sportif de CETTE organisation (jamais une adresse quelconque reçue dans
// l'URL), sinon null.
export function ficheReturn(value: unknown, organizationId: string): string | null {
  return typeof value === "string" &&
    value.startsWith(`/coach/o/${organizationId}/sportifs/`) &&
    !value.includes("//")
    ? value
    : null;
}
