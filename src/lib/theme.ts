// Thème d'affichage : CLAIR par défaut (D-33, demande d'Antonino du 23/10/2026), sombre ou « système »
// (celui de l'appareil) au choix de la personne, dans les Paramètres (D-38). Le choix vit dans CE
// navigateur (localStorage), pas dans le compte : rien n'est envoyé au serveur.
export const THEME_STORAGE_KEY = "coory-theme";

export type Theme = "dark" | "light";
export type ThemePreference = Theme | "system";

// Petit script exécuté dans <head> AVANT le premier affichage. Sans lui, la page apparaîtrait en clair
// puis basculerait en sombre une fraction de seconde plus tard (le « flash »). « system » suit
// l'appareil, y compris s'il change pendant la visite. try/catch : localStorage peut être bloqué
// (navigation privée, données refusées) ; on reste alors en clair.
export const themeInitScript = `try{var p=localStorage.getItem("${THEME_STORAGE_KEY}"),m=matchMedia("(prefers-color-scheme: dark)"),a=function(){var d=p==="dark"||(p==="system"&&m.matches);if(d)document.documentElement.dataset.theme="dark";else delete document.documentElement.dataset.theme};a();m.addEventListener("change",function(){p=localStorage.getItem("${THEME_STORAGE_KEY}");a()})}catch(e){}`;
