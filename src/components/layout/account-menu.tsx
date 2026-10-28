"use client";

import { ChevronDown, ChevronRight, LogOut, Settings, UserRound, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { useOpenSettings } from "@/components/blocks/settings-context";
import { Avatar } from "@/components/ui/avatar";
import { ThemeChoice } from "@/components/ui/theme-choice";
import { logout } from "@/features/auth/actions";

import { useShell } from "./shell-context";

// Menu du compte, en bas du menu de gauche et du menu hamburger (D-38, maquette d'Antonino du 24/10) :
// une carte (photo avec pastille verte « connecté », nom, rôle, flèche) qui ouvre au-dessus d'elle
// Mon profil, Paramètres, Changer de compte, Thème (Clair / Sombre / Système) et Se déconnecter. Au
// clic (et au survol à la souris) ; Échap ou un clic ailleurs le referme.
// « Changer de compte » : déconnexion puis page de connexion, pour entrer avec un autre compte
// (il n'y a pas encore de comptes multiples).
type Sex = "female" | "male" | "unspecified" | null;

function Photo({ name, photoPath, sex }: { name: string; photoPath: string | null; sex: Sex }) {
  return (
    <span className="relative inline-flex shrink-0">
      <Avatar name={name} photoPath={photoPath} sex={sex} size="sm" />
      <span
        aria-hidden
        className="absolute right-0 bottom-0 size-2.5 rounded-full bg-ok ring-2 ring-bg"
      />
    </span>
  );
}

export function AccountMenu() {
  const { user, space } = useShell();
  // Coach (D-58) : les Paramètres s'ouvrent en grande fenêtre par-dessus la page en cours.
  const openSettings = useOpenSettings();
  const [open, setOpen] = useState(false);
  // Position fixe, calculée sur la carte : la barre latérale défile et couperait un menu qui déborde.
  const [place, setPlace] = useState<{ left: number; bottom: number; width: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const closing = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Ouvert par le survol : le clic qui suit sur la carte le garde ouvert au lieu de le refermer.
  const openedByHover = useRef(false);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const measure = () => {
      const card = trigger.current?.getBoundingClientRect();
      if (!card) return;
      const wide = window.innerWidth >= 1024;
      setPlace({
        left: card.left,
        bottom: window.innerHeight - card.top + 8,
        width: wide ? Math.max(card.width, 280) : card.width,
      });
    };
    measure();
    window.addEventListener("resize", measure);
    const onPointer = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", measure);
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  useEffect(() => () => clearTimeout(closing.current), []);

  if (!user) return null;
  const hover = (next: boolean) => (event: React.PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    clearTimeout(closing.current);
    if (next) {
      if (!open) openedByHover.current = true;
      setOpen(true);
    } else closing.current = setTimeout(() => setOpen(false), 200);
  };

  const photo = <Photo name={user.name} photoPath={user.photoPath} sex={user.sex} />;
  const itemBase =
    "flex min-h-11 w-full items-center gap-3 rounded-[10px] px-3 text-left text-[15px] font-medium whitespace-nowrap transition-colors duration-150 hover:bg-surface-2";
  const item = `${itemBase} text-text`;
  const close = () => setOpen(false);
  // Téléphone : le menu hamburger est lui-même une fenêtre ; on le referme d'abord, pour retrouver
  // la page (et non le menu) en fermant les Paramètres.
  const showSettings = (section: "profil" | null) => {
    close();
    trigger.current?.closest("dialog")?.close();
    openSettings?.(section);
  };
  // Coach : la fenêtre des Paramètres (ci-dessus) ; à défaut, la page (onglet Profil, sommaire).
  // Sportif : sa page profil, et sa section Thème.
  const settings = user.settingsHref
    ? user.settingsHref.startsWith("/coach")
      ? { profile: `${user.settingsHref}?onglet=profil`, settings: user.settingsHref }
      : { profile: user.settingsHref, settings: `${user.settingsHref}#theme` }
    : null;

  return (
    <div ref={box} className="relative" onPointerEnter={hover(true)} onPointerLeave={hover(false)}>
      {open && place ? (
        <div
          id={menuId}
          style={{ left: place.left, bottom: place.bottom, width: place.width }}
          role="group"
          aria-label="Menu du compte"
          // Ordinateur : plus large que la barre latérale (le thème et « Changer de compte » tiennent
          // sur une ligne), il déborde sur la page.
          className="fixed z-50 flex flex-col rounded-wide border border-line-2 bg-bg p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.18)]"
        >
          <div className="flex items-center gap-3 px-2.5 pt-1.5 pb-3">
            {photo}
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-[15px] font-semibold">{user.name}</span>
              <span className="truncate text-[13px] text-muted">{user.role}</span>
            </span>
          </div>
          <div className="flex flex-col border-t border-line pt-1.5">
            {openSettings ? (
              <>
                <button type="button" onClick={() => showSettings("profil")} className={item}>
                  <UserRound aria-hidden size={18} strokeWidth={1.7} />
                  Mon profil
                </button>
                <button type="button" onClick={() => showSettings(null)} className={item}>
                  <Settings aria-hidden size={18} strokeWidth={1.7} />
                  Paramètres
                </button>
              </>
            ) : settings ? (
              <>
                <Link href={settings.profile} onClick={close} className={item}>
                  <UserRound aria-hidden size={18} strokeWidth={1.7} />
                  Mon profil
                </Link>
                {space === "coach" ? (
                  <Link href={settings.settings} onClick={close} className={item}>
                    <Settings aria-hidden size={18} strokeWidth={1.7} />
                    Paramètres
                  </Link>
                ) : null}
              </>
            ) : null}
          </div>
          <div className="mt-1.5 flex flex-col gap-0.5 border-t border-line pt-1.5">
            <form action={logout}>
              <button type="submit" className={item}>
                <Users aria-hidden size={18} strokeWidth={1.7} />
                <span className="flex-1">Changer de compte</span>
                <ChevronRight aria-hidden size={16} strokeWidth={1.8} className="text-muted" />
              </button>
            </form>
          </div>
          <div className="mt-1.5 flex flex-col gap-2 border-t border-line px-2 pt-2.5 pb-2">
            <span className="px-1 text-[13px] font-medium text-muted">Thème</span>
            <ThemeChoice name="theme-menu" compact />
          </div>
          <div className="mt-0.5 border-t border-line pt-1.5">
            <form action={logout}>
              <button type="submit" className={`${itemBase} text-accent-text`}>
                <LogOut aria-hidden size={18} strokeWidth={1.7} />
                Se déconnecter
              </button>
            </form>
          </div>
        </div>
      ) : null}
      <button
        ref={trigger}
        type="button"
        aria-label={`Menu du compte : ${user.name}`}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => {
          if (openedByHover.current) openedByHover.current = false;
          else setOpen((value) => !value);
        }}
        className={`flex w-full items-center gap-3 rounded-wide border bg-surface px-2.5 py-2 text-left text-text transition-colors duration-150 hover:bg-surface-2 ${
          open ? "border-accent" : "border-line"
        }`}
      >
        {photo}
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[14px] font-semibold">{user.name}</span>
          <span className="truncate text-[12px] text-muted">{user.role}</span>
        </span>
        <ChevronDown
          aria-hidden
          size={17}
          strokeWidth={1.8}
          className={`shrink-0 text-muted transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>
    </div>
  );
}
