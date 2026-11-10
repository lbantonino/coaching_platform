import "server-only";

// Réponse HTTP d'un PDF de programme : ouvert dans le navigateur (aperçu, lecteur du téléphone),
// ou téléchargé avec ?telecharger. Nom en ASCII pour les vieux navigateurs et en UTF-8 (RFC 5987)
// pour les accents ; jamais mis en cache (données personnelles).
export function pdfResponse(pdf: Buffer, fileName: string, download: boolean): Response {
  const ascii = fileName
    .normalize("NFD")
    .replace(/[^\x20-\x7e]/g, "")
    .replace(/["\\]/g, "");
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
