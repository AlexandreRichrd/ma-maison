import { data } from "react-router";

import { PageHeader } from "~/components/layout/PageHeader";
import { ReminderRow } from "~/components/reminders/ReminderRow";
import { getReminders, toggleReminder } from "~/db/queries/reminders.server";
import { toggleReminderSchema } from "~/lib/validation";

import type { Route } from "./+types/reminders";

export function meta() {
  return [{ title: "Reminders · Hearth" }];
}

export async function loader() {
  const reminders = await getReminders();
  return { reminders };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const result = toggleReminderSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    return data({ errors: result.error.flatten().fieldErrors }, { status: 400 });
  }
  await toggleReminder(result.data.reminderId);
  return { ok: true };
}

export default function Reminders({ loaderData }: Route.ComponentProps) {
  return (
    <div>
      <PageHeader title="Reminders" />
      <div className="flex max-w-[640px] flex-col gap-2.5">
        {loaderData.reminders.map((reminder) => (
          <ReminderRow key={reminder.id} reminder={reminder} />
        ))}
      </div>
    </div>
  );
}
