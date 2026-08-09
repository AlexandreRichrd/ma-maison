import { type HTMLAttributes } from "react";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "muted" | "accent";
};

const toneClasses: Record<NonNullable<BadgeProps["tone"]>, string> = {
  muted: "bg-surface text-muted",
  accent: "bg-nav-active text-accent",
};

export function Badge({ tone = "muted", className = "", ...props }: BadgeProps) {
  return (
    <span
      {...props}
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${toneClasses[tone]} ${className}`}
    />
  );
}
