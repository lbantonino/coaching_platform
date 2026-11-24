"use client";

import { BellRing, Check } from "lucide-react";
import { useEffect, useState, useTransition, type ReactNode } from "react";

import { buttonClass } from "@/components/ui/button";
import {
  deletePushSubscription,
  savePushSubscription,
  sendTestAlert,
} from "@/features/alerts/actions";

// Paramètres > Préférences : « Alertes des séances » (D-205). Le coach active les alertes sur CET
// appareil (téléphone ou ordinateur) : le navigateur demande la permission, s'abonne au service push,
// et Coory garde l'abonnement. Sur iPhone, Apple ne le permet qu'à Coory ajouté à l'écran d'accueil
// (iOS 16.4 ou plus) : on l'explique au lieu d'un bouton qui ne marcherait pas.
type State = "loading" | "unconfigured" | "unsupported" | "ios-install" | "denied" | "off" | "on";
type Message = { tone: "ok" | "error"; text: string } | null;

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

// Clé publique VAPID (base64url) en octets, comme l'attend PushManager.subscribe.
function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const base64 = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

const isIos = () =>
  /iPhone|iPad|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

async function readState(): Promise<{ state: State; endpoint: string | null }> {
  if (!PUBLIC_KEY) return { state: "unconfigured", endpoint: null };
  const supported =
    "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  if (!supported) {
    return { state: isIos() && !isStandalone() ? "ios-install" : "unsupported", endpoint: null };
  }
  if (Notification.permission === "denied") return { state: "denied", endpoint: null };
  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = await registration?.pushManager.getSubscription();
  return subscription
    ? { state: "on", endpoint: subscription.endpoint }
    : { state: "off", endpoint: null };
}

export function PushAlertsCard({
  card,
}: {
  card: (content: { title: string; description: string; children: ReactNode }) => ReactNode;
}) {
  const [state, setState] = useState<State>("loading");
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [message, setMessage] = useState<Message>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    readState()
      .then((read) => {
        if (!active) return;
        setState(read.state);
        setEndpoint(read.endpoint);
      })
      .catch(() => active && setState("unsupported"));
    return () => {
      active = false;
    };
  }, []);

  // La permission est demandée tout de suite, au geste du coach (exigé par Safari sur iPhone).
  const enable = () =>
    startTransition(async () => {
      setMessage(null);
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setState(permission === "denied" ? "denied" : "off");
          return;
        }
        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: keyBytes(PUBLIC_KEY),
        });
        const result = await savePushSubscription(subscription.toJSON());
        if (!result.ok) {
          await subscription.unsubscribe();
          setMessage({ tone: "error", text: result.error ?? "Réessaie dans un instant." });
          return;
        }
        setEndpoint(subscription.endpoint);
        setState("on");
        setMessage({ tone: "ok", text: "Alertes activées sur cet appareil." });
      } catch {
        setMessage({
          tone: "error",
          text: "Cet appareil n'a pas pu s'abonner aux alertes. Réessaie dans un instant.",
        });
      }
    });

  const disable = () =>
    startTransition(async () => {
      setMessage(null);
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();
      const current = subscription?.endpoint ?? endpoint;
      await subscription?.unsubscribe();
      if (current) await deletePushSubscription(current);
      setEndpoint(null);
      setState("off");
      setMessage({ tone: "ok", text: "Alertes désactivées sur cet appareil." });
    });

  const test = () =>
    startTransition(async () => {
      setMessage(null);
      if (!endpoint) return;
      const result = await sendTestAlert(endpoint);
      setMessage(
        result.ok
          ? { tone: "ok", text: "Alerte d'essai envoyée : elle arrive dans quelques secondes." }
          : { tone: "error", text: result.error ?? "Réessaie dans un instant." },
      );
    });

  const explanation: Partial<Record<State, string>> = {
    loading: "Vérification de cet appareil…",
    unconfigured: "Les alertes ne sont pas encore réglées sur ce serveur.",
    unsupported:
      "Ce navigateur ne reçoit pas les alertes. Essaie avec Chrome, Edge, Firefox ou Safari à jour.",
    "ios-install":
      "Sur iPhone, ajoute d'abord Coory à l'écran d'accueil : dans Safari, touche Partager, puis « Sur l'écran d'accueil ». Ouvre ensuite Coory depuis son icône et reviens ici.",
    denied:
      "Les notifications de Coory sont bloquées sur cet appareil. Autorise-les dans les réglages du navigateur (sur iPhone : Réglages > Notifications > Coory), puis reviens ici.",
  };

  return card({
    title: "Alertes des séances",
    description:
      "Choisis l'alerte dans chaque séance, comme sur l'iPhone. Elle arrive en notification sur les appareils où tu l'as activée ici.",
    children: (
      <div className="flex flex-col gap-3">
        {state === "on" ? (
          <p className="flex items-center gap-2 text-[14px] font-medium text-text md:text-[13px]">
            <Check aria-hidden size={16} strokeWidth={2.4} className="text-violet-text" />
            Les alertes arrivent sur cet appareil.
          </p>
        ) : explanation[state] ? (
          <p className="text-[13px] leading-[1.5] text-muted md:text-[12.5px]">
            {explanation[state]}
          </p>
        ) : null}
        {state === "off" ? (
          <button
            type="button"
            onClick={enable}
            disabled={pending}
            className={buttonClass({ className: "w-full md:w-fit" })}
          >
            <BellRing aria-hidden size={16} strokeWidth={2} />
            Activer les alertes sur cet appareil
          </button>
        ) : null}
        {state === "on" ? (
          <div className="flex flex-col gap-2 md:flex-row">
            <button
              type="button"
              onClick={test}
              disabled={pending}
              className={buttonClass({ variant: "outline", className: "w-full md:w-fit" })}
            >
              Envoyer une alerte d&apos;essai
            </button>
            <button
              type="button"
              onClick={disable}
              disabled={pending}
              className={buttonClass({ variant: "ghost", className: "w-full md:w-fit" })}
            >
              Désactiver sur cet appareil
            </button>
          </div>
        ) : null}
        {message ? (
          <p
            role={message.tone === "error" ? "alert" : "status"}
            className={`text-[13px] leading-[1.45] ${message.tone === "error" ? "text-alert" : "text-muted"}`}
          >
            {message.text}
          </p>
        ) : null}
      </div>
    ),
  });
}
