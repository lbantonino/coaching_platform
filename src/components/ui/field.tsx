import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { errorTextClass, hintClass, labelClass } from "./form-styles";

// Champ de formulaire (prompt Claude Design §4 « Input ») : libellé 14/500 au-dessus (écart 8 px),
// mention « (facultatif) » en italique grise, erreur SOUS le champ avec l'icône « circle-alert ».
// Le champ lui-même (input, select, textarea) est passé en enfant avec l'id `id`, et doit porter
// aria-invalid et aria-describedby={`${id}-error`} quand `error` est rempli.
export function Field({
  id,
  label,
  optional = false,
  aside,
  hint,
  error,
  children,
}: {
  id: string;
  label: ReactNode;
  optional?: boolean;
  aside?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className={labelClass}>
          {label}
          {optional ? <em className="font-normal text-muted"> (facultatif)</em> : null}
        </label>
        {aside}
      </div>
      {children}
      {hint && !error ? <p className={hintClass}>{hint}</p> : null}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

export function FieldError({ id, message }: { id?: string; message?: string | null }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className={`flex items-start gap-1.5 ${errorTextClass}`}>
      <CircleAlert aria-hidden size={15} strokeWidth={2} className="mt-px shrink-0" />
      <span>{message}</span>
    </p>
  );
}
