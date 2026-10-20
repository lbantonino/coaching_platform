import { BRAND } from "@/config/brand";

export function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  const box =
    size === "sm" ? "size-7 text-[13px] rounded-[7px]" : "size-8 text-[15px] rounded-[9px]";
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        aria-hidden
        className={`${box} inline-flex items-center justify-center bg-accent font-semibold text-white`}
      >
        {BRAND.initial}
      </span>
      <span className="text-title font-semibold tracking-tight text-text">{BRAND.name}</span>
    </span>
  );
}
