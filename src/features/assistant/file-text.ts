import { inflateRawSync } from "node:zlib";

// Texte d'un Word (.docx) ou d'un Excel (.xlsx) joint à l'Assistant IA (D-209). Claude lit lui-même
// les PDF et les images ; ces deux formats sont des archives zip de fichiers XML, dont on extrait le
// texte ici, sans bibliothèque ajoutée. Le fichier vient du coach : tailles bornées (pas de « bombe »
// de décompression), texte coupé au-delà de MAX_TEXT.

const MAX_ENTRY_BYTES = 20 * 1024 * 1024;
// Relecture du 27/11 (D-213, fichiers de 20 Mo) : une archive piégée (des milliers de feuilles) ne
// décompresse jamais plus de 60 Mo en tout.
const MAX_TOTAL_BYTES = 60 * 1024 * 1024;
export const MAX_TEXT = 100_000;
const MAX_ROWS = 2000;

// Entrées d'une archive zip (répertoire central), décompressées ; seulement celles que `wanted` garde.
export function readZip(buffer: Buffer, wanted: (name: string) => boolean): Map<string, Buffer> {
  // Fin du répertoire central : dans les 65 557 derniers octets (commentaire de 64 Ko au plus).
  let end = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65_557); i -= 1) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      end = i;
      break;
    }
  }
  if (end < 0) throw new Error("Archive zip illisible.");
  const count = buffer.readUInt16LE(end + 10);
  let at = buffer.readUInt32LE(end + 16);
  const entries = new Map<string, Buffer>();
  let total = 0;
  for (let n = 0; n < count; n += 1) {
    if (buffer.readUInt32LE(at) !== 0x02014b50) throw new Error("Archive zip illisible.");
    const method = buffer.readUInt16LE(at + 10);
    const compressed = buffer.readUInt32LE(at + 20);
    const nameLength = buffer.readUInt16LE(at + 28);
    const extraLength = buffer.readUInt16LE(at + 30);
    const commentLength = buffer.readUInt16LE(at + 32);
    const local = buffer.readUInt32LE(at + 42);
    const name = buffer.toString("utf8", at + 46, at + 46 + nameLength);
    at += 46 + nameLength + extraLength + commentLength;
    if (!wanted(name)) continue;
    if (buffer.readUInt32LE(local) !== 0x04034b50) throw new Error("Archive zip illisible.");
    const start = local + 30 + buffer.readUInt16LE(local + 26) + buffer.readUInt16LE(local + 28);
    const data = buffer.subarray(start, start + compressed);
    const entry =
      method === 0
        ? Buffer.from(data)
        : method === 8
          ? inflateRawSync(data, { maxOutputLength: MAX_ENTRY_BYTES })
          : null;
    if (!entry) throw new Error("Compression non prise en charge.");
    total += entry.length;
    if (total > MAX_TOTAL_BYTES) throw new Error("Archive trop volumineuse.");
    entries.set(name, entry);
  }
  return entries;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
const decode = (text: string) =>
  text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code: string) =>
    code.startsWith("#x") || code.startsWith("#X")
      ? String.fromCodePoint(parseInt(code.slice(2), 16))
      : code.startsWith("#")
        ? String.fromCodePoint(Number(code.slice(1)))
        : (ENTITIES[code] ?? whole),
  );

const cut = (text: string) =>
  text.length > MAX_TEXT ? `${text.slice(0, MAX_TEXT)}\n… (texte coupé)` : text;

// Word : les textes <w:t>, une ligne par paragraphe, les tabulations et sauts de ligne gardés.
export function docxText(buffer: Buffer): string {
  const xml = readZip(buffer, (name) => name === "word/document.xml")
    .get("word/document.xml")
    ?.toString("utf8");
  if (!xml) throw new Error("Document Word illisible.");
  let text = "";
  const tokens = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:tab\/>|<w:br\/>|<\/w:p>|<\/w:tc>/g;
  for (const match of xml.matchAll(tokens)) {
    const token = match[0];
    if (match[1] !== undefined) text += decode(match[1]);
    else if (token === "<w:tab/>" || token === "</w:tc>") text += "\t";
    else text += "\n";
  }
  return cut(
    text
      .split("\n")
      .map((line) => line.replace(/\s+$/, ""))
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  );
}

// Textes d'un élément XML (un ou plusieurs <t>, comme une chaîne riche d'Excel).
const texts = (xml: string) =>
  [...xml.matchAll(/<t(?:\s[^>]*)?>([^<]*)<\/t>/g)].map((match) => decode(match[1])).join("");

// « C12 » -> 2 (la colonne, depuis 0).
const columnOf = (reference: string) => {
  const letters = /^[A-Z]+/.exec(reference)?.[0] ?? "A";
  return [...letters].reduce((sum, letter) => sum * 26 + letter.charCodeAt(0) - 64, 0) - 1;
};

// Excel : chaque feuille avec son nom, une ligne par rangée, les colonnes séparées par des tabulations.
export function xlsxText(buffer: Buffer): string {
  const entries = readZip(
    buffer,
    (name) =>
      name === "xl/workbook.xml" ||
      name === "xl/_rels/workbook.xml.rels" ||
      name === "xl/sharedStrings.xml" ||
      /^xl\/worksheets\/[^/]+\.xml$/.test(name),
  );
  const read = (name: string) => entries.get(name)?.toString("utf8") ?? "";
  const shared = [...read("xl/sharedStrings.xml").matchAll(/<si>([\s\S]*?)<\/si>/g)].map((match) =>
    texts(match[1]),
  );
  const targets = new Map(
    [
      ...read("xl/_rels/workbook.xml.rels").matchAll(
        /<Relationship\b[^>]*\bId="([^"]+)"[^>]*\bTarget="([^"]+)"/g,
      ),
    ].map((match) => [match[1], match[2].replace(/^\/?(xl\/)?/, "xl/")]),
  );
  const sheets = [...read("xl/workbook.xml").matchAll(/<sheet\b[^>]*>/g)].map((match) => ({
    name: decode(/\bname="([^"]*)"/.exec(match[0])?.[1] ?? "Feuille"),
    path: targets.get(/\br:id="([^"]+)"/.exec(match[0])?.[1] ?? "") ?? "",
  }));
  if (sheets.length === 0) throw new Error("Classeur Excel illisible.");

  const parts = sheets.map(({ name, path }) => {
    const rows: string[] = [];
    for (const row of read(path).matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
      if (rows.length >= MAX_ROWS) break;
      const cells: string[] = [];
      for (const cell of row[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const attributes = cell[1];
        const body = cell[2] ?? "";
        const type = /\bt="([^"]+)"/.exec(attributes)?.[1];
        const value = /<v>([^<]*)<\/v>/.exec(body)?.[1];
        const text =
          type === "s"
            ? (shared[Number(value)] ?? "")
            : type === "inlineStr"
              ? texts(body)
              : type === "b"
                ? value === "1"
                  ? "VRAI"
                  : "FAUX"
                : decode(value ?? "");
        const column = columnOf(/\br="([A-Z]+)\d+"/.exec(attributes)?.[1] ?? "");
        while (cells.length < column) cells.push("");
        cells[column >= 0 ? column : cells.length] = text;
      }
      rows.push(cells.join("\t").replace(/\t+$/, ""));
    }
    return [`Feuille « ${name} »`, ...rows].join("\n");
  });
  return cut(parts.join("\n\n"));
}
