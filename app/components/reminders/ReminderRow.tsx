import { useFetcher } from "react-router";

import { Button, Card } from "~/components/ui";
import type { HouseholdMember } from "~/db/queries/household.server";
import type { Reminder } from "~/lib/reminders-api.server";

import { AssigneeChips } from "./AssigneeChips";

export function ReminderRow({
  reminder,
  users,
}: {
  reminder: Reminder;
  users: HouseholdMember[];
}) {
  const fetcher = useFetcher();
  const done = fetcher.state !== "idle" ? !reminder.doneAt : reminder.doneAt != null;

  return (
    <Card className="flex items-center gap-3.5 p-4.5">
      <span
        className={`size-2.5 shrink-0 rounded-full ${done ? "bg-success" : "bg-accent"}`}
      />
      <div className="flex-1">
        <div className={`text-[15px] font-semibold ${done ? "text-muted line-through" : ""}`}>
          {reminder.title}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <AssigneeChips assigneeIds={reminder.assigneeIds} users={users} />
          <span className="text-sm font-medium text-muted">
            {new Intl.DateTimeFormat("fr-FR", {
              weekday: "short",
              hour: "2-digit",
              minute: "2-digit",
            }).format(reminder.dueAt)}
          </span>
        </div>
      </div>
      <fetcher.Form method="post">
        <input type="hidden" name="intent" value="toggleReminder" />
        <input type="hidden" name="reminderId" value={reminder.id} />
        <Button type="submit" variant="secondary" disabled={fetcher.state !== "idle"}>
          {done ? "Annuler" : "Terminé"}
        </Button>
      </fetcher.Form>
    </Card>
  );
}
