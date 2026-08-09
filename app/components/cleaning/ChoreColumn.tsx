import { useFetcher } from "react-router";

import { Card } from "~/components/ui";
import type { MemberWeekChores } from "~/db/queries/cleaning.server";

const AVATAR_COLORS = ["bg-avatar-1", "bg-avatar-2"];

function ChoreRow({
  chore,
  isoWeek,
}: {
  chore: MemberWeekChores["chores"][number];
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
  memberChores,
  isoWeek,
  index,
}: {
  memberChores: MemberWeekChores;
  isoWeek: string;
  index: number;
}) {
  return (
    <Card>
      <div className="mb-3.5 flex items-center gap-2.5">
        <div
          className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold text-accent-foreground ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}
        >
          {memberChores.member.name.charAt(0)}
        </div>
        <span className="font-serif text-base font-semibold">{memberChores.member.name}</span>
      </div>
      <div className="flex flex-col gap-2">
        {memberChores.chores.map((chore) => (
          <ChoreRow key={chore.id} chore={chore} isoWeek={isoWeek} />
        ))}
      </div>
    </Card>
  );
}
