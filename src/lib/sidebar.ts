// Menu de gauche repliable (ordinateur, 29/10/2026) : l'état est retenu dans ce navigateur.
export const SIDEBAR_STORAGE_KEY = "coory-sidebar";

// Exécuté dans <head> avant le premier affichage : un menu masqué ne réapparaît pas une fraction de
// seconde au chargement.
export const sidebarInitScript = `try{if(localStorage.getItem("${SIDEBAR_STORAGE_KEY}")==="hidden")document.documentElement.dataset.sidebar="hidden"}catch(e){}`;
