import { describe, expect, it } from "vitest";

import {
  ATTACHMENTS_MAX,
  ATTACHMENT_MAX_BYTES,
  PAGES_MAX,
  attachmentBlocksFor,
  attachmentKind,
  attachmentProblem,
  attachmentsLine,
  pagesProblem,
  pdfPageCount,
  pickAttachment,
  textPages,
  type PreparedAttachment,
} from "@/features/assistant/attachment-rules";

// Plusieurs fichiers, 20 Mo chacun (D-213, 27/11/2026) : règles pures.
const prepared = (over: Partial<PreparedAttachment>): PreparedAttachment => ({
  id: "f1",
  name: "plan.pdf",
  mime: "application/pdf",
  size: 1000,
  pages: 7,
  text: null,
  fileId: "file_abc",
  ...over,
});

describe("ce qui peut être joint", () => {
  it("reconnaît le format par le type ou l'extension", () => {
    expect(attachmentKind("plan.pdf", "")).toBe("pdf");
    expect(attachmentKind("photo.HEIC", "image/heic")).toBe("image");
    expect(attachmentKind("reperes.xlsx", "")).toBe("excel");
    expect(attachmentKind("notes.docx", "")).toBe("word");
    expect(attachmentKind("export.csv", "application/vnd.ms-excel")).toBe("text");
    expect(attachmentKind("archive.zip", "application/zip")).toBeNull();
  });

  it("10 fichiers, 20 Mo chacun, un format lu, un nom", () => {
    const file = { name: "plan.pdf", type: "application/pdf", size: 1000 };
    expect(attachmentProblem(file, 0)).toBeNull();
    expect(attachmentProblem(file, ATTACHMENTS_MAX)).toBe("10 fichiers au plus par message.");
    expect(attachmentProblem({ ...file, size: ATTACHMENT_MAX_BYTES + 1 }, 0)).toBe(
      "« plan.pdf » : plus de 20 Mo.",
    );
    expect(attachmentProblem({ ...file, size: 0 }, 0)).toBe("« plan.pdf » est vide.");
    expect(attachmentProblem({ ...file, name: "x.zip", type: "" }, 0)).toBe(
      "« x.zip » : format non lu (PDF, image, Word, Excel, CSV ou texte).",
    );
  });
});

describe("pages comptées (100 au plus par message, règle des 5 minutes)", () => {
  it("compte les pages d'un PDF, pas l'arbre des pages", () => {
    const pdf = new TextEncoder().encode(
      "%PDF-1.7 1 0 obj <</Type /Pages /Count 3>> 2 0 obj <</Type /Page>> 3 0 obj <</Type/Page /X 1>> 4 0 obj <</Type /Page>>",
    );
    expect(pdfPageCount(pdf)).toBe(3);
  });

  // Relecture du 27/11 : la plupart des PDF (LaTeX, Acrobat) rangent leurs pages dans des flux
  // d'objets compressés ; la racine /Count fait foi (une mise à jour incrémentale ne double rien).
  it("lit le /Count de la racine, même dans un flux d'objets compressé", async () => {
    const { deflateSync, inflateSync } = await import("node:zlib");
    const inner = deflateSync(
      Buffer.from("2 0 3 60 <</Type /Pages /Count 300 /Kids [3 0 R]>> <</Type /Page>>"),
    );
    const pdf = Buffer.concat([
      Buffer.from(
        "%PDF-1.5\n1 0 obj <</Type /ObjStm /N 2 /First 10 /Filter /FlateDecode>>stream\n",
      ),
      inner,
      Buffer.from("\nendstream endobj"),
    ]);
    expect(pdfPageCount(pdf, (data) => inflateSync(data))).toBe(300);
    const updated = new TextEncoder().encode(
      "%PDF <</Type /Pages /Count 5>> <</Type/Page>> <</Type/Page>> %%EOF <</Count 5 /Type /Pages>> %%EOF",
    );
    expect(pdfPageCount(updated)).toBe(5);
    // Rien de lisible : une estimation par la taille (100 Ko par page).
    expect(pdfPageCount(new Uint8Array(250 * 1024))).toBe(3);
  });

  it("un texte : 3 000 caractères par page, au moins une", () => {
    expect(textPages("")).toBe(1);
    expect(textPages("x".repeat(6001))).toBe(3);
  });

  it("au-delà de 100 pages en tout, un message clair", () => {
    expect(pagesProblem([prepared({ pages: 60 }), prepared({ pages: 40 })])).toBeNull();
    expect(pagesProblem([prepared({ pages: 60 }), prepared({ pages: 41 })])).toBe(
      `101 pages en tout : ${PAGES_MAX} au plus par message. Découpe en plusieurs messages.`,
    );
  });
});

describe("ce que Claude reçoit", () => {
  it("PDF et images par leur copie Anthropic, Word et Excel par leur texte", () => {
    expect(
      attachmentBlocksFor([
        prepared({}),
        prepared({ id: "f2", name: "photo.jpg", mime: "image/jpeg", fileId: "file_img" }),
        prepared({ id: "f3", name: "reperes.xlsx", mime: "", fileId: null, text: "VMA;17" }),
      ]),
    ).toEqual([
      { type: "document", source: { type: "file", file_id: "file_abc" }, title: "plan.pdf" },
      { type: "image", source: { type: "file", file_id: "file_img" } },
      {
        type: "document",
        source: { type: "text", media_type: "text/plain", data: "VMA;17" },
        title: "reperes.xlsx",
      },
    ]);
  });

  it("une ligne avant la question nomme les fichiers", () => {
    expect(
      attachmentsLine([
        { name: "plan.pdf", type: "application/pdf", size: 2048 },
        { name: "reperes.xlsx", type: "", size: 512 },
      ]),
    ).toBe(
      "[Fichiers joints : plan.pdf · application/pdf · 2 Ko ; reperes.xlsx · type inconnu · 512 o]",
    );
  });
});

describe("« Ranger dans les Documents » : quel fichier", () => {
  const files = [
    { name: "plan.pdf", type: "application/pdf", size: 1 },
    { name: "Repères.xlsx", type: "", size: 1 },
  ];
  it("le fichier nommé, sans tenir compte des majuscules ; un seul joint : celui-là", () => {
    expect(pickAttachment(files, "repères.XLSX")).toEqual({ ok: true, file: files[1] });
    expect(pickAttachment([files[0]!], undefined)).toEqual({ ok: true, file: files[0] });
  });
  it("plusieurs sans nom, ou un nom inconnu : la raison", () => {
    expect(pickAttachment(files, undefined)).toEqual({
      ok: false,
      error:
        "Plusieurs fichiers joints : précise lequel avec « fichier » (plan.pdf, Repères.xlsx).",
    });
    expect(pickAttachment(files, "x.pdf").ok).toBe(false);
    // Un seul joint : c'est lui, même avec un nom approximatif.
    expect(pickAttachment([files[0]!], "plan final.pdf")).toEqual({ ok: true, file: files[0] });
    expect(pickAttachment([], undefined).ok).toBe(false);
  });
});

describe("étapes : rien d'autre que la conversation venue du navigateur", () => {
  it("refuse un document, une image ou un fichier glissé dans les messages renvoyés", async () => {
    const { askAssistantSchema } = await import("@/features/assistant/rules");
    const next = (content: unknown) =>
      askAssistantSchema.safeParse({
        next: {
          usageId: "f0000000-0000-4000-8000-000000000001",
          messages: [{ role: "user", content }],
        },
      }).success;
    expect(next([{ type: "tool_result", tool_use_id: "t", content: "ok" }])).toBe(true);
    expect(next([{ type: "text", text: "x" }])).toBe(true);
    expect(next([{ type: "document", source: { type: "file", file_id: "file_vole" } }])).toBe(
      false,
    );
    expect(next([{ type: "image", source: { type: "base64", data: "x" } }])).toBe(false);
    expect(
      next([
        { type: "tool_result", tool_use_id: "t", content: [{ type: "document", source: {} }] },
      ]),
    ).toBe(false);
  });
});
