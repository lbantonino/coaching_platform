import { describe, expect, it, vi } from "vitest";

import { jsonStream, readAll } from "@/features/account/export-data";

// Export des données (relecture du 18/11/2026) : la base renvoie au plus 1 000 lignes par requête ;
// l'export lit page par page jusqu'au bout, sinon un coach actif recevait un fichier coupé sans le savoir.

function table(size: number) {
  const rows = Array.from({ length: size }, (_, index) => ({ index }));
  return vi.fn(async (from: number, to: number) => ({
    data: rows.slice(from, to + 1),
    error: null,
  }));
}

describe("readAll", () => {
  it("2 500 lignes : trois pages pleines ou partielles, puis une page vide ; aucune ligne perdue", async () => {
    const page = table(2500);
    const rows = await readAll(page);
    expect(rows).toHaveLength(2500);
    expect(rows.at(-1)).toEqual({ index: 2499 });
    expect(page.mock.calls).toEqual([
      [0, 999],
      [1000, 1999],
      [2000, 2999],
      [2500, 3499],
    ]);
  });

  it("une base réglée plus bas (500 lignes par réponse) : on avance de ce qui est reçu, sans rien sauter", async () => {
    const rows = Array.from({ length: 2500 }, (_, index) => ({ index }));
    const page = vi.fn(async (from: number, to: number) => ({
      data: rows.slice(from, Math.min(to + 1, from + 500)),
      error: null,
    }));
    const read = await readAll(page);
    expect(read).toHaveLength(2500);
    expect(new Set(read.map((row) => row.index)).size).toBe(2500);
  });

  it("exactement 1 000 lignes : une page de plus pour s'assurer qu'il n'y a rien après", async () => {
    const page = table(1000);
    expect(await readAll(page)).toHaveLength(1000);
    expect(page).toHaveBeenCalledTimes(2);
  });

  it("une page en erreur : l'export échoue au lieu de sortir un fichier incomplet", async () => {
    const page = vi.fn(async () => ({ data: null, error: new Error("lecture impossible") }));
    await expect(readAll(page)).rejects.toThrow("lecture impossible");
  });
});

// Vercel refuse une réponse de plus de 4,5 Mo, sauf envoyée en flux (relecture du 18/11) : le fichier
// part par morceaux, sans indentation, et rien ne se perd entre deux morceaux (accents, émojis).
describe("jsonStream", () => {
  it("envoie le JSON compact par morceaux, octets intacts", async () => {
    const value = { notes: Array.from({ length: 4000 }, (_, i) => `Séance n°${i} 🏃‍♀️ « allure »`) };
    const reader = jsonStream(value, 1024).getReader();
    const chunks: Uint8Array[] = [];
    for (;;) {
      const { done, value: chunk } = await reader.read();
      if (done) break;
      chunks.push(chunk);
    }
    expect(chunks.length).toBeGreaterThan(10);
    const bytes = new Uint8Array(chunks.reduce((total, chunk) => total + chunk.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    const text = new TextDecoder().decode(bytes);
    expect(text).toBe(JSON.stringify(value));
    expect(JSON.parse(text)).toEqual(value);
  });
});
