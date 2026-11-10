import "server-only";

import path from "node:path";

import { Font, Link, Page, Path, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";

import { lineParts, isExercise, type CardLine } from "@/domain/training/card-lines";
import type { Discipline } from "@/domain/training/discipline";
import type { PdfNav } from "@/domain/training/pdf-agenda";

// Éléments communs aux PDF des programmes (phase 5, maquette CooryPdfDoc du handoff 12_PDF_SYSTEM) :
// polices, couleurs, en-tête, barre ‹ › cliquable, pied, logo. La maquette mesure 620 × 877 px pour
// une page A4 (595,28 × 841,89 pt) : chaque mesure de la maquette passe par u() pour garder ses
// proportions exactes. Un PDF ne lit pas les variables CSS du thème : couleurs en hexadécimal, celles
// de la maquette (document imprimable, fond blanc).

export const u = (px: number) => (px * 595.28) / 620;

export const INK = "#17151d";
export const INK_2 = "#4a4855";
export const MUTED = "#64626e";
export const VIOLET = "#6a3ee0";

// Discipline : texte de l'étiquette, fond de l'en-tête (14 %, Hyrox 24 %), bordure (45 %, Hyrox 70 %)
// mélangés au blanc comme dans la maquette, et la couleur pleine des puces.
export const disciplinePdf: Record<
  Discipline,
  { label: string; text: string; tint: string; border: string; fill: string }
> = {
  running: {
    label: "Running",
    text: "#4f4ed6",
    tint: "#ececff",
    border: "#c2c1ff",
    fill: "#7776ff",
  },
  strength: {
    label: "Musculation",
    text: "#b51f39",
    tint: "#fae2e6",
    border: "#f0a1ae",
    fill: "#dd2d4a",
  },
  hyrox: { label: "Hyrox", text: "#8a6200", tint: "#fff0d5", border: "#fed484", fill: "#fec14f" },
  hybrid: {
    label: "Hybride",
    text: "#0b7468",
    tint: "#e1f8f5",
    border: "#9de8df",
    fill: "#26cbb8",
  },
};

// Phases du sommaire, dans leur ordre (Base, Spécifique, Affûtage dans la maquette).
export const PHASE_COLORS = ["#7776ff", "#fec14f", "#26cbb8", "#dd2d4a"];

// ---------------------------------------------------------------------------
// Police : Plus Jakarta Sans intégrée au fichier (licence OFL, fichiers dans ./fonts).
// ---------------------------------------------------------------------------
export const FONT = "Plus Jakarta Sans";
let fontsReady = false;

export function registerPdfFonts() {
  if (fontsReady) return;
  const file = (name: string) =>
    path.join(process.cwd(), "src/features/programs/pdf/fonts", `PlusJakartaSans-${name}.ttf`);
  Font.register({
    family: FONT,
    fonts: [
      { src: file("Regular"), fontWeight: 400 },
      { src: file("Italic"), fontWeight: 400, fontStyle: "italic" },
      { src: file("Medium"), fontWeight: 500 },
      { src: file("SemiBold"), fontWeight: 600 },
      { src: file("Bold"), fontWeight: 700 },
      { src: file("ExtraBold"), fontWeight: 800 },
    ],
  });
  // Pas de césure « endur-ance » : un mot passe entier à la ligne.
  Font.registerHyphenationCallback((word) => [word]);
  fontsReady = true;
}

// La police n'a ni l'espace fine insécable (U+202F) ni le liant invisible (U+2060) : un signe absent
// s'imprimerait en carré vide.
export const pdfText = (text: string) => text.replace(/\u202f/g, "\u00a0").replace(/\u2060/g, "");

// « 10 min », « 4 × 6 », « Wall balls 20 » : l'unité et le nombre restent ensemble (comme dans l'app).
const glue = (text: string) =>
  pdfText(text)
    .replace(/(\d) (bpm|min|km|m|s|kg)\b/g, "$1\u00a0$2")
    .replace(/(\d) (\/500)/g, "$1\u00a0$2")
    .replace(/(\d) × (\d)/g, "$1\u00a0×\u00a0$2")
    .replace(/@ (\d)/g, "@\u00a0$1");

// ---------------------------------------------------------------------------
// Cadre d'une page : en-tête, barre de navigation, contenu, pied.
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  page: {
    paddingTop: u(28),
    paddingHorizontal: u(36),
    paddingBottom: u(18),
    flexDirection: "column",
    gap: u(12),
    fontFamily: FONT,
    color: INK,
    backgroundColor: "#ffffff",
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerText: { textAlign: "right", fontSize: u(10.5), lineHeight: 1.45, color: MUTED },
  headerStrong: { fontWeight: 600, color: INK },
  nav: { flexDirection: "row", alignItems: "center", gap: u(6) },
  side: {
    height: u(30),
    paddingHorizontal: u(10),
    borderRadius: u(7),
    borderWidth: u(1),
    flexDirection: "row",
    alignItems: "center",
    gap: u(5),
  },
  sideText: { fontSize: u(11), fontWeight: 600 },
  center: {
    flexGrow: 1,
    height: u(30),
    paddingHorizontal: u(12),
    borderRadius: u(7),
    backgroundColor: INK,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: u(7),
  },
  centerText: { fontSize: u(11.5), fontWeight: 700, color: "#ffffff" },
  spacer: { flexGrow: 1 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: u(8),
    borderTopWidth: u(1),
    borderTopColor: "#dcdae3",
    fontSize: u(10),
    color: MUTED,
  },
});

// Chevrons de la maquette (11 px, trait 2,6).
function Chevron({ to, color }: { to: "left" | "right" | "down"; color: string }) {
  const d = to === "left" ? "M15 18l-6-6 6-6" : to === "right" ? "M9 18l6-6-6-6" : "M6 9l6 6 6-6";
  return (
    <Svg width={u(11)} height={u(11)} viewBox="0 0 24 24">
      <Path
        d={d}
        stroke={color}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

// Logo Coory (kit de marque, version fond clair), 15 px de haut, jamais redessiné : les deux tracés
// du symbole et le mot COORY en Plus Jakarta Sans 800.
export function PdfLogo() {
  const scale = 15 / 72;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        flexShrink: 0,
        // Pas de hauteur fixe : React-PDF supprime une ligne de texte qui dépasse sa boîte.
        marginTop: u(3),
      }}
    >
      {/* Le texte réserve la place des jambages au-dessus et au-dessous des capitales : le symbole
          descend de 2,4 px pour rester centré sur les capitales, comme dans le kit de marque. */}
      <Svg
        width={u(240 * 0.5167 * scale)}
        height={u(120 * 0.5167 * scale)}
        viewBox="0 0 240 120"
        style={{ marginTop: u(2.4) }}
      >
        <Path
          fill="#17151D"
          d="M126.69 0H60A60 60 0 0 0 60 120H95.31L103.68 88H60A28 28 0 0 1 60 32H118.32Z"
        />
        <Path
          fill="#8B5CF6"
          d="M144.69 0H180A60 60 0 0 1 180 120H113.31L121.68 88H180A28 28 0 0 0 180 32H136.32Z"
        />
      </Svg>
      <Text
        style={{
          marginLeft: u((148 - 240 * 0.5167) * scale),
          fontSize: u(72 * scale),
          fontWeight: 800,
          letterSpacing: u(0.72 * scale),
          lineHeight: 1,
          flexShrink: 0,
          color: "#17151D",
        }}
      >
        COORY
      </Text>
    </View>
  );
}

function SideButton({ link, side }: { link: PdfNav["prev"]; side: "prev" | "next" }) {
  const color = link ? INK : "#c9c7d1";
  const box = [s.side, { borderColor: link ? "#cfcdd8" : "#ecebf1" }];
  const content = (
    <>
      {side === "prev" ? <Chevron to="left" color={color} /> : null}
      <Text style={[s.sideText, { color }]}>{link ? pdfText(link.label) : "—"}</Text>
      {side === "next" ? <Chevron to="right" color={color} /> : null}
    </>
  );
  return link ? (
    <Link src={`#${link.anchor}`} style={[...box, { textDecoration: "none" }]}>
      {content}
    </Link>
  ) : (
    <View style={box}>{content}</View>
  );
}

export function PdfPage({
  anchor,
  bookmark,
  nav,
  headerTitle,
  headerSubtitle,
  footer,
  pageNumber,
  totalPages,
  children,
}: {
  anchor: string;
  bookmark: string;
  nav: PdfNav;
  headerTitle: string;
  headerSubtitle: string;
  footer: string;
  pageNumber: number;
  totalPages: number;
  children: ReactNode;
}) {
  return (
    // Une page de la maquette = une page A4 du PDF ; son id est la destination nommée des liens
    // (sommaire, ‹ ›) et elle porte son signet. Pas de wrap={false} : React-PDF donnerait alors à la
    // page la hauteur de son contenu au lieu du format A4. Le contenu tient sur la page par
    // construction (fitWeek, paginate).
    <Page size="A4" style={s.page} id={anchor} bookmark={pdfText(bookmark)}>
      <View style={s.header}>
        <PdfLogo />
        <Text style={s.headerText}>
          <Text style={s.headerStrong}>{pdfText(headerTitle)}</Text>
          {"\n"}
          {pdfText(headerSubtitle)}
        </Text>
      </View>
      <View style={s.nav}>
        <SideButton link={nav.prev} side="prev" />
        <Link src={`#${nav.current.anchor}`} style={[s.center, { textDecoration: "none" }]}>
          <Text style={s.centerText}>{pdfText(nav.current.label)}</Text>
          <Chevron to="down" color="#ffffff" />
        </Link>
        <SideButton link={nav.next} side="next" />
      </View>
      {children}
      <View style={s.spacer} />
      <View style={s.footer}>
        <Text>{pdfText(footer)}</Text>
        <Text>{`Page ${pageNumber} sur ${totalPages}`}</Text>
      </View>
    </Page>
  );
}

// Titre de page : petit titre en capitales, grand titre, sous-titre, filet noir de 1,5 px.
export const titleStyles = StyleSheet.create({
  block: {
    flexDirection: "column",
    gap: u(2),
    paddingBottom: u(10),
    borderBottomWidth: u(1.5),
    borderBottomColor: INK,
  },
  kicker: {
    fontSize: u(10),
    fontWeight: 800,
    letterSpacing: u(10 * 0.07),
    textTransform: "uppercase",
    color: MUTED,
  },
  // Interligne 1 dans la maquette : en CSS les jambages débordent de la ligne sans la pousser ; React-PDF
  // les pose sur la ligne suivante, d'où 1,15 pour garder l'écart de la maquette avec le sous-titre.
  title: { fontSize: u(30), fontWeight: 800, letterSpacing: u(-30 * 0.03), lineHeight: 1.15 },
  subtitle: { fontSize: u(12), fontWeight: 500, color: INK_2 },
});

// ---------------------------------------------------------------------------
// Lignes d'une séance : mêmes règles que les cartes de l'agenda de l'app (puce devant chaque
// exercice, gras pour la durée ou le mouvement et son volume, italique pour la plage de FC).
// ---------------------------------------------------------------------------
const LINE_SIZE = 11;
const LINE_HEIGHT = 1.4;
const BULLET = 5;

function Rich({
  text,
  discipline,
  lineHeight,
}: {
  text: string;
  discipline: Discipline;
  lineHeight: number;
}) {
  return (
    <Text style={{ fontSize: u(LINE_SIZE), lineHeight, fontWeight: 500 }}>
      {lineParts(text, discipline).map((part, i) =>
        part.tone === "strong" ? (
          <Text key={i} style={{ fontWeight: 700, color: INK }}>
            {glue(part.text)}
          </Text>
        ) : part.tone === "soft" ? (
          <Text key={i} style={{ fontWeight: 400, fontStyle: "italic", color: INK_2 }}>
            {glue(part.text)}
          </Text>
        ) : (
          <Text key={i}>{glue(part.text)}</Text>
        ),
      )}
    </Text>
  );
}

function Item({
  text,
  discipline,
  lineHeight,
}: {
  text: string;
  discipline: Discipline;
  lineHeight: number;
}) {
  const exercise = isExercise(text);
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: u(6) }}>
      <View
        style={{
          width: u(BULLET),
          height: u(BULLET),
          borderRadius: u(BULLET / 2),
          marginTop: u((LINE_SIZE * lineHeight) / 2 - BULLET / 2),
          backgroundColor: exercise ? disciplinePdf[discipline].fill : "transparent",
        }}
      />
      <View style={{ flexShrink: 1, color: exercise ? INK : INK_2 }}>
        <Rich text={text} discipline={discipline} lineHeight={lineHeight} />
      </View>
    </View>
  );
}

export function SessionLines({
  lines,
  discipline,
  lineHeight = LINE_HEIGHT,
}: {
  lines: CardLine[];
  discipline: Discipline;
  // 1,4 dans les cartes de l'agenda ; plus serré dans les workloads des fiches.
  lineHeight?: number;
}) {
  const colors = disciplinePdf[discipline];
  return (
    <>
      {lines.map((line, i) =>
        line.kind === "line" ? (
          <Item key={i} text={line.text} discipline={discipline} lineHeight={lineHeight} />
        ) : (
          // Bloc répété (« 5 × ») ou bloc Hyrox (« AMRAP 20 min ») : son nom, puis ses lignes dont les
          // puces sont posées sur le trait du bloc (comme dans l'app).
          <View key={i} style={{ flexDirection: "column", gap: u(1) }}>
            <Text
              style={{
                fontSize: u(11),
                lineHeight,
                fontWeight: 700,
                color: colors.text,
              }}
            >
              {glue(line.kind === "repeat" ? `${line.times} ×` : line.label)}
            </Text>
            <View style={{ position: "relative", flexDirection: "column", gap: u(1) }}>
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: u(1.5),
                  width: u(2),
                  borderRadius: u(1),
                  backgroundColor: colors.fill,
                  opacity: 0.5,
                }}
              />
              {line.lines.map((text, j) => (
                <Item key={j} text={text} discipline={discipline} lineHeight={lineHeight} />
              ))}
            </View>
          </View>
        ),
      )}
    </>
  );
}
