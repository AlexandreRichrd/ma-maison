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
      className={`relative flex min-h-[92px] flex-col gap-1 rounded-lg p-1.5 ${
        dimmed ? "bg-surface" : "bg-card"
      } ${today ? "ring-1 ring-accent" : ""}`}
    >
      {/* Fills the whole cell as the click target — a card-sized target,
       * not just the date number — while staying a sibling (not an
       * ancestor) of the reminder chips below, so their own toggle buttons
       * still get the click instead of this one. `relative` on both the
       * number and the reminders list below puts them in the same
       * z-index:auto stacking layer as this absolute button, ordered by
       * DOM position — since they come after it in markup, they paint on
       * top and receive their own clicks; empty cell space still falls
       * through to this button underneath. The card's border lives here,
       * not on the outer div, so hovering the actual clickable area is
       * what changes its color. */}
      <button
        type="button"
        onClick={() => onAddClick(date)}
        aria-label={`Ajouter un rappel le ${format(date, "d MMMM", { locale: fr })}${today ? " (aujourd'hui)" : ""}`}
        className="absolute inset-0 cursor-pointer rounded-lg border border-border transition-colors hover:border-accent"
      />
      <span
        className={`relative pointer-events-none inline-flex size-5 items-center justify-center rounded-full text-xs font-semibold tabular-nums ${
          today
            ? "bg-accent text-accent-foreground"
            : dimmed
              ? "text-muted"
              : "text-foreground"
        }`}
      >
        {/* Today isn't conveyed by color alone — a filled circle (shape,
         * not just a border/tint) is the same convention most calendar UIs
         * use, so it reads even without color perception. */}
        {format(date, "d")}
      </span>
      <div className="relative flex flex-col gap-0.5 overflow-hidden">
        {reminders.map((reminder) => (
          <CompactReminderRow key={reminder.id} reminder={reminder} users={users} />
        ))}
      </div>
    </div>
  );
}
