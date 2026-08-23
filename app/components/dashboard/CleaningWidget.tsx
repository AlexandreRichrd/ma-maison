import { Link } from "react-router";

import { Card } from "~/components/ui";
import type { UserChores } from "~/lib/cleaning-api.server";

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
}: {
  // Daily chores are the ones most likely to be forgotten — shown
  // alongside the week's chores, not instead of them (see
  // my-home-backend/CLAUDE.md's Chore rotation section). Both are already
  // scoped to the signed-in user by the dashboard route — the full
  // two-person split still lives on the Cleaning page.
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
      <div className="flex flex-col gap-2">
        <PersonSection
          label="Aujourd'hui"
          chores={dayChores}
          emptyText="Rien à faire aujourd'hui."
        />
        <PersonSection
          label="Cette semaine"
          chores={weekChores}
          emptyText="Rien à faire cette semaine."
        />
      </div>
    </Card>
  );
}
