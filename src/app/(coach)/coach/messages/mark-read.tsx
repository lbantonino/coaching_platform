"use client";

import { useEffect } from "react";

import { markThreadRead } from "@/features/messages/actions";

// Ouvrir un fil marque ses messages reçus comme lus. Fait par le navigateur APRÈS l'affichage, et non
// pendant le rendu serveur : un préchargement de la page ne doit jamais marquer quoi que ce soit lu.
export function MarkThreadRead({
  organizationId,
  athleteId,
}: {
  organizationId: string;
  athleteId: string;
}) {
  useEffect(() => {
    void markThreadRead(organizationId, athleteId);
  }, [organizationId, athleteId]);
  return null;
}
