"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";

import { SettingsContext, type SettingsSection } from "@/components/blocks/settings-context";
import { PanelDialog } from "@/components/ui/overlay";
import { Spinner } from "@/components/ui/spinner";
import type { SettingsData } from "@/features/coach/settings-data";

import { SettingsDialogPanel } from "./settings-dialog-panel";

// Fenêtre des Paramètres (D-58, demande d'Antonino : « une boîte par-dessus, comme Claude.ai ») :
// ouverte depuis le menu du compte, par-dessus la page en cours, qu'on ne quitte pas. Ses données
// sont lues à l'ouverture, puis relues après chaque changement (photo, nom, structures).
export function SettingsDialogProvider({
  load,
  children,
}: {
  load: () => Promise<SettingsData>;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<SettingsSection | null>(null);
  const [data, setData] = useState<SettingsData | null>(null);
  const [failed, setFailed] = useState(false);
  const body = useRef<HTMLDivElement>(null);

  // Nouvelle section : on la lit depuis son début, pas depuis la hauteur de la précédente.
  const changeSection = (next: SettingsSection | null) => {
    setSection(next);
    body.current?.querySelector("[data-dialog-body]")?.scrollTo({ top: 0 });
  };

  const refresh = useCallback(() => {
    load().then(
      (next) => {
        setData(next);
        setFailed(false);
      },
      () => setFailed(true),
    );
  }, [load]);

  const openSettings = useCallback(
    (wanted: SettingsSection | null) => {
      // Sans section : le sommaire sur téléphone, la section Profil sur ordinateur (le panneau s'adapte).
      setSection(wanted);
      setOpen(true);
      refresh();
    },
    [refresh],
  );

  return (
    <SettingsContext.Provider value={openSettings}>
      {children}
      {/* Kit (boîte 33) : la fenêtre pose sa propre mise en page (colonne des sections, section). */}
      <PanelDialog open={open} onClose={() => setOpen(false)} title="Paramètres" bare>
        <div ref={body} className="flex min-h-0 flex-1 flex-col">
          {failed ? (
            <p role="alert" className="p-6 text-small text-alert">
              Les paramètres n&apos;ont pas pu être chargés. Ferme la fenêtre et réessaie.
            </p>
          ) : data ? (
            <SettingsDialogPanel
              data={data}
              section={section}
              onSection={changeSection}
              onChanged={refresh}
              onClose={() => setOpen(false)}
            />
          ) : (
            <p className="flex items-center gap-2 p-6 text-[14px] text-muted">
              <Spinner /> Chargement de tes paramètres…
            </p>
          )}
        </div>
      </PanelDialog>
    </SettingsContext.Provider>
  );
}
