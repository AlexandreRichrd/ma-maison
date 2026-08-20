import { Link } from "react-router";

import { shiftIsoDate } from "~/lib/day";

export function DayNavigator({ isoDate, label }: { isoDate: string; label: string }) {
  return (
    <div className="mb-6 flex items-center gap-3.5">
      <Link
        to={`/cleaning?date=${shiftIsoDate(isoDate, -1)}`}
        aria-label="Jour précédent"
        className="flex size-[34px] items-center justify-center rounded-lg border border-border bg-card text-base font-semibold"
      >
        ←
      </Link>
      <div className="text-sm font-semibold text-muted">{label}</div>
      <Link
        to={`/cleaning?date=${shiftIsoDate(isoDate, 1)}`}
        aria-label="Jour suivant"
        className="flex size-[34px] items-center justify-center rounded-lg border border-border bg-card text-base font-semibold"
      >
        →
      </Link>
    </div>
  );
}
