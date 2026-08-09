import { useFetcher } from "react-router";

import { Button, Card } from "~/components/ui";
import type { Member, Reminder } from "~/db/schema";
import { avatarColorFor } from "~/lib/member-colors";

export function ReminderRow({
  reminder,
  members,
}: {
  reminder: Reminder;
  members: Member[];
}) {
  const fetcher = useFetcher();
  const done = fetcher.state !== "idle" ? !reminder.doneAt : reminder.doneAt != null;
  const assignee = members.find((member) => member.id === reminder.memberId);
  const chipColor = avatarColorFor(members, reminder.memberId);

  return (
    <Card className="flex items-center gap-3.5 p-4.5">
      <span
        className={`size-2.5 shrink-0 rounded-full ${done ? "bg-success" : "bg-accent"}`}
      />
      <div className="flex-1">
        <div className={`text-[15px] font-semibold ${done ? "text-muted line-through" : ""}`}>
          {reminder.title}
        </div>
        <div className="mt-1 flex items-center gap-2">
          {assignee && (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold text-accent-foreground ${chipColor}`}
            >
              {assignee.name}
            </span>
          )}
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
