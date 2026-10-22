// Thème d'affichage : sombre par défaut (design system Coory), clair au choix de la personne.
// Le choix vit dans CE navigateur (localStorage), pas dans le compte : rien n'est envoyé au serveur.
export const THEME_STORAGE_KEY = "coory-theme";

export type Theme = "dark" | "light";

// Petit script exécuté dans <head> AVANT le premier affichage. Sans lui, la page apparaîtrait en sombre
// puis basculerait en clair une fraction de seconde plus tard (le « flash »). try/catch : localStorage
// peut être bloqué (navigation privée, données refusées) ; on reste alors en sombre.
export const themeInitScript = `try{if(localStorage.getItem("${THEME_STORAGE_KEY}")==="light")document.documentElement.dataset.theme="light"}catch(e){}`;
