// Export des données (Paramètres › Données, D-57 ; droit à la portabilité, RGPD art. 20). La base
// renvoie au plus 1 000 lignes par requête (max_rows, réglable dans Supabase) : chaque table se lit
// page par page, en avançant de ce qui a VRAIMENT été reçu, jusqu'à une page vide (relecture du
// 18/11/2026 : au-delà, le fichier était coupé sans le dire ; une base réglée plus bas aurait fait
// sauter des lignes). Une page en erreur fait échouer l'export entier : un fichier incomplet présenté
// comme complet serait pire.

export const EXPORT_PAGE = 1000;

export async function readAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ;) {
    const { data, error } = await page(from, from + EXPORT_PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) return rows;
    rows.push(...data);
    from += data.length;
  }
}

// Le fichier part en flux, par morceaux d'octets (jamais au milieu d'un caractère : on découpe après
// l'encodage) : Vercel refuse une réponse de plus de 4,5 Mo qui ne serait pas envoyée en flux. JSON
// compact, sans indentation (près de deux fois plus léger).
export function jsonStream(value: unknown, chunkBytes = 64 * 1024): ReadableStream<Uint8Array> {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let offset = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (offset >= bytes.length) {
        controller.close();
        return;
      }
      controller.enqueue(bytes.subarray(offset, offset + chunkBytes));
      offset += chunkBytes;
    },
  });
}
