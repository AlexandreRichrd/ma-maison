import { useEffect } from "react";
import { Link, useNavigate } from "react-router";

import { shiftIsoDate } from "~/lib/day";

/** True for anything that should keep arrow keys as ordinary text-editing
 * input rather than day navigation. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );
}

export function DayNavigator({ isoDate, label }: { isoDate: string; label: string }) {
  const navigate = useNavigate();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      if (event.key === "ArrowLeft") {
        navigate(`/cleaning?date=${shiftIsoDate(isoDate, -1)}`);
      } else if (event.key === "ArrowRight") {
        navigate(`/cleaning?date=${shiftIsoDate(isoDate, 1)}`);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isoDate, navigate]);

  return (
    // justify-between + shrink-0 arrows anchor them to fixed edge
    // positions regardless of label length — the label is the only
    // flexible zone (flex-1 min-w-0), so clicking through several days in
    // a row never shifts the arrows. tabular-nums keeps day-number width
    // constant too (1 vs 8 vs 11).
    <div className="mb-6 flex items-center justify-between gap-3.5">
      <Link
        to={`/cleaning?date=${shiftIsoDate(isoDate, -1)}`}
        aria-label="Jour précédent"
        className="flex size-[34px] shrink-0 items-center justify-center rounded-lg border border-border bg-card text-base font-semibold"
      >
        ←
      </Link>
      <div className="min-w-0 flex-1 truncate text-center text-sm font-semibold tabular-nums text-muted">
        {label}
      </div>
      <Link
        to={`/cleaning?date=${shiftIsoDate(isoDate, 1)}`}
        aria-label="Jour suivant"
        className="flex size-[34px] shrink-0 items-center justify-center rounded-lg border border-border bg-card text-base font-semibold"
      >
        →
      </Link>
    </div>
  );
}
