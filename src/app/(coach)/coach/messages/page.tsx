import { ArrowLeft, MessageSquare } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { z } from "zod";

import { EmptyState } from "@/components/ui/empty-state";
import { barBackClass, barBackIcon } from "@/components/layout/back-link";
import { MobileBarTitle } from "@/components/layout/mobile-bar";
import {
  PageBody,
  PageHeader,
  PageLoading,
  pageMainClass,
  phoneScreenMainClass,
} from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { getAthlete } from "@/features/athletes/queries";
import { requireCoach } from "@/features/auth/guards";
import { getThread, listConversations } from "@/features/messages/queries";
import { listSessionAthletes } from "@/features/sessions/actions";
import { FEATURES } from "@/config/features";
import { brusselsDayOf, dayShortLabel, messageTime, todayIsoInBrussels } from "@/lib/format";

import { Composer } from "./composer";
import { MarkThreadRead } from "./mark-read";
import { ConversationList, NewMessage, PlanButton, ThreadMenu } from "./messages-ui";

export const metadata: Metadata = {
  title: "Messages",
};

// Page Messages (prompt Claude Design §7 `/coach/messages`, D-35 ; kit « Coory Pages », page 07, D-131),
// côté coach : les conversations (une par sportif ; pas de groupes, décision 12) et le fil choisi,
// avec réponse. Ordinateur : deux cartes (liste de 340 px, 400 dès 1 280 ; le fil) à la hauteur de
// l'écran. « Nouveau message » (en-tête, « + » de la liste, bouton flottant) : choisir un sportif.
// Téléphone : la liste, puis le fil en plein écran avec « ← Conversations ». ?sportif= ouvre un fil
// (bouton « Répondre » du tableau de bord) et marque ses messages reçus comme lus. Filtre « Non lues »
// (02/11, ?filtre=non-lus) : seulement les conversations qui attendent une lecture (le fil ouvert reste
// dans la liste une fois lu) ; aucun fil ne s'ouvre tout seul. Le lien « Voir tous les messages non
// lus » de la cloche y mène.
export default function MessagesPage({ searchParams }: PageProps<"/coach/messages">) {
  // MVP espace coach seul (D-167) : page masquée, le code reste.
  if (!FEATURES.messages) notFound();
  return (
    <main className={`${pageMainClass} ${phoneScreenMainClass}`}>
      <Suspense fallback={<PageLoading />}>
        {searchParams.then((query) => (
          <Messages
            athleteParam={typeof query.sportif === "string" ? query.sportif : null}
            unreadOnly={query.filtre === "non-lus"}
          />
        ))}
      </Suspense>
    </main>
  );
}

const hourMinute = new Intl.DateTimeFormat("fr-BE", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Brussels",
});

// « 09:12 » aujourd'hui, « Hier · 09:12 », « Mar 20 · 09:12 ».
function stamp(isoTimestamp: string, today: string): string {
  const day = brusselsDayOf(isoTimestamp);
  const time = hourMinute.format(new Date(isoTimestamp));
  return day === today ? time : `${dayShortLabel(day, today)} · ${time}`;
}

async function Messages({
  athleteParam,
  unreadOnly,
}: {
  athleteParam: string | null;
  unreadOnly: boolean;
}) {
  // Garde-fou serveur : connecté ET membre actif d'une organisation, sinon redirection.
  const { memberships } = await requireCoach();
  const organizationId = memberships[0].organizationId;
  const today = todayIsoInBrussels();
  const conversations = await listConversations(organizationId);

  // Fil ouvert : celui demandé (s'il est bien de cette organisation), sinon sur ordinateur le plus récent.
  const requested = athleteParam && z.uuid().safeParse(athleteParam).success ? athleteParam : null;
  const selectedId = requested ?? (unreadOnly ? null : (conversations[0]?.athlete.id ?? null));
  const unreadCount = conversations.filter((conversation) => conversation.unread > 0).length;
  const shown = unreadOnly
    ? conversations.filter(
        (conversation) => conversation.unread > 0 || conversation.athlete.id === requested,
      )
    : conversations;
  const keep = unreadOnly ? "&filtre=non-lus" : "";
  const athlete = selectedId ? await getAthlete(organizationId, selectedId) : null;
  const thread = athlete ? await getThread(organizationId, athlete.id) : [];
  const unreadInThread = conversations.find((c) => c.athlete.id === athlete?.id)?.unread ?? 0;

  // Les messages du fil, regroupés par jour (« Aujourd'hui », « Hier », « Mar 20 »).
  const days: { day: string; messages: typeof thread }[] = [];
  for (const message of thread) {
    const day = brusselsDayOf(message.createdAt);
    const last = days.at(-1);
    if (last && last.day === day) last.messages.push(message);
    else days.push({ day, messages: [message] });
  }
  const card =
    "flex min-w-0 flex-col overflow-hidden rounded-[22px] bg-surface inset-ring inset-ring-line lg:rounded-[20px]";
  const loadAthletes = listSessionAthletes.bind(null, organizationId);

  return (
    <>
      <PageHeader
        title="Messages"
        subtitle="Conversations 1:1 avec tes sportifs."
        actions={<NewMessage variant="header" loadAthletes={loadAthletes} />}
      />
      {/* Téléphone, fil ouvert (demande d'Antonino du 05/11, D-138) : la carte de la conversation
          occupe tout l'écran, les messages défilent dedans, la saisie reste en bas de la carte. */}
      <PageBody fill screen={Boolean(requested)}>
        <div
          className={`grid min-h-0 gap-4 lg:flex-1 lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[400px_minmax(0,1fr)] ${requested ? "max-lg:flex-1 max-lg:grid-rows-[minmax(0,1fr)]" : ""}`}
        >
          {/* Liste : « Conversations », recherche, filtres, lignes. */}
          <section
            aria-labelledby="conversations-title"
            className={`${card} gap-4 pt-[18px] lg:min-h-0 lg:pt-6 ${requested ? "max-lg:hidden" : ""}`}
          >
            {/* Téléphone (kit) : la carte commence par la recherche ; le titre reste lu. */}
            <div className="flex items-center justify-between gap-3 px-4 max-lg:sr-only lg:px-[30px]">
              <h2
                id="conversations-title"
                className="text-[20px] leading-[normal] font-bold tracking-[-0.02em] lg:text-[22px]"
              >
                Conversations
              </h2>
              <NewMessage variant="plus" loadAthletes={loadAthletes} />
            </div>
            <ConversationList
              filters={
                conversations.length > 0 ? (
                  <nav
                    aria-label="Filtrer les conversations"
                    className="flex gap-1.5 px-4 lg:px-[30px]"
                  >
                    {[
                      { href: "/coach/messages", label: "Toutes", active: !unreadOnly },
                      {
                        href: "/coach/messages?filtre=non-lus",
                        label: `Non lues${unreadCount > 0 ? ` (${unreadCount})` : ""}`,
                        active: unreadOnly,
                      },
                    ].map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        scroll={false}
                        aria-current={item.active ? "page" : undefined}
                        className={`tap-44 flex h-9 items-center rounded-full px-3.5 text-[14px] leading-[normal] font-medium whitespace-nowrap transition-colors duration-150 ${
                          item.active
                            ? "bg-cta text-on-cta"
                            : "text-text inset-ring inset-ring-line-2 hover:bg-surface-2"
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                ) : null
              }
              empty={unreadOnly ? "Aucun message non lu." : "Aucune conversation pour l'instant."}
              rows={shown.map((conversation) => ({
                id: conversation.athlete.id,
                name: conversation.athlete.name,
                photoPath: conversation.athlete.photoPath,
                sex: conversation.athlete.sex,
                preview: `${conversation.lastFromCoach ? "Toi : " : ""}${conversation.lastBody}`,
                time: messageTime(conversation.lastAt, today),
                unread: conversation.unread,
                href: `/coach/messages?sportif=${conversation.athlete.id}${keep}`,
                active: conversation.athlete.id === athlete?.id,
              }))}
            />
          </section>

          {/* Le fil. */}
          <section
            aria-labelledby="thread-title"
            className={`${card} min-h-0 ${requested ? "" : "max-lg:hidden"}`}
          >
            {athlete ? (
              <>
                {/* Téléphone, fil ouvert : « ← Conversations » dans la barre du haut (D-117). */}
                {requested ? (
                  <MobileBarTitle>
                    <Link
                      href={unreadOnly ? "/coach/messages?filtre=non-lus" : "/coach/messages"}
                      className={barBackClass}
                    >
                      <ArrowLeft aria-hidden {...barBackIcon} className="shrink-0" />
                      <span className="truncate">Conversations</span>
                    </Link>
                  </MobileBarTitle>
                ) : null}
                <header className="flex items-center gap-3 border-b border-line px-4 py-3.5 lg:gap-4 lg:px-[30px] lg:py-5">
                  <Avatar
                    name={athlete.displayName}
                    photoPath={athlete.photoPath}
                    sex={athlete.sex}
                    size="lg"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <h2
                      id="thread-title"
                      className="truncate text-[17px] leading-[normal] font-semibold lg:text-[18px]"
                    >
                      {athlete.displayName}
                    </h2>
                    <Link
                      href={`/coach/o/${organizationId}/sportifs/${athlete.id}`}
                      className="-my-[13px] w-fit py-[13px] text-[14px] leading-[normal] font-medium text-violet-text underline-offset-4 hover:underline"
                    >
                      Voir la fiche
                    </Link>
                  </div>
                  {athlete.status === "archived" ? null : <PlanButton athleteId={athlete.id} />}
                  <ThreadMenu
                    name={athlete.displayName}
                    href={`/coach/o/${organizationId}/sportifs/${athlete.id}`}
                  />
                </header>
                {/* Le fil s'ouvre en bas, sur le dernier message (colonne inversée). Grand écran (D-135) :
                    messages et saisie centrés sur 860 px, la barre de défilement reste au bord. */}
                <ol
                  aria-label={`Messages avec ${athlete.displayName}`}
                  className="flex min-h-0 flex-auto flex-col-reverse gap-4 overflow-y-auto overscroll-contain px-4 py-5 lg:px-[max(30px,calc((100%-860px)/2))]"
                >
                  {thread.length === 0 ? (
                    <li className="text-[14px] text-muted">
                      Aucun message pour l&apos;instant. Écris le premier ci-dessous.
                    </li>
                  ) : (
                    [...days].reverse().map((group) => (
                      <li key={group.day} className="flex flex-col gap-4">
                        <p className="flex items-center gap-4 text-[13px] leading-[normal] font-medium text-faint">
                          <span aria-hidden className="h-px flex-1 bg-line" />
                          {dayShortLabel(group.day, today)}
                          <span aria-hidden className="h-px flex-1 bg-line" />
                        </p>
                        <ol className="flex flex-col gap-3">
                          {group.messages.map((message) => (
                            <li
                              key={message.id}
                              className={`flex max-w-[85%] flex-col gap-1.5 lg:max-w-[70%] ${
                                message.fromCoach ? "items-end self-end" : "items-start self-start"
                              }`}
                            >
                              <span className="sr-only">
                                {message.fromCoach ? "Toi" : athlete.displayName} :
                              </span>
                              <p
                                className={`rounded-[20px] px-[18px] py-3 text-[15.5px] leading-[1.45] whitespace-pre-line lg:text-[16px] ${
                                  message.fromCoach
                                    ? "rounded-br-[6px] bg-cta text-on-cta"
                                    : "rounded-bl-[6px] bg-surface-2"
                                }`}
                              >
                                {message.body}
                              </p>
                              <span className="px-1 text-[12px] leading-[normal] text-faint tabular">
                                {stamp(message.createdAt, today)}
                              </span>
                            </li>
                          ))}
                        </ol>
                      </li>
                    ))
                  )}
                </ol>
                {athlete.status === "archived" ? (
                  <p className="border-t border-line px-4 py-3.5 text-[14px] text-muted lg:px-[30px]">
                    Ce sportif est archivé : restaure sa fiche pour lui écrire.
                  </p>
                ) : (
                  <Composer
                    key={athlete.id}
                    organizationId={organizationId}
                    athleteId={athlete.id}
                  />
                )}
                {requested && unreadInThread > 0 ? (
                  <MarkThreadRead organizationId={organizationId} athleteId={athlete.id} />
                ) : null}
              </>
            ) : requested ? (
              <EmptyState icon={MessageSquare} title="Conversation introuvable">
                Ce sportif n&apos;existe pas ou n&apos;appartient pas à ton organisation.
              </EmptyState>
            ) : unreadOnly && shown.length > 0 ? (
              <EmptyState icon={MessageSquare} title="Choisis une conversation">
                Les conversations qui ont des messages non lus sont dans la liste.
              </EmptyState>
            ) : (
              <EmptyState icon={MessageSquare} title="Aucune conversation">
                Les messages de tes sportifs apparaîtront ici.
              </EmptyState>
            )}
          </section>
        </div>
        {/* Téléphone, liste : le bouton flottant « + » (nouveau message). */}
        {requested ? null : <NewMessage variant="fab" loadAthletes={loadAthletes} />}
      </PageBody>
    </>
  );
}
