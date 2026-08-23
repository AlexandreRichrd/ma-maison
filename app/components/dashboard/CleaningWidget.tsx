import { Link } from "react-router";

import { Card } from "~/components/ui";
import type { UserChores } from "~/lib/cleaning-api.server";

export function CleaningWidget({
  dayChores,
  weekChores,
}: {
  // Daily chores are the ones most likely to be forgotten — shown as the
  // primary checklist, same row treatment as ReminderWidget's "today"
  // items, so the two read as one visual language. Week chores are
  // secondary context, not due specifically today, so they're deemphasized
  // below rather than given the same weight (see
  // my-home-backend/CLAUDE.md's Chore rotation section for why the two
  // sets are disjoint, not day-chores-within-week-chores). Both are
  // already scoped to the signed-in user by the dashboard route — the
  // full two-person split still lives on the Cleaning page.
  dayChores: UserChores["chores"];
  weekChores: UserChores["chores"];
}) {
  return (
    <Card>
      <div className="mb-3.5 flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold">Mes tâches de ménage</h2>
        <Link to="/cleaning" className="text-sm font-semibold">
          Tout voir →
        </Link>
      </div>

      {dayChores.length === 0 ? (
        <p className="text-sm text-muted">Rien à faire aujourd&rsquo;hui.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {dayChores.map((chore) => (
            <div
              key={chore.id}
              className="flex items-center gap-3 rounded-lg bg-nav-active px-3 py-2.5"
            >
              <span className="size-2 shrink-0 rounded-full bg-accent" />
              <span className="text-sm font-medium">{chore.name}</span>
            </div>
          ))}
        </div>
      )}

      {weekChores.length > 0 && (
        <div className="mt-3.5 border-t border-border pt-3">
          <div className="mb-1.5 text-xs font-semibold text-muted">Cette semaine</div>
          <div className="flex flex-wrap gap-1.5">
            {weekChores.map((chore) => (
              <span
                key={chore.id}
                className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted"
              >
                {chore.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
