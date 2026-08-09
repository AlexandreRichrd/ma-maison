import { and, asc, eq, isNull, lte } from "drizzle-orm";
import { endOfDay } from "date-fns";

import { db } from "~/db/index.server";
import { reminders, type Reminder } from "~/db/schema";

export async function getReminders(): Promise<Reminder[]> {
  return db.select().from(reminders).orderBy(asc(reminders.dueAt));
}

/** Undone reminders due by end of today, for the dashboard widget. */
export async function getDueTodayReminders(): Promise<Reminder[]> {
  return db
    .select()
    .from(reminders)
    .where(and(isNull(reminders.doneAt), lte(reminders.dueAt, endOfDay(new Date()))))
    .orderBy(asc(reminders.dueAt));
}

export async function toggleReminder(reminderId: string): Promise<void> {
  const [reminder] = await db
    .select()
    .from(reminders)
    .where(eq(reminders.id, reminderId))
    .limit(1);
  if (!reminder) throw new Error("Reminder not found");

  await db
    .update(reminders)
    .set({
      doneAt: reminder.doneAt ? null : new Date(),
      updatedAt: new Date(),
    })
    .where(eq(reminders.id, reminderId));
}
