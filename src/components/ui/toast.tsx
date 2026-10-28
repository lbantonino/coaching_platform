"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

// Message bref en bas de l'écran (prompt Claude Design §4 « Toast ») : centré, fond « text », texte
// « bg », 14/500, rayon 14, visible 2,8 s. Zone aria-live « polite », présente dès le chargement
// pour que les lecteurs d'écran annoncent chaque message sans interrompre. Pas de role="status" :
// la zone vide se confondrait avec les messages de statut des formulaires.
// Un seul message à la fois ; le suivant remplace le précédent.
// Avec `action` (audit apple-design du 28/10 : pouvoir réparer une erreur), le message porte un
// bouton (« Annuler ») et reste 5 s, le temps de l'atteindre.
const DURATION_MS = 2800;
const ACTION_DURATION_MS = 5000;

export type ToastAction = { label: string; onClick: () => void };
type Show = (message: string, options?: { action?: ToastAction }) => void;

const ToastContext = createContext<Show>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; action?: ToastAction } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback<Show>((message, options) => {
    clearTimeout(timer.current);
    setToast({ message, action: options?.action });
    timer.current = setTimeout(
      () => setToast(null),
      options?.action ? ACTION_DURATION_MS : DURATION_MS,
    );
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-0 bottom-[76px] z-[60] flex justify-center px-4 md:bottom-8"
      >
        {toast ? (
          <p className="pointer-events-auto flex max-w-full items-center gap-3 rounded-wide bg-inv py-1.5 pr-1.5 pl-4 text-[14px] leading-[1.4] font-medium text-on-inv">
            <span className={toast.action ? "py-1.5" : "py-1.5 pr-2.5"}>{toast.message}</span>
            {toast.action ? (
              <button
                type="button"
                onClick={() => {
                  clearTimeout(timer.current);
                  setToast(null);
                  toast.action?.onClick();
                }}
                className="min-h-11 shrink-0 rounded-control px-3 font-semibold text-on-inv underline-offset-4 transition-colors duration-150 hover:underline active:bg-[color-mix(in_srgb,var(--on-inv)_14%,transparent)]"
              >
                {toast.action.label}
              </button>
            ) : null}
          </p>
        ) : null}
      </div>
    </ToastContext.Provider>
  );
}
