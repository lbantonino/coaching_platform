import "server-only";

import { StyleSheet, Text, View } from "@react-pdf/renderer";

import type {
  FicheBlock,
  FichePage,
  FicheSection,
  FicheTone,
  FichesPdf,
} from "@/domain/training/pdf-fiches";

import {
  INK,
  INK_2,
  MUTED,
  PdfPage,
  SessionLines,
  disciplinePdf,
  pdfText,
  titleStyles,
  u,
} from "./pdf-kit";

// PDF 2 « Fiches et repères » (maquettes PDF-08 sommaire, PDF-02 fiche musculation, PDF-06 workload
// Hyrox, PDF-07 allures) : la mise en page seulement ; le contenu vient de fichesPdf() (domain).

const BLOCK_LINE = 1.3;

// Couleur d'une fiche : barre du sommaire, petit titre, en-tête des tableaux.
export const tones: Record<FicheTone, { bar: string; text: string; tint: string }> = {
  strength: {
    bar: disciplinePdf.strength.fill,
    text: disciplinePdf.strength.text,
    tint: disciplinePdf.strength.tint,
  },
  hyrox: {
    bar: disciplinePdf.hyrox.fill,
    text: disciplinePdf.hyrox.text,
    tint: disciplinePdf.hyrox.tint,
  },
  paces: {
    bar: disciplinePdf.running.fill,
    text: disciplinePdf.running.text,
    tint: disciplinePdf.running.tint,
  },
};

const s = StyleSheet.create({
  head: {
    flexDirection: "column",
    gap: u(2),
    paddingBottom: u(10),
    borderBottomWidth: u(1.5),
    borderBottomColor: INK,
  },
  text: { fontSize: u(11.5), lineHeight: 1.5 },
  table: { borderWidth: u(1), borderColor: "#dcdae3", borderRadius: u(8), overflow: "hidden" },
  th: {
    flexDirection: "row",
    fontSize: u(10),
    fontWeight: 700,
    letterSpacing: u(10 * 0.04),
    textTransform: "uppercase",
  },
  tr: {
    flexDirection: "row",
    borderTopWidth: u(1),
    borderTopColor: "#ecebf1",
    fontSize: u(11),
    lineHeight: 1.35,
  },
  tag: {
    fontSize: u(9),
    fontWeight: 700,
    paddingVertical: u(1),
    paddingHorizontal: u(4),
    borderRadius: u(3),
    borderWidth: u(1),
    borderColor: INK,
  },
  // Cadre d'un superset ou d'un EMOM (16/11) : comme sa grande carte dans l'app.
  groupHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: u(6),
    paddingHorizontal: u(8),
  },
  groupTitle: {
    fontSize: u(10),
    fontWeight: 800,
    letterSpacing: u(10 * 0.04),
    textTransform: "uppercase",
  },
  groupAside: { fontSize: u(10.5), fontWeight: 700 },
  groupFooter: {
    borderTopWidth: u(1),
    borderTopColor: "#ecebf1",
    paddingVertical: u(6),
    paddingHorizontal: u(8),
    fontSize: u(10.5),
    color: INK_2,
  },
  chargesTitle: { fontSize: u(11.5), fontWeight: 700, marginBottom: u(6) },
  tip: {
    flexDirection: "row",
    gap: u(10),
    paddingVertical: u(10),
    paddingHorizontal: u(12),
    borderRadius: u(8),
    backgroundColor: "#f6f5fa",
  },
  tipLabel: { fontSize: u(11), lineHeight: 1.5, fontWeight: 700, color: INK },
  // Le texte prend la largeur qui reste et passe à la ligne (sinon il sort de l'encadré).
  tipText: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    fontSize: u(11),
    lineHeight: 1.5,
    color: INK_2,
  },
  wlRow: { flexDirection: "row", gap: u(12) },
  wlWeek: { width: u(72), flexDirection: "column", gap: u(2), paddingTop: u(6) },
  wlCard: { flexGrow: 1, flexShrink: 1, borderRadius: u(8), borderWidth: u(1), overflow: "hidden" },
  wlHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: u(5),
    paddingHorizontal: u(10),
    fontSize: u(11),
    fontWeight: 700,
  },
  // Blocs d'un workload : interligne 1,3 (1,45 dans la maquette) pour tenir 3 semaines par page.
  blocks: { flexDirection: "column", gap: u(4), paddingVertical: u(6), paddingHorizontal: u(12) },
  block: { flexDirection: "row", gap: u(8) },
  blockN: { width: u(14), fontSize: u(11), lineHeight: BLOCK_LINE, fontWeight: 800 },
  blockTitle: { fontSize: u(11), lineHeight: BLOCK_LINE, fontWeight: 700 },
});

// Colonnes du tableau d'exercices : Exercice · Séries · Répét. · Charge (16/11, comme la carte de l'app)
// · Repos · Commentaire. Le cadre d'un superset ou d'un EMOM reprend les mêmes colonnes.
const cols = { name: 2.1, sets: 0.6, reps: 0.9, load: 1.15, rest: 0.7, comment: 1.45 };
const cell = (flex: number, center = false) => ({
  flexGrow: flex,
  flexBasis: 0,
  paddingVertical: u(7),
  paddingHorizontal: u(center ? 4 : 8),
  textAlign: center ? ("center" as const) : ("left" as const),
});

function Blocks({ blocks }: { blocks: FicheBlock[] }) {
  return (
    <View style={s.blocks}>
      {blocks.map((block) => (
        <View key={block.n} style={s.block}>
          <Text style={s.blockN}>{block.n}</Text>
          <View style={{ flexGrow: 1, flexShrink: 1, flexDirection: "column", gap: u(1) }}>
            <Text style={s.blockTitle}>{pdfText(block.title)}</Text>
            <SessionLines
              lines={block.lines.map((text) => ({ kind: "line", text }))}
              discipline="hyrox"
              lineHeight={BLOCK_LINE}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

function Section({ section, tone }: { section: FicheSection; tone: FicheTone }) {
  const colors = tones[tone];
  switch (section.kind) {
    case "text":
      return (
        <Text style={s.text}>
          <Text style={{ fontWeight: 700 }}>{section.label}</Text>
          {pdfText(` — ${section.text}`)}
        </Text>
      );
    case "tip":
      return (
        <View style={s.tip}>
          <Text style={s.tipLabel}>{section.label}</Text>
          <Text style={s.tipText}>{pdfText(section.text)}</Text>
        </View>
      );
    case "table":
      return (
        <View style={s.table}>
          <View style={[s.th, { backgroundColor: colors.tint }]}>
            <Text style={cell(cols.name)}>{section.title}</Text>
            <Text style={cell(cols.sets, true)}>Séries</Text>
            <Text style={cell(cols.reps, true)}>Répét.</Text>
            <Text style={cell(cols.load, true)}>Charge</Text>
            <Text style={cell(cols.rest, true)}>Repos</Text>
            <Text style={cell(cols.comment)}>Commentaire</Text>
          </View>
          {section.rows.map((row, i) => (
            <View key={i} style={s.tr} wrap={false}>
              <View
                style={[cell(cols.name), { flexDirection: "row", alignItems: "center", gap: u(6) }]}
              >
                <Text style={{ fontWeight: 600, flexShrink: 1 }}>{pdfText(row.name)}</Text>
              </View>
              {row.kind === "span" ? (
                <Text
                  style={[
                    cell(cols.sets + cols.reps + cols.load + cols.rest + cols.comment, true),
                    { fontWeight: 500 },
                  ]}
                >
                  {pdfText(row.text)}
                </Text>
              ) : (
                <>
                  <Text style={cell(cols.sets, true)}>{row.sets}</Text>
                  <Text style={cell(cols.reps, true)}>{pdfText(row.reps)}</Text>
                  <Text style={cell(cols.load, true)}>{pdfText(row.load)}</Text>
                  <Text style={cell(cols.rest, true)}>{pdfText(row.rest)}</Text>
                  <Text style={[cell(cols.comment), { color: INK_2 }]}>{pdfText(row.comment)}</Text>
                </>
              )}
            </View>
          ))}
        </View>
      );
    case "group":
      // Superset ou EMOM : son nom et ses tours en tête, ses exercices (A1, A2…) aux colonnes du
      // tableau, son repos en bas.
      return (
        <View style={s.table} wrap={false}>
          <View style={[s.groupHead, { backgroundColor: colors.tint }]}>
            <Text style={s.groupTitle}>{section.title}</Text>
            <Text style={s.groupAside}>{pdfText(section.aside)}</Text>
          </View>
          {section.rows.map((row, i) => (
            <View key={i} style={s.tr}>
              <View
                style={[
                  cell(cols.name + cols.sets),
                  { flexDirection: "row", alignItems: "center", gap: u(6) },
                ]}
              >
                {row.tag ? <Text style={s.tag}>{row.tag}</Text> : null}
                <Text style={{ fontWeight: 600, flexShrink: 1 }}>{pdfText(row.name)}</Text>
              </View>
              <Text style={cell(cols.reps, true)}>{pdfText(row.reps)}</Text>
              <Text style={cell(cols.load, true)}>{pdfText(row.load)}</Text>
              {/* Le commentaire sous la colonne Commentaire du tableau, pas sous Repos (le repos est
                  en bas du cadre). */}
              <Text style={cell(cols.rest, true)} />
              <Text style={[cell(cols.comment), { color: INK_2 }]}>{pdfText(row.comment)}</Text>
            </View>
          ))}
          {section.footer ? <Text style={s.groupFooter}>{pdfText(section.footer)}</Text> : null}
        </View>
      );
    case "charges":
      return (
        <View>
          <Text style={s.chargesTitle}>{section.title}</Text>
          <View style={s.table}>
            <View style={[s.th, { backgroundColor: colors.tint }]}>
              <Text style={cell(1.7)}>Semaine</Text>
              {section.columns.map((column, i) => (
                <Text key={i} style={cell(1, true)}>
                  {pdfText(column)}
                </Text>
              ))}
            </View>
            {section.rows.map((row, i) => (
              <View
                key={i}
                style={[s.tr, { backgroundColor: i % 2 ? "#fbfafd" : "#ffffff" }]}
                wrap={false}
              >
                <Text style={[cell(1.7), { paddingVertical: u(4), fontWeight: 600 }]}>
                  {pdfText(row.week)}
                </Text>
                {row.cells.map((value, j) => (
                  <Text key={j} style={[cell(1, true), { paddingVertical: u(4) }]}>
                    {pdfText(value)}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        </View>
      );
    case "blocks":
      return (
        <View style={s.table}>
          <Blocks blocks={section.blocks} />
        </View>
      );
    case "workload": {
      const current = section.current;
      return (
        <View style={s.wlRow} wrap={false}>
          <View style={s.wlWeek}>
            <Text style={{ fontSize: u(12.5), fontWeight: 700 }}>{section.week}</Text>
            <Text style={{ fontSize: u(10.5), color: MUTED }}>{pdfText(section.date)}</Text>
          </View>
          <View
            style={[s.wlCard, { borderColor: current ? disciplinePdf.hyrox.border : "#dcdae3" }]}
          >
            <View style={[s.wlHead, { backgroundColor: current ? colors.tint : "#f3f2f7" }]}>
              <Text>{pdfText(section.title)}</Text>
              <Text style={{ fontWeight: 600, color: INK_2 }}>{section.tag}</Text>
            </View>
            <Blocks blocks={section.blocks} />
          </View>
        </View>
      );
    }
    case "paces":
      return (
        <View style={s.table}>
          <View style={[s.th, { backgroundColor: colors.tint }]}>
            <Text style={cell(1.6)}>Repère</Text>
            <Text style={cell(1.1)}>Allure</Text>
            <Text style={cell(0.9)}>Vitesse</Text>
            <Text style={cell(1.6)}>Utilisé pour</Text>
          </View>
          {section.rows.map((row, i) => (
            <View
              key={i}
              style={[s.tr, { fontSize: u(11.5), backgroundColor: i % 2 ? "#fbfafd" : "#ffffff" }]}
              wrap={false}
            >
              <Text style={[cell(1.6), { paddingVertical: u(8), fontWeight: 600 }]}>
                {pdfText(row.label)}
              </Text>
              <Text style={[cell(1.1), { paddingVertical: u(8), fontWeight: 700 }]}>
                {pdfText(row.pace)}
              </Text>
              <Text style={[cell(0.9), { paddingVertical: u(8), color: INK_2 }]}>
                {pdfText(row.speed)}
              </Text>
              <Text style={[cell(1.6), { paddingVertical: u(8), color: INK_2 }]}>
                {pdfText(row.usedFor)}
              </Text>
            </View>
          ))}
        </View>
      );
  }
}

export function FichePageView({
  page,
  total,
  model,
}: {
  page: FichePage;
  total: number;
  model: FichesPdf;
}) {
  return (
    <PdfPage
      anchor={page.anchor}
      bookmark={page.bookmark}
      nav={page.nav}
      headerTitle={model.headerTitle}
      headerSubtitle={model.headerSubtitle}
      footer={model.footer}
      pageNumber={page.pageNumber}
      totalPages={total}
    >
      <View style={s.head}>
        <Text style={[titleStyles.kicker, { color: tones[page.tone].text }]}>
          {pdfText(page.kicker)}
        </Text>
        <Text style={titleStyles.title}>{pdfText(page.title)}</Text>
        <Text style={titleStyles.subtitle}>{pdfText(page.subtitle)}</Text>
      </View>
      {page.sections.map((section, i) => (
        <Section key={i} section={section} tone={page.tone} />
      ))}
    </PdfPage>
  );
}
