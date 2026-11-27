import { deflateRawSync } from "node:zlib";

import { describe, expect, it } from "vitest";

import { docxText, readZip, xlsxText } from "@/features/assistant/file-text";

// L'Assistant IA lit les fichiers joints (D-209) : le texte d'un Word et d'un Excel est extrait sur le
// serveur (ce sont des archives zip de fichiers XML), sans bibliothèque ajoutée.

// Archive zip minimale (en-têtes locaux, répertoire central, fin) ; `deflate` : entrées compressées.
function zip(files: Record<string, string>, deflate = false): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const [name, text] of Object.entries(files)) {
    const raw = Buffer.from(text, "utf8");
    const data = deflate ? deflateRawSync(raw) : raw;
    const nameBytes = Buffer.from(name, "utf8");
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(deflate ? 8 : 0, 8);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    locals.push(local, nameBytes, data);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(deflate ? 8 : 0, 10);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(raw.length, 24);
    central.writeUInt16LE(nameBytes.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBytes);
    offset += 30 + nameBytes.length + data.length;
  }
  const directory = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(Object.keys(files).length, 8);
  end.writeUInt16LE(Object.keys(files).length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, directory, end]);
}

describe("archive zip", () => {
  it("lit les entrées voulues, compressées ou non", () => {
    for (const deflate of [false, true]) {
      const entries = readZip(zip({ "a.xml": "<a/>", "b.xml": "<b>été</b>" }, deflate), (name) =>
        name.startsWith("b"),
      );
      expect([...entries.keys()]).toEqual(["b.xml"]);
      expect(entries.get("b.xml")?.toString("utf8")).toBe("<b>été</b>");
    }
  });

  it("refuse un fichier qui n'est pas une archive", () => {
    expect(() => readZip(Buffer.from("pas un zip"), () => true)).toThrow();
  });
});

describe("texte d'un Word", () => {
  it("garde les paragraphes, les tabulations et les caractères spéciaux", () => {
    const document = `<?xml version="1.0"?><w:document><w:body>
      <w:p><w:r><w:t>Bilan de la semaine</w:t></w:r></w:p>
      <w:p><w:r><w:t xml:space="preserve">Fractionné </w:t></w:r><w:r><w:t>10 × 400 m</w:t></w:r></w:p>
      <w:p><w:r><w:t>Allure</w:t></w:r><w:r><w:tab/></w:r><w:r><w:t>5:30 /km &amp; récup &lt;2 min&gt;</w:t></w:r></w:p>
    </w:body></w:document>`;
    expect(docxText(zip({ "word/document.xml": document }, true))).toBe(
      "Bilan de la semaine\nFractionné 10 × 400 m\nAllure\t5:30 /km & récup <2 min>",
    );
  });
});

describe("texte d'un Excel", () => {
  it("rend chaque feuille avec son nom, ligne par ligne, colonnes alignées", () => {
    const files = {
      "xl/workbook.xml":
        '<workbook><sheets><sheet name="Séances" sheetId="1" r:id="rId1"/><sheet name="Prix" sheetId="2" r:id="rId2"/></sheets></workbook>',
      "xl/_rels/workbook.xml.rels":
        '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Target="worksheets/sheet2.xml"/></Relationships>',
      "xl/sharedStrings.xml":
        "<sst><si><t>Jour</t></si><si><t>Séance</t></si><si><r><t>Lun</t></r><r><t>di</t></r></si></sst>",
      "xl/worksheets/sheet1.xml":
        '<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row><row r="2"><c r="A2" t="s"><v>2</v></c><c r="C2"><v>45</v></c></row></sheetData></worksheet>',
      "xl/worksheets/sheet2.xml":
        '<worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>Séance</t></is></c><c r="B1"><v>65.5</v></c><c r="C1" t="b"><v>1</v></c></row></sheetData></worksheet>',
    };
    expect(xlsxText(zip(files, true))).toBe(
      "Feuille « Séances »\nJour\tSéance\nLundi\t\t45\n\nFeuille « Prix »\nSéance\t65.5\tVRAI",
    );
  });
});
