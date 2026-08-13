import { useFetcher } from "react-router";

import { Card } from "~/components/ui";
import type { UserWeekChores } from "~/lib/cleaning-api.server";

function ChoreRow({
  chore,
  isoWeek,
}: {
  chore: UserWeekChores["chores"][number];
  isoWeek: string;
}) {
  const fetcher = useFetcher();
  const done = fetcher.state !== "idle" ? !chore.done : chore.done;

  return (
    <fetcher.Form method="post">
      <input type="hidden" name="intent" value="toggleChore" />
      <input type="hidden" name="choreId" value={chore.id} />
      <input type="hidden" name="isoWeek" value={isoWeek} />
      <label className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg bg-surface px-3 py-2.5">
        <input
          type="checkbox"
          checked={done}
          onChange={(event) => fetcher.submit(event.currentTarget.form)}
          className="size-[18px] shrink-0 accent-accent"
        />
        <span className={`flex-1 text-sm font-medium ${done ? "text-muted line-through" : ""}`}>
          {chore.name}
        </span>
        <span className="text-xs font-medium text-muted">{chore.tag}</span>
      </label>
    </fetcher.Form>
  );
}

export function ChoreColumn({
  userChores,
  isoWeek,
  avatarColorClassName,
}: {
  userChores: UserWeekChores;
  isoWeek: string;
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
            Rien à faire cette semaine.
          </p>
        ) : (
          userChores.chores.map((chore) => (
            <ChoreRow key={chore.id} chore={chore} isoWeek={isoWeek} />
          ))
        )}
      </div>
    </Card>
  );
}
