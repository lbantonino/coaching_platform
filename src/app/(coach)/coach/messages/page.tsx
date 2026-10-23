import { ArrowLeft, MessageSquare } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { z } from "zod";

import { EmptyState } from "@/components/ui/empty-state";
import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getAthlete } from "@/features/athletes/queries";
import { requireCoach } from "@/features/auth/guards";
import { getThread, listConversations } from "@/features/messages/queries";
import { brusselsDayOf, dayShortLabel, messageTime, todayIsoInBrussels } from "@/lib/format";

import { Composer } from "./composer";
import { MarkThreadRead } from "./mark-read";

export const metadata: Metadata = {
  title: "Messages",
};

// Page Messages (prompt Claude Design §7 `/coach/messages`, D-35), côté coach : les conversations (une
// par sportif) et le fil choisi, avec réponse. Ordinateur : liste 4 colonnes + fil 8 colonnes.
// Téléphone : la liste, puis le fil en plein écran avec « ← Conversations ». ?sportif= ouvre un fil
// (bouton « Répondre » du tableau de bord) et marque ses messages reçus comme lus.
export default function MessagesPage({ searchParams }: PageProps<"/coach/messages">) {
  return (
    <main className={pageMainClass}>
      <Suspense fallback={<PageLoading />}>
        {searchParams.then((query) => (
          <Messages athleteParam={typeof query.sportif === "string" ? query.sportif : null} />
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

async function Messages({ athleteParam }: { athleteParam: string | null }) {
  // Garde-fou serveur : connecté ET membre actif d'une organisation, sinon redirection.
  const { memberships } = await requireCoach();
  const organizationId = memberships[0].organizationId;
  const today = todayIsoInBrussels();
  const conversations = await listConversations(organizationId);

  // Fil ouvert : celui demandé (s'il est bien de cette organisation), sinon sur ordinateur le plus récent.
  const requested = athleteParam && z.uuid().safeParse(athleteParam).success ? athleteParam : null;
  const selectedId = requested ?? conversations[0]?.athlete.id ?? null;
  const athlete = selectedId ? await getAthlete(organizationId, selectedId) : null;
  const thread = athlete ? await getThread(organizationId, athlete.id) : [];
  const unreadInThread = conversations.find((c) => c.athlete.id === athlete?.id)?.unread ?? 0;

  return (
    <>
      <PageHeader title="Messages" subtitle="Conversations 1:1 avec tes sportifs." />
      <PageBody grid>
        <section
          aria-labelledby="conversations-title"
          className={`flex min-w-0 flex-col gap-3 rounded-card border border-line bg-surface p-[18px] lg:col-span-4 lg:self-start ${
            requested ? "max-lg:hidden" : ""
          }`}
        >
          <h2 id="conversations-title" className="font-display text-block font-semibold">
            Conversations
          </h2>
          {conversations.length === 0 ? (
            <p className="border-t border-line pt-3.5 text-[14px] text-muted">
              Aucune conversation pour l&apos;instant.
            </p>
          ) : (
            <ul className="flex flex-col">
              {conversations.map((conversation) => {
                const active = conversation.athlete.id === athlete?.id;
                return (
                  <li key={conversation.athlete.id}>
                    <Link
                      href={`/coach/messages?sportif=${conversation.athlete.id}`}
                      scroll={false}
                      aria-current={active ? "page" : undefined}
                      className={`-mx-2 flex min-h-16 items-center gap-3 rounded-[12px] border-t border-line px-2 py-2.5 transition-colors duration-150 hover:bg-surface-2 ${
                        active ? "lg:bg-surface-2" : ""
                      }`}
                    >
                      <Avatar
                        name={conversation.athlete.name}
                        photoPath={conversation.athlete.photoPath}
                        sex={conversation.athlete.sex}
                      />
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="flex min-w-0 items-baseline gap-2">
                          <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">
                            {conversation.athlete.name}
                          </span>
                          <span className="shrink-0 font-mono text-[11px] text-muted tabular">
                            {messageTime(conversation.lastAt, today)}
                          </span>
                        </span>
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="min-w-0 flex-1 truncate text-[13px] text-muted">
                            {conversation.lastFromCoach ? "Toi : " : ""}
                            {conversation.lastBody}
                          </span>
                          {conversation.unread > 0 ? (
                            <Badge tone="live">
                              {conversation.unread} non lu{conversation.unread > 1 ? "s" : ""}
                            </Badge>
                          ) : null}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section
          aria-labelledby="thread-title"
          className={`flex min-w-0 flex-col gap-3.5 rounded-card border border-line bg-surface p-[18px] lg:col-span-8 ${
            requested ? "" : "max-lg:hidden"
          }`}
        >
          {athlete ? (
            <>
              <Link
                href="/coach/messages"
                className="inline-flex min-h-11 w-fit items-center gap-1.5 text-[14px] text-muted hover:text-text lg:hidden"
              >
                <ArrowLeft aria-hidden size={16} strokeWidth={1.8} />
                Conversations
              </Link>
              <header className="flex items-center gap-3">
                <Avatar
                  name={athlete.displayName}
                  photoPath={athlete.photoPath}
                  sex={athlete.sex}
                />
                <div className="flex min-w-0 flex-1 flex-col">
                  <h2 id="thread-title" className="truncate font-display text-block font-semibold">
                    {athlete.displayName}
                  </h2>
                  <Link
                    href={`/coach/o/${organizationId}/sportifs/${athlete.id}`}
                    className="w-fit text-[13px] text-muted underline-offset-4 hover:text-text hover:underline"
                  >
                    Voir la fiche
                  </Link>
                </div>
              </header>
              {/* Le fil s'ouvre en bas, sur le dernier message (colonne inversée). */}
              <ol
                aria-label={`Messages avec ${athlete.displayName}`}
                className="flex max-h-[55dvh] min-h-40 flex-col-reverse gap-3 overflow-y-auto border-t border-line pt-3.5"
              >
                {thread.length === 0 ? (
                  <li className="text-[14px] text-muted">
                    Aucun message pour l&apos;instant. Écris le premier ci-dessous.
                  </li>
                ) : (
                  [...thread].reverse().map((message) => (
                    <li
                      key={message.id}
                      className={`flex max-w-[85%] flex-col gap-1 lg:max-w-[70%] ${
                        message.fromCoach ? "items-end self-end" : "items-start self-start"
                      }`}
                    >
                      <span className="sr-only">
                        {message.fromCoach ? "Toi" : athlete.displayName} :
                      </span>
                      <p
                        className={`rounded-[18px] px-3.5 py-2.5 text-[15px] leading-normal whitespace-pre-line ${
                          message.fromCoach
                            ? "rounded-br-[6px] bg-inv text-on-inv"
                            : "rounded-bl-[6px] bg-surface-2"
                        }`}
                      >
                        {message.body}
                      </p>
                      <span className="font-mono text-[11px] text-muted tabular">
                        {stamp(message.createdAt, today)}
                      </span>
                    </li>
                  ))
                )}
              </ol>
              {athlete.status === "archived" ? (
                <p className="border-t border-line pt-3.5 text-[14px] text-muted">
                  Ce sportif est archivé : restaure sa fiche pour lui écrire.
                </p>
              ) : (
                <Composer key={athlete.id} organizationId={organizationId} athleteId={athlete.id} />
              )}
              {requested && unreadInThread > 0 ? (
                <MarkThreadRead organizationId={organizationId} athleteId={athlete.id} />
              ) : null}
            </>
          ) : requested ? (
            <EmptyState icon={MessageSquare} title="Conversation introuvable">
              Ce sportif n&apos;existe pas ou n&apos;appartient pas à ton organisation.
            </EmptyState>
          ) : (
            <EmptyState icon={MessageSquare} title="Aucune conversation">
              Les messages de tes sportifs apparaîtront ici.
            </EmptyState>
          )}
        </section>
      </PageBody>
    </>
  );
}
