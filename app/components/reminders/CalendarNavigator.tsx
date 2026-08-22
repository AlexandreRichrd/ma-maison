import { useEffect } from "react";
import { Link, useNavigate } from "react-router";

import {
  formatMonthLabel,
  formatWeekLabel,
  shiftIsoWeek,
  shiftIsoWeekByMonths,
} from "~/lib/week";

/** True for anything that should keep arrow keys as ordinary text-editing
 * input rather than calendar navigation — mirrors DayNavigator's guard. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );
}

export function CalendarNavigator({ view, week }: { view: "week" | "month"; week: string }) {
  const navigate = useNavigate();
  const isMonth = view === "month";
  const prevWeek = isMonth ? shiftIsoWeekByMonths(week, -1) : shiftIsoWeek(week, -1);
  const nextWeek = isMonth ? shiftIsoWeekByMonths(week, 1) : shiftIsoWeek(week, 1);
  const label = isMonth ? formatMonthLabel(week) : formatWeekLabel(week);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      if (event.key === "ArrowLeft") {
        navigate(`/reminders?view=${view}&week=${prevWeek}`);
      } else if (event.key === "ArrowRight") {
        navigate(`/reminders?view=${view}&week=${nextWeek}`);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [view, prevWeek, nextWeek, navigate]);

  return (
    <div className="mb-4 flex items-center justify-between gap-3.5">
      <Link
        to={`/reminders?view=${view}&week=${prevWeek}`}
        aria-label={isMonth ? "Mois précédent" : "Semaine précédente"}
        className="flex size-[34px] shrink-0 items-center justify-center rounded-lg border border-border bg-card text-base font-semibold"
      >
        ←
      </Link>
      <div className="min-w-0 flex-1 truncate text-center text-sm font-semibold tabular-nums text-muted">
        {label}
      </div>
      <Link
        to={`/reminders?view=${view}&week=${nextWeek}`}
        aria-label={isMonth ? "Mois suivant" : "Semaine suivante"}
        className="flex size-[34px] shrink-0 items-center justify-center rounded-lg border border-border bg-card text-base font-semibold"
      >
        →
      </Link>
    </div>
  );
}
