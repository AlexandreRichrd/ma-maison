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
        today ? "border-accent" : "border-border"
      } ${dimmed ? "opacity-40" : ""}`}
    >
      <button
        type="button"
        onClick={() => onAddClick(date)}
        aria-label={`Ajouter un rappel le ${format(date, "d MMMM", { locale: fr })}`}
        className="text-left text-xs font-semibold tabular-nums text-foreground"
      >
        {format(date, "d")}
      </button>
      <div className="flex flex-col gap-0.5 overflow-hidden">
        {reminders.map((reminder) => (
          <CompactReminderRow key={reminder.id} reminder={reminder} users={users} />
        ))}
      </div>
    </div>
  );
}
