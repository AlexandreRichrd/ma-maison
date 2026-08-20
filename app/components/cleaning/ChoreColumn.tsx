import { Card } from "~/components/ui";
import type { UserChores } from "~/lib/cleaning-api.server";

import { ChoreItem } from "./ChoreItem";

export function ChoreColumn({
  userChores,
  emptyStateText,
  avatarColorClassName,
}: {
  userChores: UserChores;
  // "Rien à faire cette semaine." for the weekly block, "Aucune corvée ce
  // jour-là." for the day view — never a blank column either way (see
  // my-home/CLAUDE.md's Chore rotation section).
  emptyStateText: string;
  // Resolved by the caller from the user's *stable* household position
  // (see lib/user-colors.ts), never from display order — this column may
  // be shown reordered ("signed-in user first"), and the color must not
  // flip depending on who's looking.
  avatarColorClassName: string | undefined;
}) {
  return (
    <Card>
      <div className="mb-3.5 flex items-center gap-2.5">
        <div
          className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold text-accent-foreground ${avatarColorClassName}`}
        >
          {userChores.user.name.charAt(0)}
        </div>
        <span className="font-serif text-base font-semibold">{userChores.user.name}</span>
      </div>
      <div className="flex flex-col gap-2">
        {userChores.chores.length === 0 ? (
          <p className="rounded-lg bg-surface px-3 py-2.5 text-sm font-medium text-muted">
            {emptyStateText}
          </p>
        ) : (
          userChores.chores.map((chore) => <ChoreItem key={chore.id} chore={chore} />)
        )}
      </div>
    </Card>
  );
}
