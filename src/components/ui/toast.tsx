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
const DURATION_MS = 2800;

const ToastContext = createContext<(message: string) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback((next: string) => {
    clearTimeout(timer.current);
    setMessage(next);
    timer.current = setTimeout(() => setMessage(null), DURATION_MS);
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
        {message ? (
          <p className="max-w-full rounded-wide bg-inv px-4 py-3 text-center text-[14px] leading-[1.4] font-medium text-on-inv">
            {message}
          </p>
        ) : null}
      </div>
    </ToastContext.Provider>
  );
}
