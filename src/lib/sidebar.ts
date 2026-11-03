// Menu de gauche repliable (ordinateur, 29/10/2026) : l'état est retenu dans ce navigateur.
export const SIDEBAR_STORAGE_KEY = "coory-sidebar";

// Exécuté dans <head> avant le premier affichage : un menu masqué ne réapparaît pas une fraction de
// seconde au chargement.
// Page Agenda (D-78) : le menu s'y ouvre replié (comme Google Agenda, pour laisser la place au panneau
// de l'agenda), sans toucher au choix retenu ; data-agenda marque aussi la page.
export const AGENDA_PATH = "^/coach/o/[^/]+/agenda/?$";
export const sidebarInitScript = `try{var h=document.documentElement;if(new RegExp("${AGENDA_PATH}").test(location.pathname)){h.dataset.sidebar="hidden";h.dataset.sidebarAuto="";h.dataset.agenda=""}else if(localStorage.getItem("${SIDEBAR_STORAGE_KEY}")==="hidden")h.dataset.sidebar="hidden"}catch(e){}`;
