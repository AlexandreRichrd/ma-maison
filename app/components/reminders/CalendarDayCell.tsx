import { format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";

import type { HouseholdMember } from "~/lib/household-api.server";
import type { Reminder } from "~/lib/reminders-api.server";

import { CompactReminderRow } from "./CompactReminderRow";

export function CalendarDayCell({
  date,
  reminders,
  users,
  dimmed,
  onAddClick,
}: {
  date: Date;
  reminders: Reminder[];
  users: HouseholdMember[];
  dimmed: boolean;
  onAddClick: (date: Date) => void;
}) {
  const today = isSameDay(date, new Date());

  return (
    <div
      className={`flex min-h-[92px] flex-col gap-1 rounded-lg border p-1.5 ${
        dimmed ? "border-border bg-surface" : "border-border bg-card"
      } ${today ? "ring-1 ring-accent" : ""}`}
    >
      <button
        type="button"
        onClick={() => onAddClick(date)}
        aria-label={`Ajouter un rappel le ${format(date, "d MMMM", { locale: fr })}${today ? " (aujourd'hui)" : ""}`}
        className="text-left"
      >
        {/* Today isn't conveyed by color alone — a filled circle (shape,
         * not just a border/tint) is the same convention most calendar UIs
         * use, so it reads even without color perception. */}
        <span
          className={`inline-flex size-5 items-center justify-center rounded-full text-xs font-semibold tabular-nums ${
            today
              ? "bg-accent text-accent-foreground"
              : dimmed
                ? "text-muted"
                : "text-foreground"
          }`}
        >
          {format(date, "d")}
        </span>
      </button>
      <div className="flex flex-col gap-0.5 overflow-hidden">
        {reminders.map((reminder) => (
          <CompactReminderRow key={reminder.id} reminder={reminder} users={users} />
        ))}
      </div>
    </div>
  );
}
