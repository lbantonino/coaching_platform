import "server-only";

import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";

import {
  FONT,
  INK,
  INK_2,
  MUTED,
  PdfLogo,
  VIOLET,
  pdfText,
  registerPdfFonts,
  titleStyles,
  u,
} from "@/features/programs/pdf/pdf-kit";

import type { ConversationPdf, ConversationPdfBlock } from "./conversation-pdf-model";

// Mise en page du PDF d'une conversation (D-212) : A4, la charte des PDF des programmes (logo, police
// Plus Jakarta Sans, noir et violet), le texte qui coule de page en page ; en-tête et pied de page sur
// chaque page. Le contenu vient de conversationPdf().
const s = StyleSheet.create({
  page: {
    fontFamily: FONT,
    fontSize: u(11.5),
    color: INK,
    paddingTop: u(32),
    paddingBottom: u(52),
    paddingHorizontal: u(40),
  },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: u(18) },
  headerText: { fontSize: u(10.5), color: MUTED },
  blocks: { flexDirection: "column", gap: u(10), marginTop: u(16) },
  who: { fontSize: u(9.5), fontWeight: 800, letterSpacing: u(0.7), textTransform: "uppercase" },
  text: { fontSize: u(11.5), lineHeight: 1.5, color: INK },
  coach: { color: INK_2 },
  card: {
    borderWidth: u(1),
    borderColor: "#e6e4ec",
    borderRadius: u(8),
    paddingVertical: u(8),
    paddingHorizontal: u(12),
    gap: u(2),
  },
  cardHead: { flexDirection: "row", justifyContent: "space-between", gap: u(12) },
  cardTitle: { fontSize: u(12), fontWeight: 700 },
  state: { fontSize: u(10.5), fontWeight: 700, color: VIOLET },
  line: { fontSize: u(11), lineHeight: 1.45, color: INK_2 },
  note: { fontSize: u(10.5), lineHeight: 1.5, color: MUTED, marginTop: u(6) },
  footer: {
    position: "absolute",
    bottom: u(24),
    left: u(40),
    right: u(40),
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: u(9.5),
    color: MUTED,
    borderTopWidth: u(1),
    borderTopColor: "#e6e4ec",
    paddingTop: u(8),
  },
});

function Block({ block }: { block: ConversationPdfBlock }) {
  if (block.kind === "message") {
    return (
      <View style={{ gap: u(3) }}>
        <Text style={[s.who, { color: block.from === "Toi" ? MUTED : VIOLET }]}>
          {block.error ? `${block.from} · erreur` : block.from}
        </Text>
        <Text style={[s.text, block.from === "Toi" ? s.coach : {}]}>{pdfText(block.text)}</Text>
      </View>
    );
  }
  if (block.kind === "failure") return <Text style={s.line}>{pdfText(block.text)}</Text>;
  return (
    <View style={s.card} wrap={false}>
      <View style={s.cardHead}>
        <Text style={s.cardTitle}>{pdfText(block.title)}</Text>
        <Text style={s.state}>{block.state}</Text>
      </View>
      {block.lines.map((line, i) => (
        <Text key={i} style={s.line}>
          {pdfText(line)}
        </Text>
      ))}
      {block.result ? <Text style={s.line}>{pdfText(block.result)}</Text> : null}
    </View>
  );
}

export async function renderConversationPdf(model: ConversationPdf): Promise<Buffer> {
  registerPdfFonts();
  return renderToBuffer(
    <Document
      title={pdfText(model.documentTitle)}
      subject="Conversation de l'Assistant IA"
      creator="Coory"
      producer="Coory"
      language="fr-FR"
    >
      <Page size="A4" style={s.page}>
        <View style={s.header} fixed>
          <PdfLogo />
          <Text style={s.headerText}>Assistant IA</Text>
        </View>
        <View style={titleStyles.block}>
          <Text style={titleStyles.kicker}>Conversation</Text>
          <Text style={titleStyles.title}>{pdfText(model.title)}</Text>
          <Text style={titleStyles.subtitle}>{pdfText(model.subtitle)}</Text>
        </View>
        <Text style={s.note}>{pdfText(model.note)}</Text>
        <View style={s.blocks}>
          {model.blocks.map((block, i) => (
            <Block key={i} block={block} />
          ))}
        </View>
        <View style={s.footer} fixed>
          <Text>{pdfText(model.footer)}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} sur ${totalPages}`} />
        </View>
      </Page>
    </Document>,
  );
}
