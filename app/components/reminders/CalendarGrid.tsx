import { format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";

import { formatIsoDate } from "~/lib/day";
import type { HouseholdMember } from "~/lib/household-api.server";
import type { Reminder } from "~/lib/reminders-api.server";
import { isInMonthOf, isoWeekDays } from "~/lib/week";

import { CalendarDayCell } from "./CalendarDayCell";
import { ReminderRow } from "./ReminderRow";

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

/**
 * Week view is just a month grid with one week row — both render through
 * this one component. Two responsive layouts, not a shared markup tree:
 * a real 7-column grid at `sm:` and up (CalendarDayCell, compact chips),
 * and a vertical agenda of full day sections below it — a 7-column grid
 * doesn't fit a phone width for reminder titles/chips (see issue #7's
 * mobile-layout question).
 */
export function CalendarGrid({
  weeks,
  monthAnchor,
  remindersByDay,
  users,
  onAddClick,
}: {
  weeks: string[];
  /** Set only in month view — days outside this month's calendar (the
   * grid's leading/trailing padding) render dimmed. Unset in week view,
   * where every day shown belongs to the displayed week regardless. */
  monthAnchor?: string;
  remindersByDay: Map<string, Reminder[]>;
  users: HouseholdMember[];
  onAddClick: (date: Date) => void;
}) {
  const days = weeks.flatMap((week) => isoWeekDays(week));

  return (
    <div>
      <div className="hidden sm:block">
        <div className="mb-1 grid grid-cols-7 gap-2">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="text-center text-xs font-semibold text-muted">
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((date) => {
            const key = formatIsoDate(date);
            return (
              <CalendarDayCell
                key={key}
                date={date}
                reminders={remindersByDay.get(key) ?? []}
                users={users}
                dimmed={monthAnchor ? !isInMonthOf(date, monthAnchor) : false}
                onAddClick={onAddClick}
              />
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:hidden">
        {days.map((date) => {
          const key = formatIsoDate(date);
          const dayReminders = remindersByDay.get(key) ?? [];
          const today = isSameDay(date, new Date());
          return (
            <div key={key}>
              <button
                type="button"
                onClick={() => onAddClick(date)}
                className={`mb-1.5 flex min-h-11 w-full items-center justify-between rounded-lg px-1 text-left ${
                  today ? "text-accent" : "text-foreground"
                }`}
              >
                <span className="text-sm font-semibold capitalize">
                  {format(date, "EEEE d MMMM", { locale: fr })}
                </span>
                <span className="text-xs font-semibold text-muted">+ Ajouter</span>
              </button>
              {dayReminders.length === 0 ? (
                <p className="px-1 text-sm text-muted">Rien.</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {dayReminders.map((reminder) => (
                    <ReminderRow key={reminder.id} reminder={reminder} users={users} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
