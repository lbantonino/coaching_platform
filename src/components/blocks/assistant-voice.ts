"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import {
  dictationErrorText,
  mergeDictation,
  speechRecognitionCtor,
  type SpeechRecognitionLike,
} from "@/features/assistant/dictation";

// Dictée de l'Assistant IA (D-173) : la reconnaissance vocale du navigateur écrit, en direct, dans la
// saisie (après ce qui y était déjà). Le coach relit puis envoie lui-même : rien ne part seul.
// « Arrêter » garde ce qui a été entendu ; envoyer ou écrire au clavier coupe l'écoute.
const subscribe = () => () => {};
const browserCanDictate = () => speechRecognitionCtor(window) !== null;
const serverCanDictate = () => false;

export function useDictation(read: () => string, write: (text: string) => void) {
  // Après l'hydratation seulement (le serveur ne connaît pas le navigateur) : pas d'écart de rendu.
  const supported = useSyncExternalStore(subscribe, browserCanDictate, serverCanDictate);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const current = useRef<SpeechRecognitionLike | null>(null);

  // Coupe l'écoute sans rien ajouter de plus (envoi, saisie au clavier, fermeture).
  const cancel = useCallback(() => {
    const recognition = current.current;
    current.current = null;
    recognition?.abort();
    setListening(false);
  }, []);

  useEffect(() => cancel, [cancel]);

  const toggle = useCallback(() => {
    if (current.current) {
      current.current.stop();
      return;
    }
    const Recognition = speechRecognitionCtor(window);
    if (!Recognition) return;
    const recognition = new Recognition();
    recognition.lang = "fr-FR";
    recognition.continuous = true;
    recognition.interimResults = true;
    const base = read();
    recognition.onresult = (event) => {
      if (current.current !== recognition) return;
      let spoken = "";
      for (let index = 0; index < event.results.length; index++) {
        spoken += event.results[index][0]?.transcript ?? "";
      }
      write(mergeDictation(base, spoken));
    };
    recognition.onerror = (event) => setError(dictationErrorText(event.error));
    recognition.onend = () => {
      if (current.current === recognition) current.current = null;
      setListening(false);
    };
    setError(null);
    current.current = recognition;
    setListening(true);
    try {
      recognition.start();
    } catch {
      current.current = null;
      setListening(false);
      setError(dictationErrorText(""));
    }
  }, [read, write]);

  return { supported, listening, error, toggle, cancel };
}
