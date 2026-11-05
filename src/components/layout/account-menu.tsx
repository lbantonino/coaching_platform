"use client";

import { ChevronDown, ChevronRight, LogOut, Settings, UserRound, Users } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";

import { useOpenSettings } from "@/components/blocks/settings-context";
import { Avatar } from "@/components/ui/avatar";
import {
  MenuDialog,
  MenuSectionTitle,
  MenuSeparator,
  MenuTile,
  menuRowClass,
  type MenuAnchor,
} from "@/components/ui/overlay";
import { ThemeChoice } from "@/components/ui/theme-choice";
import { logout } from "@/features/auth/actions";

import { useMobileMenu } from "./mobile-menu-context";
import { useShell } from "./shell-context";

// Menu du compte, en bas du menu de gauche et du menu hamburger (D-38, maquette d'Antonino du 24/10) :
// une carte (photo avec pastille verte « connecté », nom, rôle, flèche) qui ouvre au-dessus d'elle
// Mon profil, Paramètres, Changer de compte, Thème (Clair / Sombre / Système) et Se déconnecter. Au
// clic ; Échap ou un clic sur le voile le referme (kit des boîtes, 32 : menu ancré en bas à gauche).
// « Changer de compte » : déconnexion puis page de connexion, pour entrer avec un autre compte
// (il n'y a pas encore de comptes multiples).
type Sex = "female" | "male" | "unspecified" | null;

function Photo({
  name,
  photoPath,
  sex,
  large = false,
}: {
  name: string;
  photoPath: string | null;
  sex: Sex;
  // 46 px dans le menu (kit, boîte 32), pastille verte de 12 px cerclée de blanc.
  large?: boolean;
}) {
  return (
    // Cerclée de violet (02/11), comme la photo de la carte « Prochaine séance ».
    <span className="relative inline-flex shrink-0 rounded-full outline outline-[1.5px] outline-offset-2 outline-violet">
      <Avatar name={name} photoPath={photoPath} sex={sex} size={large ? "menu" : "sm"} />
      <span
        aria-hidden
        className={`absolute rounded-full bg-ok ${
          large
            ? "-right-px -bottom-px size-3 ring-2 ring-dlg"
            : "-right-0.5 -bottom-0.5 size-2.5 ring-2 ring-panel"
        }`}
      />
    </span>
  );
}

export function AccountMenu() {
  const { user, space } = useShell();
  // Coach (D-58) : les Paramètres s'ouvrent en grande fenêtre par-dessus la page en cours.
  const openSettings = useOpenSettings();
  const { closeMenu } = useMobileMenu();
  // Kit (boîte 32) : sur ordinateur, menu ancré de 320 px en bas à gauche, au-dessus de la carte du
  // coach, voile derrière ; sur téléphone, feuille du bas. Ouvert au clic (plus au survol : le voile
  // ne doit pas apparaître sous un simple passage de la souris).
  const [anchor, setAnchor] = useState<MenuAnchor | null>(null);
  const [open, setOpen] = useState(false);
  const menuId = useId();

  if (!user) return null;
  const photo = <Photo name={user.name} photoPath={user.photoPath} sex={user.sex} />;
  const close = () => setOpen(false);
  // Téléphone : on referme d'abord le menu ☰, pour retrouver la page (et non le menu) en fermant les
  // Paramètres.
  const showSettings = (section: "profil" | null) => {
    close();
    closeMenu();
    openSettings?.(section);
  };
  // Coach : la fenêtre des Paramètres (ci-dessus) ; à défaut, son adresse (/coach/profil ouvre la
  // fenêtre par-dessus le tableau de bord, D-127).
  // Sportif : sa page profil, et sa section Thème.
  const settings = user.settingsHref
    ? user.settingsHref.startsWith("/coach")
      ? { profile: `${user.settingsHref}?onglet=profil`, settings: user.settingsHref }
      : { profile: user.settingsHref, settings: `${user.settingsHref}#theme` }
    : null;
  const row = menuRowClass({ anchored: true });
  const label = "min-w-0 flex-1 text-[15.5px] leading-[normal] font-semibold text-text";

  return (
    <>
      <MenuDialog open={open} onClose={close} label="Menu du compte" anchor={anchor}>
        <div id={menuId} role="group" aria-label="Menu du compte" className="flex flex-col gap-0.5">
          <div className="flex items-center gap-3 px-3 pt-2.5 pb-3">
            <Photo name={user.name} photoPath={user.photoPath} sex={user.sex} large />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-[16px] leading-[normal] font-bold">{user.name}</span>
              <span className="truncate text-[13px] leading-[normal] text-muted">{user.role}</span>
            </span>
          </div>
          <MenuSeparator />
          {openSettings ? (
            <>
              <button type="button" onClick={() => showSettings("profil")} className={row}>
                <MenuTile icon={UserRound} />
                <span className={label}>Mon profil</span>
              </button>
              <button type="button" onClick={() => showSettings(null)} className={row}>
                <MenuTile icon={Settings} />
                <span className={label}>Paramètres</span>
              </button>
            </>
          ) : settings ? (
            <>
              <Link href={settings.profile} onClick={close} className={row}>
                <MenuTile icon={UserRound} />
                <span className={label}>Mon profil</span>
              </Link>
              {space === "coach" ? (
                <Link href={settings.settings} onClick={close} className={row}>
                  <MenuTile icon={Settings} />
                  <span className={label}>Paramètres</span>
                </Link>
              ) : null}
            </>
          ) : null}
          {/* « Changer de compte » : déconnexion puis page de connexion (pas encore de comptes
              multiples). */}
          <form action={logout} onSubmit={close}>
            <button type="submit" className={row}>
              <MenuTile icon={Users} />
              <span className={label}>Changer de compte</span>
              <ChevronRight
                aria-hidden
                size={18}
                strokeWidth={2}
                className="shrink-0 text-dlg-chev"
              />
            </button>
          </form>
          <MenuSeparator />
          <MenuSectionTitle>THÈME</MenuSectionTitle>
          <ThemeChoice name="theme-menu" look="dialog" />
          <MenuSeparator />
          <form action={logout} onSubmit={close}>
            <button type="submit" className={row}>
              <MenuTile icon={LogOut} destructive />
              <span className="min-w-0 flex-1 text-[15.5px] leading-[normal] font-semibold text-dlg-danger-ink">
                Se déconnecter
              </span>
            </button>
          </form>
        </div>
      </MenuDialog>
      <button
        type="button"
        aria-label={`Menu du compte : ${user.name}`}
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => {
          // Ordinateur : 24 px du bord gauche et du bas de l'écran, comme le kit (la barre latérale
          // est à 14 px des bords).
          setAnchor({ x: 24, y: 24, side: "bottom", width: 320 });
          setOpen(true);
        }}
        // Sans bordure (02/11) : la photo cerclée, le nom, le rôle et la flèche ; fond au survol et
        // tant que le menu est ouvert.
        // min-h 55 px : la même hauteur menu replié (photo seule) et déplié (photo, nom, rôle), pour que
        // la photo ne bouge pas quand le menu se replie (demande d'Antonino du 04/11).
        className={`flex min-h-[55px] w-full items-center gap-2.5 rounded-wide p-2 text-left text-text transition-colors duration-150 hover:bg-surface-2 ${
          open ? "bg-surface-2" : ""
        }`}
      >
        {photo}
        <span data-account-text="" className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[14px] font-semibold">{user.name}</span>
          <span className="truncate text-[12px] text-muted">{user.role}</span>
        </span>
        <ChevronDown
          data-account-chevron=""
          aria-hidden
          size={17}
          strokeWidth={1.8}
          className={`shrink-0 text-muted transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>
    </>
  );
}
