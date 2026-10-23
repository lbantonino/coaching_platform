// Thème d'affichage : CLAIR par défaut (D-33, demande d'Antonino du 23/10/2026), sombre au choix de la
// personne. Le choix vit dans CE navigateur (localStorage), pas dans le compte : rien n'est envoyé au serveur.
export const THEME_STORAGE_KEY = "coory-theme";

export type Theme = "dark" | "light";

// Petit script exécuté dans <head> AVANT le premier affichage. Sans lui, la page apparaîtrait en clair
// puis basculerait en sombre une fraction de seconde plus tard (le « flash »). try/catch : localStorage
// peut être bloqué (navigation privée, données refusées) ; on reste alors en clair.
export const themeInitScript = `try{if(localStorage.getItem("${THEME_STORAGE_KEY}")==="dark")document.documentElement.dataset.theme="dark"}catch(e){}`;
