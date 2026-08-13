import { Link } from "react-router";

import { Card } from "~/components/ui";
import type { UserWeekChores } from "~/lib/cleaning-api.server";
import { avatarColorFor } from "~/lib/user-colors";

export function CleaningWidget({
  weekChores,
  stableOrderUserIds,
}: {
  weekChores: UserWeekChores[];
  // weekChores may be reordered ("signed-in user first") — colors are
  // resolved against this stable household order instead, so they never
  // flip depending on who's looking. See lib/user-colors.ts.
  stableOrderUserIds: string[];
}) {
  return (
    <Card>
      <div className="mb-3.5 flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold">Ménage — par personne</h2>
        <Link to="/cleaning" className="text-sm font-semibold">
          Tout voir →
        </Link>
      </div>
      <div className="flex flex-col gap-2.5">
        {weekChores.map(({ user, chores }) => (
          <div key={user.id}>
            <div className="mb-1.5 flex items-center gap-2">
              <div
                className={`flex size-[22px] shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-accent-foreground ${avatarColorFor(
                  stableOrderUserIds.map((id) => ({ id })),
                  user.id,
                )}`}
              >
                {user.name.charAt(0)}
              </div>
              <span className="text-sm font-semibold">{user.name}</span>
            </div>
            {chores.length === 0 ? (
              <p className="py-1.5 pr-2.5 pl-[30px] text-sm font-medium text-muted">
                Rien à faire cette semaine.
              </p>
            ) : (
              chores.map((chore) => (
                <div key={chore.id} className="py-1.5 pr-2.5 pl-[30px] text-sm font-medium">
                  {chore.name}
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
