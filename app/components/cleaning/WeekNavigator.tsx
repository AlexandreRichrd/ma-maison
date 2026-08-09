import { Link } from "react-router";

import { shiftIsoWeek } from "~/lib/week";

export function WeekNavigator({ isoWeek, label }: { isoWeek: string; label: string }) {
  return (
    <div className="mb-6 flex items-center gap-3.5">
      <Link
        to={`/cleaning?week=${shiftIsoWeek(isoWeek, -1)}`}
        aria-label="Semaine précédente"
        className="flex size-[34px] items-center justify-center rounded-lg border border-border bg-card text-base font-semibold"
      >
        ←
      </Link>
      <div className="text-sm font-semibold text-muted">{label}</div>
      <Link
        to={`/cleaning?week=${shiftIsoWeek(isoWeek, 1)}`}
        aria-label="Semaine suivante"
        className="flex size-[34px] items-center justify-center rounded-lg border border-border bg-card text-base font-semibold"
      >
        →
      </Link>
    </div>
  );
}
