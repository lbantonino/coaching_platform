import { Dumbbell, Users } from "lucide-react";

import type { AccountKind } from "@/features/auth/signup-schemas";

// Choix du type de compte (prompt Claude Design §7.1) : deux grandes cartes radio. Choisie = filet
// rouge de 1,5 px, fond rouge doux, rond rempli. Vrais boutons radio (clavier, formulaire) ; leur nom
// accessible est le seul titre (« Coach », « Sportif »), la phrase sert de description.
const kinds: { value: AccountKind; title: string; text: string; icon: typeof Users }[] = [
  {
    value: "coach",
    title: "Coach",
    text: "Je crée des programmes et je suis mes sportifs.",
    icon: Users,
  },
  {
    value: "athlete",
    title: "Sportif",
    text: "Je suis les séances préparées par mon coach.",
    icon: Dumbbell,
  },
];

export function AccountKindCards({
  value,
  onChange,
}: {
  value: AccountKind;
  onChange: (kind: AccountKind) => void;
}) {
  return (
    <fieldset>
      <legend className="sr-only">Type de compte</legend>
      <div className="grid grid-cols-2 gap-2.5">
        {kinds.map(({ value: kind, title, text, icon: Icon }) => (
          <label
            key={kind}
            className="group/kind flex cursor-pointer flex-col gap-2.5 rounded-[16px] border-[1.5px] border-line-2 bg-surface p-4 transition-colors duration-150 has-checked:border-accent has-checked:bg-accent-soft has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
          >
            <input
              type="radio"
              name="kind"
              value={kind}
              checked={value === kind}
              onChange={() => onChange(kind)}
              aria-labelledby={`kind-${kind}-title`}
              aria-describedby={`kind-${kind}-text`}
              className="sr-only"
            />
            <span className="flex items-center justify-between">
              <span
                aria-hidden
                className="inline-flex size-[38px] items-center justify-center rounded-[11px] bg-surface-2 text-text"
              >
                <Icon size={19} strokeWidth={1.8} />
              </span>
              <span
                aria-hidden
                className="inline-flex size-[22px] items-center justify-center rounded-full border-2 border-line-2 group-has-checked/kind:border-accent"
              >
                <span className="size-2.5 rounded-full group-has-checked/kind:bg-accent" />
              </span>
            </span>
            <span id={`kind-${kind}-title`} className="font-display text-[18px] font-semibold">
              {title}
            </span>
            <span id={`kind-${kind}-text`} className="text-[13px] leading-[1.45] text-muted">
              {text}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
