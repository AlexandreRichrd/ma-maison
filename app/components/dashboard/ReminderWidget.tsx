import { Link } from "react-router";

import { Card } from "~/components/ui";
import type { Reminder } from "~/db/schema";

export function ReminderWidget({ reminders }: { reminders: Reminder[] }) {
  return (
    <Card className="sm:col-span-2">
      <div className="mb-3.5 flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold">Rappels du jour</h2>
        <Link to="/reminders" className="text-sm font-semibold">
          Tout voir →
        </Link>
      </div>
      {reminders.length === 0 ? (
        <p className="text-sm text-muted">Rien à faire aujourd&rsquo;hui.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {reminders.map((reminder) => (
            <div
              key={reminder.id}
              className="flex items-center gap-3 rounded-lg bg-nav-active px-3 py-2.5"
            >
              <span className="size-2 shrink-0 rounded-full bg-accent" />
              <span className="flex-1 text-sm font-medium">{reminder.title}</span>
              <span className="text-sm font-medium text-muted">
                {new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(
                  reminder.dueAt,
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
