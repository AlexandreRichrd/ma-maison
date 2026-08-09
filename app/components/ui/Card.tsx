import { type HTMLAttributes } from "react";

export const cardClassName =
  "block rounded-2xl border border-border bg-card p-5";

export function Card({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`${cardClassName} ${className}`} />;
}
