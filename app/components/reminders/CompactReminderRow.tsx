import { useFetcher } from "react-router";

import type { HouseholdMember } from "~/lib/household-api.server";
import type { Reminder } from "~/lib/reminders-api.server";
import { avatarColorFor } from "~/lib/user-colors";

/**
 * The desktop/tablet calendar grid's per-day chip — same done/undo toggle
 * and title styling as ReminderRow, compressed to fit several per day cell.
 * Deliberately below the app's usual ≥44px tap target: this view only
 * renders at the `sm:` breakpoint and up (see CalendarGrid), where mobile's
 * agenda list already reuses the full ReminderRow with a proper-sized
 * button — this compact row is the tradeoff a 7-column grid requires, not
 * a rule change.
 */
export function CompactReminderRow({
  reminder,
  users,
}: {
  reminder: Reminder;
  users: HouseholdMember[];
}) {
  const fetcher = useFetcher();
  const done = fetcher.state !== "idle" ? !reminder.doneAt : reminder.doneAt != null;

  return (
    <fetcher.Form method="post">
      <input type="hidden" name="intent" value="toggleReminder" />
      <input type="hidden" name="reminderId" value={reminder.id} />
      <button
        type="submit"
        disabled={fetcher.state !== "idle"}
        className="flex w-full items-center gap-1 rounded px-0.5 py-0.5 text-left hover:bg-surface disabled:cursor-not-allowed"
      >
        <span
          className={`size-1.5 shrink-0 rounded-full ${done ? "bg-success" : "bg-accent"}`}
        />
        <span
          className={`min-w-0 flex-1 truncate text-xs font-medium ${
            done ? "text-muted line-through" : "text-foreground"
          }`}
        >
          {reminder.title}
        </span>
        {reminder.assigneeIds.map((userId) => (
          <span
            key={userId}
            className={`size-1.5 shrink-0 rounded-full ${avatarColorFor(users, userId) ?? ""}`}
          />
        ))}
      </button>
    </fetcher.Form>
  );
}
