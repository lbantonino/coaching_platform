// Thème d'affichage : GRAPHITE (sombre) par défaut depuis le design system « Graphite & Or » du
// 29/10/2026 (avant : clair, D-33). Clair ou « système »
// (celui de l'appareil) au choix de la personne, dans les Paramètres (D-38). Le choix vit dans CE
// navigateur (localStorage), pas dans le compte : rien n'est envoyé au serveur.
export const THEME_STORAGE_KEY = "coory-theme";

export type Theme = "dark" | "light";
export type ThemePreference = Theme | "system";

// Petit script exécuté dans <head> AVANT le premier affichage. Sans lui, la page apparaîtrait en
// graphite puis basculerait en clair une fraction de seconde plus tard (le « flash »). « system »
// suit l'appareil, y compris s'il change pendant la visite. try/catch : localStorage peut être
// bloqué (navigation privée, données refusées) ; on reste alors en graphite.
// data-theme vaut toujours "dark" ou "light" : les deux blocs de tokens.css s'appliquent sans ambiguïté.
export const themeInitScript = `try{var p=localStorage.getItem("${THEME_STORAGE_KEY}"),m=matchMedia("(prefers-color-scheme: dark)"),a=function(){var l=p==="light"||(p==="system"&&!m.matches);document.documentElement.dataset.theme=l?"light":"dark"};a();m.addEventListener("change",function(){p=localStorage.getItem("${THEME_STORAGE_KEY}");a()})}catch(e){document.documentElement.dataset.theme="dark"}`;
