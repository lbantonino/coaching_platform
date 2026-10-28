"use client";

import { useEffect } from "react";

// Retour à l'appui (audit apple-design du 28/10) : sur iPhone, Safari n'applique l'état CSS :active
// (bouton qui s'enfonce, ligne qui s'assombrit) que si la page écoute le toucher. Un écouteur vide et
// passif suffit ; il ne bloque jamais le défilement.
export function PressFeedback() {
  useEffect(() => {
    const noop = () => {};
    document.addEventListener("touchstart", noop, { passive: true });
    return () => document.removeEventListener("touchstart", noop);
  }, []);
  return null;
}
