import { Link } from "react-router";

import { Card } from "~/components/ui";
import type { UserChores } from "~/lib/cleaning-api.server";
import { avatarColorFor } from "~/lib/user-colors";

function PersonSection({
  label,
  chores,
  emptyText,
}: {
  label: string;
  chores: UserChores["chores"];
  emptyText: string;
}) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold text-muted">{label}</div>
      {chores.length === 0 ? (
        <p className="py-1 pr-2.5 text-sm font-medium text-muted">{emptyText}</p>
      ) : (
        chores.map((chore) => (
          <div key={chore.id} className="py-1 pr-2.5 text-sm font-medium">
            {chore.name}
          </div>
        ))
      )}
    </div>
  );
}

export function CleaningWidget({
  dayChores,
  weekChores,
  stableOrderUserIds,
}: {
  // Daily chores are the ones most likely to be forgotten — shown
  // alongside the week's chores, not instead of them (see
  // my-home-backend/CLAUDE.md's Chore rotation section).
  dayChores: UserChores[];
  weekChores: UserChores[];
  // weekChores/dayChores may be reordered ("signed-in user first") —
  // colors are resolved against this stable household order instead, so
  // they never flip depending on who's looking. See lib/user-colors.ts.
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
      <div className="flex flex-col gap-3">
        {weekChores.map(({ user, chores: weeklyChores }) => {
          const daily = dayChores.find((entry) => entry.user.id === user.id)?.chores ?? [];
          return (
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
              <div className="flex flex-col gap-2 pl-[30px]">
                <PersonSection
                  label="Aujourd'hui"
                  chores={daily}
                  emptyText="Rien à faire aujourd'hui."
                />
                <PersonSection
                  label="Cette semaine"
                  chores={weeklyChores}
                  emptyText="Rien à faire cette semaine."
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
