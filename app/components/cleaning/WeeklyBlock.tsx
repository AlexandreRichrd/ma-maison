import type { UserChores } from "~/lib/cleaning-api.server";
import { withCurrentUserFirst } from "~/lib/cleaning-order";
import { avatarColorFor } from "~/lib/user-colors";
import { formatWeekLabel } from "~/lib/week";

import { ChoreColumn } from "./ChoreColumn";

/**
 * Always reflects whichever ISO week contains the day currently selected
 * in the day navigator above — never independently navigable. `key={isoWeek}`
 * forces a full remount (replaying the fade-in animation) whenever the
 * selected day crosses into a different week, so that transition is never
 * silent — see my-home-backend/CLAUDE.md's Chore rotation section.
 *
 * This block sits above the day navigator, so its height feeds directly
 * into where the navigator's arrows land — ChoreColumn's own min-height
 * floor (not repeated here) is what keeps a short week from collapsing
 * this block and shifting the navigator up. It's a floor, not a cap: an
 * unusually long week can still push the navigator down.
 */
export function WeeklyBlock({
  isoWeek,
  weekChores,
  currentUserId,
}: {
  isoWeek: string;
  weekChores: UserChores[];
  currentUserId: string;
}) {
  // households.member_order — the stable anchor colors are resolved
  // against, so they never flip depending on who's signed in, even
  // though the columns themselves are reordered below.
  const stableOrderUserIds = weekChores.map((entry) => entry.user.id);
  const orderedWeekChores = withCurrentUserFirst(weekChores, currentUserId);

  return (
    <div key={isoWeek} className="animate-fade-in mb-6">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-serif text-base font-semibold">Cette semaine</h2>
        <span className="text-sm font-medium text-muted">{formatWeekLabel(isoWeek)}</span>
      </div>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {orderedWeekChores.map((userChores) => (
          <ChoreColumn
            key={userChores.user.id}
            userChores={userChores}
            emptyStateText="Rien à faire cette semaine."
            avatarColorClassName={avatarColorFor(
              stableOrderUserIds.map((id) => ({ id })),
              userChores.user.id,
            )}
          />
        ))}
      </div>
    </div>
  );
}
