"use client";

import { useEffect, useState } from "react";

import { checkField, type FieldRule } from "@/lib/field-checks";

import { errorTextClass } from "./form-styles";

const todayInBrussels = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Brussels" }).format(new Date());

// Message d'erreur d'un champ, vérifié quand on le quitte (audit apple-design du 28/10). Se place
// juste sous le champ `htmlFor` ; le champ passe en rouge (aria-invalid) et annonce le message
// (aria-describedby). Corrigé, l'erreur disparaît pendant la frappe, sans attendre de quitter.
export function FieldCheck({ htmlFor, rule }: { htmlFor: string; rule: FieldRule }) {
  const [error, setError] = useState<string | null>(null);
  const messageId = `${htmlFor}-check`;

  useEffect(() => {
    const input = document.getElementById(htmlFor) as HTMLInputElement | null;
    if (!input) return;
    const describe = (on: boolean) => {
      const ids = (input.getAttribute("aria-describedby") ?? "").split(" ").filter(Boolean);
      const next = on ? [...new Set([...ids, messageId])] : ids.filter((id) => id !== messageId);
      if (next.length > 0) input.setAttribute("aria-describedby", next.join(" "));
      else input.removeAttribute("aria-describedby");
    };
    const apply = (message: string | null) => {
      setError(message);
      if (message) input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
      describe(message !== null);
    };
    // Si le champ perd le focus parce qu'on appuie ailleurs (sur « Enregistrer »…), le message attend
    // la fin de l'appui : sinon il pousserait le bouton sous le doigt, et l'appui serait perdu.
    let pressing = false;
    const onPress = () => {
      pressing = true;
    };
    let pending = false;
    const onRelease = () => {
      pressing = false;
      if (!pending) return;
      pending = false;
      setTimeout(() => apply(checkField(rule, input.value, todayInBrussels())), 0);
    };
    const onBlur = () => {
      if (pressing) pending = true;
      else apply(checkField(rule, input.value, todayInBrussels()));
    };
    window.addEventListener("pointerdown", onPress, true);
    window.addEventListener("pointerup", onRelease, true);
    window.addEventListener("pointercancel", onRelease, true);
    const onInput = () => {
      if (input.getAttribute("aria-invalid") !== "true") return;
      if (checkField(rule, input.value, todayInBrussels()) === null) apply(null);
    };
    input.addEventListener("blur", onBlur);
    input.addEventListener("input", onInput);
    return () => {
      input.removeEventListener("blur", onBlur);
      input.removeEventListener("input", onInput);
      window.removeEventListener("pointerdown", onPress, true);
      window.removeEventListener("pointerup", onRelease, true);
      window.removeEventListener("pointercancel", onRelease, true);
    };
  }, [htmlFor, rule, messageId]);

  return error ? (
    <p id={messageId} className={errorTextClass}>
      {error}
    </p>
  ) : null;
}
