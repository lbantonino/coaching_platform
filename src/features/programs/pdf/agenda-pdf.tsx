import "server-only";

import { Document, Link, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";

import type {
  AgendaDayView,
  AgendaPdf,
  AgendaSessionView,
  AgendaTocPage,
  AgendaWeekPage,
} from "@/domain/training/pdf-agenda";

import {
  INK,
  INK_2,
  MUTED,
  PHASE_COLORS,
  PdfPage,
  SessionLines,
  VIOLET,
  disciplinePdf,
  pdfText,
  registerPdfFonts,
  titleStyles,
  u,
} from "./pdf-kit";

// PDF 1 « Agenda du programme » (maquettes PDF-09 sommaire, PDF-01 semaine, PDF-10 semaine de
// course) : la mise en page seulement ; le contenu vient de agendaPdf() (domain/training).

const s = StyleSheet.create({
  tocHead: {
    flexDirection: "column",
    gap: u(3),
    paddingBottom: u(10),
    borderBottomWidth: u(1.5),
    borderBottomColor: INK,
  },
  tocTitle: { fontSize: u(28), fontWeight: 800, letterSpacing: u(-28 * 0.03), lineHeight: 1.18 },
  // Lignes de hauteur fixe : sans flexGrow 0, React-PDF leur donne la place libre de la page.
  tocRows: { flexDirection: "column", gap: u(5), flexGrow: 0 },
  tocRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: u(12),
    // Hauteur par le rembourrage, pas par minHeight : avec minHeight, React-PDF 4.9 déforme une pile
    // de lignes à partir d'un certain nombre (6 lignes de 52 px rendues à 121 px ; ici 38 px).
    paddingVertical: u(3),
    paddingHorizontal: u(12),
    borderRadius: u(8),
    borderWidth: u(1),
    borderColor: "#e6e4ec",
    flexGrow: 0,
    flexShrink: 0,
    textDecoration: "none",
    color: INK,
  },
  // 8 px du bord de la ligne comme dans la maquette, rembourrage de 3 px compris.
  phaseBar: { width: u(6), alignSelf: "stretch", marginVertical: u(5), borderRadius: u(3) },
  tocText: { flexGrow: 1, flexShrink: 1, flexDirection: "column", gap: u(1) },
  tocRowTitle: { fontSize: u(12.5), fontWeight: 700 },
  tocRowSub: { fontSize: u(10.5), color: MUTED },
  tocTag: { fontSize: u(10.5), fontWeight: 600, color: INK_2 },
  tocPage: { fontSize: u(10.5), fontWeight: 600, color: VIOLET },
  note: { fontSize: u(10.5), lineHeight: 1.5, color: INK_2 },

  weekHead: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: u(12),
    paddingBottom: u(10),
    borderBottomWidth: u(1.5),
    borderBottomColor: INK,
  },
  badge: {
    fontSize: u(10.5),
    fontWeight: 600,
    paddingVertical: u(4),
    paddingHorizontal: u(8),
    borderRadius: u(6),
    borderWidth: u(1),
    borderColor: INK,
  },
  days: { flexDirection: "column", gap: u(6) },
  day: { flexDirection: "row", gap: u(10) },
  // ≈ 30 px par ses deux lignes (jour, date) : pas de minHeight (voir tocRow).
  dayLabel: {
    width: u(62),
    flexDirection: "column",
    justifyContent: "center",
    gap: u(1),
  },
  dayName: { fontSize: u(12), fontWeight: 700 },
  dayDate: { fontSize: u(10.5), color: MUTED },
  rest: {
    flexGrow: 1,
    borderRadius: u(8),
    borderWidth: u(1),
    borderStyle: "dashed",
    borderColor: "#cfcdd8",
    justifyContent: "center",
    paddingHorizontal: u(12),
  },
  restText: { fontSize: u(11), fontWeight: 500, color: "#8a8896" },
  cards: { flexGrow: 1, flexShrink: 1, flexDirection: "column", gap: u(6) },
  card: { borderRadius: u(8), borderWidth: u(1), overflow: "hidden" },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: u(8),
    paddingVertical: u(5),
    paddingHorizontal: u(10),
  },
  kind: {
    fontSize: u(9.5),
    fontWeight: 800,
    letterSpacing: u(9.5 * 0.07),
    textTransform: "uppercase",
  },
  name: { fontSize: u(12), fontWeight: 700, flexShrink: 1 },
  meta: { marginLeft: "auto", fontSize: u(10), fontWeight: 600, color: INK_2 },
  body: {
    flexDirection: "column",
    gap: u(1),
    paddingVertical: u(6),
    paddingHorizontal: u(12),
  },
  strongLine: { fontSize: u(11), lineHeight: 1.4, fontWeight: 700 },
  violetLine: { fontSize: u(11), lineHeight: 1.4, fontWeight: 500, color: VIOLET },
});

function TocPage({ page, total, model }: { page: AgendaTocPage; total: number; model: AgendaPdf }) {
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
      <View style={s.tocHead}>
        <Text style={titleStyles.kicker}>{pdfText(page.kicker)}</Text>
        <Text style={s.tocTitle}>{pdfText(page.title)}</Text>
        <Text style={titleStyles.subtitle}>{pdfText(page.subtitle)}</Text>
      </View>
      <View style={s.tocRows}>
        {page.rows.map((row) => (
          <Link
            key={row.anchor}
            src={`#${row.anchor}`}
            style={[s.tocRow, { backgroundColor: row.current ? "#faf9fd" : "#ffffff" }]}
          >
            <View
              style={[
                s.phaseBar,
                {
                  backgroundColor:
                    row.phase === null ? "#dcdae3" : PHASE_COLORS[row.phase % PHASE_COLORS.length],
                },
              ]}
            />
            <View style={s.tocText}>
              <Text style={s.tocRowTitle}>{row.title}</Text>
              <Text style={s.tocRowSub}>{pdfText(row.subtitle)}</Text>
            </View>
            {row.tag ? <Text style={s.tocTag}>{pdfText(row.tag)}</Text> : null}
            <Text style={s.tocPage}>{`p. ${row.page} →`}</Text>
          </Link>
        ))}
      </View>
      {page.note ? <Text style={s.note}>{pdfText(page.note)}</Text> : null}
    </PdfPage>
  );
}

function SessionCard({ session }: { session: AgendaSessionView }) {
  const colors = disciplinePdf[session.discipline];
  return (
    <View style={[s.card, { borderColor: colors.border }]}>
      <View style={[s.cardHead, { backgroundColor: colors.tint }]}>
        <Text style={[s.kind, { color: colors.text }]}>{colors.label}</Text>
        <Text style={s.name}>{pdfText(session.title)}</Text>
        <Text style={s.meta}>{pdfText(session.meta)}</Text>
      </View>
      <View style={s.body}>
        {/* Musculation (16/11) : ses exercices comme la carte de l'app, puis le renvoi à sa fiche ;
            Hyrox trop long : son résumé, puis le renvoi. */}
        {session.fiche?.summary ? (
          <Text style={s.strongLine}>{pdfText(session.fiche.summary)}</Text>
        ) : null}
        {session.lines.length > 0 ? (
          <SessionLines lines={session.lines} discipline={session.discipline} />
        ) : null}
        {session.fiche ? (
          <Text style={s.violetLine}>→ fiche dans « Fiches et repères »</Text>
        ) : session.cut ? (
          <Text style={s.violetLine}>→ détail dans Coory</Text>
        ) : null}
      </View>
    </View>
  );
}

function Day({ day }: { day: AgendaDayView }) {
  return (
    <View style={s.day}>
      <View style={s.dayLabel}>
        <Text style={s.dayName}>{day.label}</Text>
        {day.date ? <Text style={s.dayDate}>{pdfText(day.date)}</Text> : null}
      </View>
      {day.sessions.length === 0 ? (
        <View style={s.rest}>
          <Text style={s.restText}>Repos</Text>
        </View>
      ) : (
        <View style={s.cards}>
          {day.sessions.map((session, i) => (
            <SessionCard key={i} session={session} />
          ))}
        </View>
      )}
    </View>
  );
}

function WeekPage({
  page,
  total,
  model,
}: {
  page: AgendaWeekPage;
  total: number;
  model: AgendaPdf;
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
      <View style={s.weekHead}>
        <View style={{ flexDirection: "column", gap: u(2) }}>
          {page.kicker ? <Text style={titleStyles.kicker}>{pdfText(page.kicker)}</Text> : null}
          <Text style={titleStyles.title}>{page.title}</Text>
          <Text style={titleStyles.subtitle}>{pdfText(page.subtitle)}</Text>
        </View>
        <Text style={s.badge}>{pdfText(page.badge)}</Text>
      </View>
      <View style={s.days}>
        {page.days.map((day, i) => (
          <Day key={i} day={day} />
        ))}
      </View>
    </PdfPage>
  );
}

export async function renderAgendaPdf(model: AgendaPdf, author: string): Promise<Buffer> {
  registerPdfFonts();
  const total = model.pages.length;
  return renderToBuffer(
    <Document
      title={pdfText(model.documentTitle)}
      author={pdfText(author)}
      subject="Agenda du programme"
      creator="Coory"
      producer="Coory"
      language="fr-FR"
    >
      {model.pages.map((page) =>
        page.kind === "toc" ? (
          <TocPage key={page.anchor} page={page} total={total} model={model} />
        ) : (
          <WeekPage key={page.anchor} page={page} total={total} model={model} />
        ),
      )}
    </Document>,
  );
}
